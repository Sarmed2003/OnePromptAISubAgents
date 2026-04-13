/** Global pose offset / scale for the 3D rig (capsule segments live in skeleton3dSegments.ts). */
export const SPECIES_3D_OFFSET: Partial<Record<string, { y: number; scale: number }>> = {
  trex: { y: 0, scale: 1 },
  /** Long tail + low pose — slight lift, modest scale. */
  velociraptor: { y: 0.06, scale: 0.88 },
  /** Huge lateral wingspan — scale down so both wings stay in frame. */
  pteranodon: { y: 0.04, scale: 0.52 },
};
