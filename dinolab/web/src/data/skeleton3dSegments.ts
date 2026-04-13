import type { BoneId } from "./anatomyShapes";
import { CUSTOM_SPECIES_RIGS } from "./skeleton3dCustomRigs";

/** 3D segment rig: tail −X → head +X, Y up, Z lateral. */
export type Vec3 = [number, number, number];

export interface BoneSegmentDef {
  from: Vec3;
  to: Vec3;
  radius: number;
}

/** Bones mirrored across the sagittal plane (±Z) for the full appendicular skeleton. */
export const Z_MIRRORED_BONE_IDS = [
  "ilium",
  "pubis",
  "scapula",
  "humerus",
  "antebrachium",
  "manus",
  "femur",
  "tibia",
  "metatarsus",
  "pes",
] as const satisfies readonly BoneId[];

const THEROPOD_BASE: Record<BoneId, BoneSegmentDef> = {
  caudal: { from: [-0.92, 0.08, 0], to: [-0.42, 0.16, 0], radius: 0.075 },
  dorsal: { from: [-0.42, 0.16, 0], to: [-0.08, 0.24, 0], radius: 0.088 },
  sacrum: { from: [-0.1, 0.21, 0], to: [-0.16, 0.15, 0], radius: 0.056 },
  cervical: { from: [-0.04, 0.26, 0], to: [0.2, 0.33, 0.02], radius: 0.048 },
  skull: { from: [0.18, 0.32, 0.02], to: [0.62, 0.38, 0.06], radius: 0.09 },
  mandible: { from: [0.2, 0.3, 0.03], to: [0.42, 0.22, 0.05], radius: 0.042 },
  ribs: { from: [-0.32, 0.2, 0], to: [-0.04, 0.1, 0], radius: 0.095 },
  scapula: { from: [-0.12, 0.22, 0.14], to: [-0.02, 0.28, 0.2], radius: 0.038 },
  humerus: { from: [-0.02, 0.28, 0.2], to: [0.04, 0.08, 0.26], radius: 0.036 },
  antebrachium: { from: [0.04, 0.08, 0.26], to: [0.1, -0.08, 0.28], radius: 0.028 },
  manus: { from: [0.1, -0.08, 0.28], to: [0.16, -0.2, 0.28], radius: 0.026 },
  ilium: { from: [-0.2, 0.14, 0.06], to: [-0.04, 0.2, 0.1], radius: 0.048 },
  pubis: { from: [-0.08, 0.06, 0.08], to: [-0.02, -0.06, 0.1], radius: 0.032 },
  femur: { from: [-0.08, 0.1, 0.1], to: [-0.04, -0.22, 0.12], radius: 0.042 },
  tibia: { from: [-0.04, -0.22, 0.12], to: [-0.03, -0.4, 0.1], radius: 0.034 },
  metatarsus: { from: [-0.03, -0.4, 0.1], to: [-0.025, -0.5, 0.1], radius: 0.028 },
  pes: { from: [-0.025, -0.5, 0.1], to: [0.06, -0.58, 0.12], radius: 0.032 },
};

interface SpeciesTuning {
  lengthMul?: Partial<Record<BoneId, number>>;
  radiusMul?: Partial<Record<BoneId, number>>;
  rootRotation?: Vec3;
}

const SPECIES_TUNING: Record<string, SpeciesTuning> = {
  trex: {
    lengthMul: {
      skull: 1.12,
      mandible: 1.05,
      humerus: 0.72,
      antebrachium: 0.78,
      manus: 0.75,
      femur: 1.08,
      tibia: 1.05,
      metatarsus: 1.02,
      caudal: 1.05,
      ribs: 1.05,
    },
    radiusMul: { skull: 1.15, humerus: 1.1, femur: 1.12, ribs: 1.08 },
  },
  // velociraptor, pteranodon use CUSTOM_SPECIES_RIGS (full segment geometry).
};

function scaleVec(a: Vec3, m: number): Vec3 {
  return [a[0] * m, a[1] * m, a[2] * m];
}

function addVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function subVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function mulBoneSegment(base: BoneSegmentDef, lenMul: number, rMul: number): BoneSegmentDef {
  const delta = subVec(base.to, base.from);
  const scaled = scaleVec(delta, lenMul);
  return {
    from: base.from,
    to: addVec(base.from, scaled),
    radius: Math.max(0.012, base.radius * rMul),
  };
}

export function mirrorSegmentZ(seg: BoneSegmentDef): BoneSegmentDef {
  return {
    from: [seg.from[0], seg.from[1], -seg.from[2]],
    to: [seg.to[0], seg.to[1], -seg.to[2]],
    radius: seg.radius,
  };
}

export function getBoneSegmentsForSpecies(speciesId: string): Record<BoneId, BoneSegmentDef> {
  const custom = CUSTOM_SPECIES_RIGS[speciesId];
  if (custom) {
    const out = {} as Record<BoneId, BoneSegmentDef>;
    (Object.keys(custom) as BoneId[]).forEach((bid) => {
      const s = custom[bid];
      out[bid] = {
        from: [...s.from] as Vec3,
        to: [...s.to] as Vec3,
        radius: s.radius,
      };
    });
    return out;
  }

  const tune = SPECIES_TUNING[speciesId] ?? {};
  const out = {} as Record<BoneId, BoneSegmentDef>;
  (Object.keys(THEROPOD_BASE) as BoneId[]).forEach((bid) => {
    const base = THEROPOD_BASE[bid];
    const lm = tune.lengthMul?.[bid] ?? 1;
    const rm = tune.radiusMul?.[bid] ?? 1;
    out[bid] = mulBoneSegment(base, lm, rm);
  });
  return out;
}

/** Extra thoracic shafts mapped to the same "ribs" bone id (bilateral hint). */
export function getRibCageShafts(speciesId: string): BoneSegmentDef[] {
  if (speciesId === "pteranodon") {
    const r = 0.012;
    return [
      { from: [-0.08, 0.12, 0.04], to: [-0.02, 0.08, 0.08], radius: r },
      { from: [-0.08, 0.12, -0.04], to: [-0.02, 0.08, -0.08], radius: r },
    ];
  }
  if (speciesId === "velociraptor") {
    const z = 0.12;
    const r = 0.017;
    const y1 = 0.15;
    const y2 = 0.08;
    return [
      { from: [-0.24, y1, z], to: [-0.08, y2, z * 0.9], radius: r },
      { from: [-0.24, y1, -z], to: [-0.08, y2, -z * 0.9], radius: r },
      { from: [-0.2, y1 - 0.02, z * 0.55], to: [-0.09, y2 + 0.02, z * 0.5], radius: r * 0.85 },
      { from: [-0.2, y1 - 0.02, -z * 0.55], to: [-0.09, y2 + 0.02, -z * 0.5], radius: r * 0.85 },
    ];
  }

  const tune = SPECIES_TUNING[speciesId] ?? {};
  const ribScale = tune.lengthMul?.ribs ?? 1;
  const z = 0.13 * ribScale;
  const r = Math.max(0.014, 0.02 * (tune.radiusMul?.ribs ?? 1));
  const y1 = 0.19;
  const y2 = 0.1;
  return [
    { from: [-0.26, y1, z], to: [-0.06, y2, z * 0.9], radius: r },
    { from: [-0.26, y1, -z], to: [-0.06, y2, -z * 0.9], radius: r },
    { from: [-0.22, y1 - 0.02, z * 0.55], to: [-0.08, y2 + 0.02, z * 0.5], radius: r * 0.85 },
    { from: [-0.22, y1 - 0.02, -z * 0.55], to: [-0.08, y2 + 0.02, -z * 0.5], radius: r * 0.85 },
  ];
}

export function getSpeciesRootRotation(speciesId: string): Vec3 {
  if (speciesId === "velociraptor") {
    return [0.14, -0.06, 0.02];
  }
  if (speciesId === "pteranodon") {
    return [0.06, 0.12, 0];
  }
  return SPECIES_TUNING[speciesId]?.rootRotation ?? [0, 0, 0];
}
