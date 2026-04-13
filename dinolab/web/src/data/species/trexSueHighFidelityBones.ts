/**
 * Fine-grained 3D map for T. rex (trex only). Didactic reconstruction, not a photogrammetry mesh.
 * Panel copy matches the same coarse schematic region (shared + T. rex overrides), not generic 3D placeholders.
 */
import type { BoneId } from "../anatomyShapes";
import type { BoneRecord } from "../types";
import type { BoneSegmentDef, Vec3 } from "../skeleton3dSegments";
import { GASTRALIA_COPY, getCoarseBoneCopy } from "./sharedBones";

function seg(a: Vec3, b: Vec3, r: number): BoneSegmentDef {
  return { from: a, to: b, radius: r };
}

function mirrorZ(s: BoneSegmentDef): BoneSegmentDef {
  return {
    from: [s.from[0], s.from[1], -s.from[2]],
    to: [s.to[0], s.to[1], -s.to[2]],
    radius: s.radius,
  };
}

function br(
  id: string,
  label: string,
  scientificName: string,
  description: string,
  osteology: string,
): BoneRecord {
  return {
    id,
    label,
    scientificName,
    description,
    osteology,
    svgGroupId: `3d-${id}`,
  };
}

function c(coarseBones: BoneRecord[], boneId: BoneId) {
  return getCoarseBoneCopy(coarseBones, boneId);
}

/** ~50 individually selectable 3D elements; description/osteology follow 2D schematic regions. */
export function buildSueHighFidelityBoneRecords(coarseBones: BoneRecord[]): BoneRecord[] {
  const skull = c(coarseBones, "skull");
  const mand = c(coarseBones, "mandible");
  const cerv = c(coarseBones, "cervical");
  const dors = c(coarseBones, "dorsal");
  const sac = c(coarseBones, "sacrum");
  const rib = c(coarseBones, "ribs");
  const caud = c(coarseBones, "caudal");
  const scap = c(coarseBones, "scapula");
  const hum = c(coarseBones, "humerus");
  const ante = c(coarseBones, "antebrachium");
  const man = c(coarseBones, "manus");
  const il = c(coarseBones, "ilium");
  const pub = c(coarseBones, "pubis");
  const fem = c(coarseBones, "femur");
  const tib = c(coarseBones, "tibia");
  const meta = c(coarseBones, "metatarsus");
  const pes = c(coarseBones, "pes");

  return [
    br("sue-skull-snout", "Snout (premaxilla / maxilla region)", "Rostral skull", skull.description, skull.osteology),
    br("sue-skull-braincase", "Braincase", "Neurocranium", skull.description, skull.osteology),
    br("sue-mandible-left", "Left dentary", "Dentary (left)", mand.description, mand.osteology),
    br("sue-mandible-right", "Right dentary", "Dentary (right)", mand.description, mand.osteology),
    ...Array.from({ length: 7 }, (_, i) =>
      br(
        `sue-cervical-${i + 1}`,
        i === 0 ? "Atlas (C1)" : i === 1 ? "Axis (C2)" : `Cervical vertebra ${i + 1}`,
        i === 0 ? "Atlas" : i === 1 ? "Axis" : `Cervical ${i + 1}`,
        cerv.description,
        i === 0
          ? "The atlas supports the skull; its shape limits nodding range."
          : i === 1
            ? "The axis bears the odontoid peg for head rotation."
            : cerv.osteology,
      ),
    ),
    ...Array.from({ length: 6 }, (_, i) =>
      br(`sue-dorsal-${i + 1}`, `Thoracic segment ${i + 1}`, `Dorsal vertebra ${i + 1}`, dors.description, dors.osteology),
    ),
    br("sue-sacrum", "Sacrum", "Sacral vertebrae", sac.description, sac.osteology),
    ...["L", "R"].flatMap((side) =>
      Array.from({ length: 3 }, (_, i) =>
        br(
          `sue-rib-${side.toLowerCase()}${i + 1}`,
          `${side === "L" ? "Left" : "Right"} rib ${i + 1}`,
          `Costal element (${side})`,
          rib.description,
          rib.osteology,
        ),
      ),
    ),
    br("sue-gastralia", "Gastralia", "Gastral basket", GASTRALIA_COPY.description, GASTRALIA_COPY.osteology),
    ...Array.from({ length: 8 }, (_, i) =>
      br(`sue-caudal-${i + 1}`, `Caudal vertebra ${i + 1}`, `Caudal ${i + 1}`, caud.description, caud.osteology),
    ),
    ...["L", "R"].flatMap((side) => {
      const s = side === "L" ? "Left" : "Right";
      const sl = side.toLowerCase();
      return [
        br(`sue-scapula-${sl}`, `${s} scapula`, `Scapula (${side})`, scap.description, scap.osteology),
        br(`sue-humerus-${sl}`, `${s} humerus`, `Humerus (${side})`, hum.description, hum.osteology),
        br(`sue-antebrachium-${sl}`, `${s} radius / ulna`, `Antebrachium (${side})`, ante.description, ante.osteology),
        br(`sue-manus-${sl}`, `${s} manus`, `Manual elements (${side})`, man.description, man.osteology),
        br(`sue-ilium-${sl}`, `${s} ilium`, `Ilium (${side})`, il.description, il.osteology),
        br(`sue-pubis-${sl}`, `${s} pubis / ischium`, `Puboischium (${side})`, pub.description, pub.osteology),
        br(`sue-femur-${sl}`, `${s} femur`, `Femur (${side})`, fem.description, fem.osteology),
        br(`sue-tibia-${sl}`, `${s} tibia / fibula`, `Crus (${side})`, tib.description, tib.osteology),
        br(`sue-metatarsus-${sl}`, `${s} metatarsals`, `Metatarsus (${side})`, meta.description, meta.osteology),
        br(`sue-pes-${sl}`, `${s} pes (digits)`, `Pedal phalanges (${side})`, pes.description, pes.osteology),
      ];
    }),
  ];
}

export function getSueHighFidelityBoneMeshes(): { id: string; segment: BoneSegmentDef }[] {
  const out: { id: string; segment: BoneSegmentDef }[] = [];

  out.push({
    id: "sue-skull-snout",
    segment: seg([0.36, 0.33, 0.04], [0.58, 0.37, 0.07], 0.052),
  });
  out.push({
    id: "sue-skull-braincase",
    segment: seg([0.18, 0.31, 0.015], [0.36, 0.34, 0.035], 0.068),
  });
  const mandL = seg([0.22, 0.28, 0.12], [0.42, 0.22, 0.14], 0.032);
  out.push({ id: "sue-mandible-left", segment: mandL });
  out.push({ id: "sue-mandible-right", segment: mirrorZ(mandL) });

  const cerv: Vec3[] = [
    [0.17, 0.322, 0.02],
    [0.11, 0.308, 0.016],
    [0.05, 0.292, 0.012],
    [-0.01, 0.278, 0.008],
    [-0.06, 0.268, 0.005],
    [-0.1, 0.262, 0.003],
    [-0.13, 0.258, 0.002],
    [-0.155, 0.255, 0],
  ];
  for (let i = 0; i < 7; i++) {
    out.push({
      id: `sue-cervical-${i + 1}`,
      segment: seg(cerv[i], cerv[i + 1], 0.026 + (i < 2 ? 0.006 : 0)),
    });
  }

  const dors: Vec3[] = [
    [-0.16, 0.252, 0],
    [-0.24, 0.235, 0.01],
    [-0.32, 0.218, 0.015],
    [-0.38, 0.2, 0.018],
    [-0.42, 0.182, 0.02],
    [-0.44, 0.165, 0.02],
    [-0.45, 0.148, 0.018],
  ];
  for (let i = 0; i < 6; i++) {
    out.push({
      id: `sue-dorsal-${i + 1}`,
      segment: seg(dors[i], dors[i + 1], 0.07 - i * 0.004),
    });
  }

  out.push({
    id: "sue-sacrum",
    segment: seg([-0.44, 0.158, 0.02], [-0.5, 0.138, 0.025], 0.055),
  });

  const ribAttach = [
    dors[1],
    dors[2],
    dors[3],
  ];
  ribAttach.forEach((p, i) => {
    const zoff = 0.14;
    out.push({
      id: `sue-rib-l${i + 1}`,
      segment: seg([p[0], p[1] - 0.02, p[2] + 0.02], [p[0] + 0.06, p[1] - 0.12, p[2] + zoff], 0.022),
    });
    out.push({
      id: `sue-rib-r${i + 1}`,
      segment: seg([p[0], p[1] - 0.02, p[2] - 0.02], [p[0] + 0.06, p[1] - 0.12, p[2] - zoff], 0.022),
    });
  });

  out.push({
    id: "sue-gastralia",
    segment: seg([-0.28, 0.1, 0], [-0.1, 0.08, 0], 0.04),
  });

  const caud: Vec3[] = [
    [-0.52, 0.13, 0.02],
    [-0.62, 0.11, 0.015],
    [-0.72, 0.09, 0.01],
    [-0.82, 0.07, 0.008],
    [-0.9, 0.055, 0.006],
    [-0.96, 0.042, 0.004],
    [-1.01, 0.03, 0.002],
    [-1.05, 0.02, 0],
    [-1.08, 0.012, 0],
  ];
  for (let i = 0; i < 8; i++) {
    out.push({
      id: `sue-caudal-${i + 1}`,
      segment: seg(caud[i], caud[i + 1], 0.055 - i * 0.004),
    });
  }

  const scapL = seg([-0.12, 0.22, 0.14], [-0.02, 0.28, 0.2], 0.034);
  out.push({ id: "sue-scapula-l", segment: scapL });
  out.push({ id: "sue-scapula-r", segment: mirrorZ(scapL) });

  const humL = seg([-0.02, 0.28, 0.2], [0.04, 0.1, 0.24], 0.032);
  out.push({ id: "sue-humerus-l", segment: humL });
  out.push({ id: "sue-humerus-r", segment: mirrorZ(humL) });

  const anteL = seg([0.04, 0.1, 0.24], [0.1, -0.06, 0.26], 0.026);
  out.push({ id: "sue-antebrachium-l", segment: anteL });
  out.push({ id: "sue-antebrachium-r", segment: mirrorZ(anteL) });

  const manL = seg([0.1, -0.06, 0.26], [0.15, -0.18, 0.26], 0.024);
  out.push({ id: "sue-manus-l", segment: manL });
  out.push({ id: "sue-manus-r", segment: mirrorZ(manL) });

  const ilL = seg([-0.18, 0.14, 0.08], [-0.04, 0.2, 0.11], 0.045);
  out.push({ id: "sue-ilium-l", segment: ilL });
  out.push({ id: "sue-ilium-r", segment: mirrorZ(ilL) });

  const pubL = seg([-0.08, 0.08, 0.1], [-0.02, -0.05, 0.11], 0.028);
  out.push({ id: "sue-pubis-l", segment: pubL });
  out.push({ id: "sue-pubis-r", segment: mirrorZ(pubL) });

  const femL = seg([-0.08, 0.1, 0.11], [-0.04, -0.22, 0.12], 0.04);
  out.push({ id: "sue-femur-l", segment: femL });
  out.push({ id: "sue-femur-r", segment: mirrorZ(femL) });

  const tibL = seg([-0.04, -0.22, 0.12], [-0.03, -0.4, 0.1], 0.032);
  out.push({ id: "sue-tibia-l", segment: tibL });
  out.push({ id: "sue-tibia-r", segment: mirrorZ(tibL) });

  const metaL = seg([-0.03, -0.4, 0.1], [-0.025, -0.5, 0.1], 0.026);
  out.push({ id: "sue-metatarsus-l", segment: metaL });
  out.push({ id: "sue-metatarsus-r", segment: mirrorZ(metaL) });

  const pesL = seg([-0.025, -0.5, 0.1], [0.05, -0.58, 0.12], 0.028);
  out.push({ id: "sue-pes-l", segment: pesL });
  out.push({ id: "sue-pes-r", segment: mirrorZ(pesL) });

  return out;
}
