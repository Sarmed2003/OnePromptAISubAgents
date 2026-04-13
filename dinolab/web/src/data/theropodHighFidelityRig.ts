/**
 * High-fidelity 3D mesh list for non–T. rex taxa (velociraptor, pteranodon).
 * Mirrors T. rex granularity: split skull, bilateral mandibles, 7 cervicals, 6 dorsals, sacrum,
 * rib pairs, gastralia, 8 caudals, mirrored appendicular elements, ribs core + shafts.
 */
import {
  getBoneSegmentsForSpecies,
  getRibCageShafts,
  mirrorSegmentZ,
  Z_MIRRORED_BONE_IDS,
  type BoneSegmentDef,
  type Vec3,
} from "./skeleton3dSegments";
import type { BoneId } from "./anatomyShapes";
import { GASTRALIA_COPY, getCoarseBoneCopy } from "./species/sharedBones";
import type { BoneRecord } from "./types";

function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function seg(a: Vec3, b: Vec3, r: number): BoneSegmentDef {
  return { from: a, to: b, radius: Math.max(0.012, r) };
}

function subdivideBone(s: BoneSegmentDef, n: number): BoneSegmentDef[] {
  const out: BoneSegmentDef[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    const from = lerp3(s.from, s.to, t0);
    const to = lerp3(s.from, s.to, t1);
    const taper = 1 - 0.04 * Math.abs(i - (n - 1) / 2) / Math.max(1, n);
    out.push({ from, to, radius: Math.max(0.012, s.radius * taper) });
  }
  return out;
}

/** Caudal block (occiput-facing) vs rostral (snout). `t` = fraction of length assigned to braincase block. */
function splitSkull(skull: BoneSegmentDef, t = 0.48): [BoneSegmentDef, BoneSegmentDef] {
  const mid = lerp3(skull.from, skull.to, t);
  return [
    { from: skull.from, to: mid, radius: skull.radius * 1.02 },
    { from: mid, to: skull.to, radius: skull.radius * 0.94 },
  ];
}

/** Slight dorsoventral S-curve in the neck column (dromaeosaur runner pose). */
function applyVelociraptorCervicalS(parts: BoneSegmentDef[]): BoneSegmentDef[] {
  return parts.map((s, i) => {
    const u = i / Math.max(1, parts.length - 1);
    const wave = Math.sin(u * Math.PI) * 0.024;
    const drop = i * 0.005;
    return {
      ...s,
      from: [s.from[0], s.from[1] + wave - drop * 0.35, s.from[2]] as Vec3,
      to: [s.to[0], s.to[1] + wave * 1.08 - drop * 0.38, s.to[2]] as Vec3,
    };
  });
}

export interface HighFiRenderItem {
  key: string;
  boneId: string;
  segment: BoneSegmentDef;
}

export function getTheropodHighFidelityBoneMeshes(speciesId: string): HighFiRenderItem[] {
  const segs = getBoneSegmentsForSpecies(speciesId);
  const p = `${speciesId}-`;
  const out: HighFiRenderItem[] = [];

  /** Low t → longer rostrum/snout block (segment 2); high t → longer braincase block (segment 1). */
  const skullSplit =
    speciesId === "pteranodon"
      ? 0.26
      : speciesId === "velociraptor"
        ? 0.42
        : 0.48;
  const [braincase, snout] = splitSkull(segs.skull, skullSplit);
  out.push({ key: `${p}skull-snout`, boneId: `${p}skull-snout`, segment: snout });
  out.push({ key: `${p}skull-braincase`, boneId: `${p}skull-braincase`, segment: braincase });

  const zM = Math.max(0.08, segs.mandible.radius * 3.2);
  const mand = segs.mandible;
  const mandL: BoneSegmentDef = {
    from: [mand.from[0], mand.from[1], mand.from[2] + zM],
    to: [mand.to[0], mand.to[1], mand.to[2] + zM],
    radius: mand.radius * 0.92,
  };
  out.push({ key: `${p}mandible-left`, boneId: `${p}mandible-left`, segment: mandL });
  out.push({
    key: `${p}mandible-right`,
    boneId: `${p}mandible-right`,
    segment: mirrorSegmentZ(mandL),
  });

  let cervParts = subdivideBone(segs.cervical, 7);
  if (speciesId === "velociraptor") {
    cervParts = applyVelociraptorCervicalS(cervParts);
  }
  cervParts.forEach((s, i) => {
    out.push({
      key: `${p}cervical-${i + 1}`,
      boneId: `${p}cervical-${i + 1}`,
      segment: i < 2 ? { ...s, radius: s.radius * 1.08 } : s,
    });
  });

  const dorsParts = subdivideBone(segs.dorsal, 6);
  dorsParts.forEach((s, i) => {
    out.push({ key: `${p}dorsal-${i + 1}`, boneId: `${p}dorsal-${i + 1}`, segment: s });
  });

  out.push({ key: `${p}sacrum`, boneId: `${p}sacrum`, segment: segs.sacrum });

  out.push({ key: `${p}ribs-core`, boneId: `${p}ribs-core`, segment: segs.ribs });

  const ribR = Math.max(0.014, segs.ribs.radius * 0.24);
  const ribZ = 0.14 * (segs.dorsal.radius / 0.088);
  for (let i = 0; i < 3; i++) {
    const di = i + 1;
    const joint = dorsParts[di]?.from ?? segs.dorsal.from;
    const px = joint[0];
    const py = joint[1];
    const pz = joint[2];
    out.push({
      key: `${p}rib-l${i + 1}`,
      boneId: `${p}rib-l${i + 1}`,
      segment: seg([px, py - 0.02, pz + 0.02], [px + 0.06, py - 0.12, pz + ribZ], ribR),
    });
    out.push({
      key: `${p}rib-r${i + 1}`,
      boneId: `${p}rib-r${i + 1}`,
      segment: seg([px, py - 0.02, pz - 0.02], [px + 0.06, py - 0.12, pz - ribZ], ribR),
    });
  }

  getRibCageShafts(speciesId).forEach((shaft, i) => {
    out.push({
      key: `${p}ribs-shaft-${i}`,
      boneId: `${p}ribs-shaft-${i}`,
      segment: shaft,
    });
  });

  const caudParts = subdivideBone(segs.caudal, 8);
  caudParts.forEach((s, i) => {
    out.push({
      key: `${p}caudal-${i + 1}`,
      boneId: `${p}caudal-${i + 1}`,
      segment: { ...s, radius: Math.max(0.014, s.radius * (1 - i * 0.035)) },
    });
  });

  if (speciesId === "pteranodon") {
    out.push({
      key: `${p}gastralia`,
      boneId: `${p}gastralia`,
      segment: seg([-0.06, 0.098, 0], [0.03, 0.09, 0], 0.011),
    });
  } else {
    const gFrom = caudParts[0]?.from ?? segs.caudal.from;
    out.push({
      key: `${p}gastralia`,
      boneId: `${p}gastralia`,
      segment: seg([gFrom[0] + 0.22, 0.09, 0], [gFrom[0] + 0.48, 0.07, 0], segs.mandible.radius * 1.05),
    });
  }

  for (const boneId of Z_MIRRORED_BONE_IDS) {
    const s = segs[boneId];
    out.push({ key: `${p}${boneId}-l`, boneId: `${p}${boneId}-l`, segment: s });
    out.push({ key: `${p}${boneId}-r`, boneId: `${p}${boneId}-r`, segment: mirrorSegmentZ(s) });
  }

  return out;
}

function br(id: string, label: string, sci: string, description: string, osteology: string): BoneRecord {
  return { id, label, scientificName: sci, description, osteology, svgGroupId: `3d-${id}` };
}

function coarse(coarseBones: BoneRecord[], boneId: BoneId) {
  return getCoarseBoneCopy(coarseBones, boneId);
}

/**
 * Bone panel + research console records for every high-fi mesh id (non-trex).
 * Copy matches the species’ 2D schematic (sharedBones + per-species overrides), not generic 3D blurbs.
 */
export function getTheropodHighFidelityBoneRecords(speciesId: string, coarseBones: BoneRecord[]): BoneRecord[] {
  const p = `${speciesId}-`;
  const out: BoneRecord[] = [];

  const skull = coarse(coarseBones, "skull");
  const mand = coarse(coarseBones, "mandible");
  const cerv = coarse(coarseBones, "cervical");
  const dors = coarse(coarseBones, "dorsal");
  const sac = coarse(coarseBones, "sacrum");
  const rib = coarse(coarseBones, "ribs");
  const caud = coarse(coarseBones, "caudal");

  out.push(
    br(`${p}skull-snout`, "Snout (premaxilla / maxilla region)", "Rostral skull", skull.description, skull.osteology),
    br(`${p}skull-braincase`, "Braincase", "Neurocranium", skull.description, skull.osteology),
    br(`${p}mandible-left`, "Left dentary", "Dentary (left)", mand.description, mand.osteology),
    br(`${p}mandible-right`, "Right dentary", "Dentary (right)", mand.description, mand.osteology),
  );

  for (let i = 0; i < 7; i++) {
    const n = i + 1;
    out.push(
      br(
        `${p}cervical-${n}`,
        i === 0 ? "Atlas (C1)" : i === 1 ? "Axis (C2)" : `Cervical vertebra ${n}`,
        i === 0 ? "Atlas" : i === 1 ? "Axis" : `Cervical ${n}`,
        cerv.description,
        i === 0
          ? "The atlas supports the skull; its shape limits nodding range."
          : i === 1
            ? "The axis bears the odontoid peg for head rotation."
            : cerv.osteology,
      ),
    );
  }

  for (let i = 0; i < 6; i++) {
    out.push(
      br(`${p}dorsal-${i + 1}`, `Thoracic segment ${i + 1}`, `Dorsal ${i + 1}`, dors.description, dors.osteology),
    );
  }

  out.push(br(`${p}sacrum`, "Sacrum", "Sacrum", sac.description, sac.osteology));
  out.push(br(`${p}ribs-core`, "Rib cage (sternal / core)", "Costal region", rib.description, rib.osteology));

  for (let i = 0; i < 3; i++) {
    out.push(
      br(`${p}rib-l${i + 1}`, `Left rib ${i + 1}`, `Costa (L) ${i + 1}`, rib.description, rib.osteology),
      br(`${p}rib-r${i + 1}`, `Right rib ${i + 1}`, `Costa (R) ${i + 1}`, rib.description, rib.osteology),
    );
  }

  for (let i = 0; i < 4; i++) {
    out.push(
      br(`${p}ribs-shaft-${i}`, `Rib shaft segment ${i + 1}`, "Shaft costae", rib.description, rib.osteology),
    );
  }

  for (let i = 0; i < 8; i++) {
    out.push(br(`${p}caudal-${i + 1}`, `Caudal vertebra ${i + 1}`, `Caudal ${i + 1}`, caud.description, caud.osteology));
  }

  out.push(
    br(`${p}gastralia`, "Gastralia", "Gastralia", GASTRALIA_COPY.description, GASTRALIA_COPY.osteology),
  );

  const labels: Record<(typeof Z_MIRRORED_BONE_IDS)[number], [string, string]> = {
    scapula: ["Scapula", "Scapula"],
    humerus: ["Humerus", "Humerus"],
    antebrachium: ["Antebrachium", "Radius / ulna region"],
    manus: ["Manus", "Manual elements"],
    ilium: ["Ilium", "Ilium"],
    pubis: ["Pubis / ischium", "Puboischium"],
    femur: ["Femur", "Femur"],
    tibia: ["Tibia / fibula", "Crus"],
    metatarsus: ["Metatarsals", "Metatarsus"],
    pes: ["Pes", "Pedal phalanges"],
  };

  for (const bid of Z_MIRRORED_BONE_IDS) {
    const copy = coarse(coarseBones, bid);
    const [lbl, sci] = labels[bid];
    out.push(
      br(`${p}${bid}-l`, `Left ${lbl.toLowerCase()}`, `${sci} (left)`, copy.description, copy.osteology),
      br(`${p}${bid}-r`, `Right ${lbl.toLowerCase()}`, `${sci} (right)`, copy.description, copy.osteology),
    );
  }

  return out;
}

/** Coarse 2D bone id → matches all high-fi meshes for that region (non-trex). */
export function coarseMeshMatchesSpeciesPrefix(
  speciesId: string,
  meshId: string,
  coarseSelectedId: string | null,
): boolean {
  if (!coarseSelectedId) return false;
  if (coarseSelectedId === "ribs") {
    return (
      meshId.startsWith(`${speciesId}-ribs`) || meshId.startsWith(`${speciesId}-rib-`)
    );
  }
  const prefix = `${speciesId}-${coarseSelectedId}`;
  return meshId.startsWith(prefix);
}
