import {
  BufferGeometry,
  IcosahedronGeometry,
  LatheGeometry,
  Vector2,
  Vector3,
} from "three";
import type { BoneSegmentDef } from "./skeleton3dSegments";

const LATHE_RADIAL = 20;

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rnd(seed: number, salt: number): number {
  const x = Math.sin(seed * 0.0001 + salt * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function latheFromProfile(profile: Vector2[]): LatheGeometry {
  const geo = new LatheGeometry(profile, LATHE_RADIAL);
  geo.computeVertexNormals();
  return geo;
}

function buildLongBoneProfile(length: number, baseR: number, seed: number): Vector2[] {
  const half = length * 0.5;
  const bulge = 0.78 + rnd(seed, 1) * 0.22;
  const tipA = 0.26 + rnd(seed, 2) * 0.14;
  const tipB = 0.24 + rnd(seed, 3) * 0.14;
  const midAsym = 0.04 * (rnd(seed, 4) - 0.5);
  const r = baseR;

  return [
    new Vector2(tipA * r, -half),
    new Vector2((tipA + 0.18) * r, -half * 0.86),
    new Vector2((0.55 + midAsym) * bulge * r, -half * 0.48),
    new Vector2((0.88 + midAsym * 0.5) * bulge * r, -half * 0.12),
    new Vector2(bulge * r, half * 0.08),
    new Vector2((0.82 - midAsym * 0.5) * bulge * r, half * 0.38),
    new Vector2((0.52 - midAsym) * bulge * r, half * 0.68),
    new Vector2((tipB + 0.15) * r, half * 0.92),
    new Vector2(tipB * r * 0.92, half),
  ];
}

/**
 * Organic bone mesh along segment axis (Y-up lathe, then oriented in the rig).
 * Short segments become low-poly nodules; skull/jaw use the same path as postcrania.
 */
export function createOrganicBoneGeometry(segment: BoneSegmentDef, meshKey: string): BufferGeometry {
  const a = new Vector3(...segment.from);
  const b = new Vector3(...segment.to);
  const dist = a.distanceTo(b);
  const r = Math.max(segment.radius, 0.006);
  const seed = hashString(meshKey);

  if (dist < r * 1.35) {
    const detail = dist < r * 0.75 ? 1 : 0;
    const geo = new IcosahedronGeometry(r * (0.92 + rnd(seed, 5) * 0.12), detail);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const j = rnd(seed, i % 17) * 0.06;
      pos.setXYZ(i, x * (1 + j), y * (1 - j * 0.3), z * (1 + j));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  const cylLen = Math.max(0.014, dist - r * 0.28);
  const profile = buildLongBoneProfile(cylLen, r, seed);
  return latheFromProfile(profile);
}
