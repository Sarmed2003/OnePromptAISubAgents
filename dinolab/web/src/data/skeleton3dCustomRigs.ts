/**
 * Species-specific 3D capsule rigs (tail −X → head +X, Y up, Z lateral).
 * Replaces generic theropod scaling for taxa with very different silhouettes.
 */
import type { BoneId } from "./anatomyShapes";

export interface RigSeg {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
}

/** Full skeleton definitions keyed like THEROPOD_BASE. */
export const CUSTOM_SPECIES_RIGS: Partial<Record<string, Record<BoneId, RigSeg>>> = {
  /** Narrow skull, long balancing tail, limbs posed for a low horizontal runner. */
  velociraptor: {
    caudal: { from: [-1.02, 0.09, 0], to: [-0.34, 0.17, 0.01], radius: 0.052 },
    dorsal: { from: [-0.34, 0.17, 0.01], to: [-0.1, 0.23, 0.015], radius: 0.07 },
    sacrum: { from: [-0.12, 0.21, 0.012], to: [-0.18, 0.16, 0.01], radius: 0.042 },
    cervical: { from: [-0.1, 0.23, 0.015], to: [0.16, 0.31, 0.025], radius: 0.036 },
    skull: { from: [0.14, 0.29, 0.02], to: [0.6, 0.33, 0.04], radius: 0.05 },
    mandible: { from: [0.16, 0.26, 0.025], to: [0.5, 0.22, 0.035], radius: 0.028 },
    ribs: { from: [-0.28, 0.16, 0], to: [-0.06, 0.1, 0.01], radius: 0.072 },
    scapula: { from: [-0.14, 0.19, 0.11], to: [0.04, 0.25, 0.19], radius: 0.026 },
    humerus: { from: [0.04, 0.25, 0.19], to: [0.16, 0.16, 0.24], radius: 0.024 },
    antebrachium: { from: [0.16, 0.16, 0.24], to: [0.26, 0.1, 0.28], radius: 0.02 },
    manus: { from: [0.26, 0.1, 0.28], to: [0.36, 0.04, 0.3], radius: 0.018 },
    ilium: { from: [-0.18, 0.15, 0.06], to: [-0.06, 0.2, 0.09], radius: 0.038 },
    pubis: { from: [-0.1, 0.1, 0.08], to: [-0.05, -0.02, 0.09], radius: 0.024 },
    femur: { from: [-0.1, 0.14, 0.09], to: [-0.07, -0.1, 0.11], radius: 0.034 },
    tibia: { from: [-0.07, -0.1, 0.11], to: [-0.05, -0.3, 0.12], radius: 0.026 },
    metatarsus: { from: [-0.05, -0.3, 0.12], to: [-0.04, -0.4, 0.11], radius: 0.02 },
    pes: { from: [-0.04, -0.4, 0.11], to: [0.08, -0.48, 0.13], radius: 0.022 },
  },

  /** Compact torso, extreme wingspan along ±Z, tiny hindlimbs; toothless rostrum along +X. */
  pteranodon: {
    caudal: { from: [-0.22, 0.14, 0], to: [-0.12, 0.145, 0], radius: 0.022 },
    dorsal: { from: [-0.12, 0.145, 0], to: [-0.03, 0.165, 0], radius: 0.065 },
    sacrum: { from: [-0.05, 0.16, 0], to: [-0.09, 0.14, 0], radius: 0.032 },
    cervical: { from: [-0.03, 0.165, 0], to: [0.1, 0.175, 0.005], radius: 0.028 },
    skull: { from: [0.08, 0.17, 0.005], to: [0.48, 0.19, 0.02], radius: 0.034 },
    mandible: { from: [0.1, 0.145, 0.008], to: [0.44, 0.15, 0.018], radius: 0.02 },
    ribs: { from: [-0.1, 0.14, 0], to: [-0.02, 0.1, 0], radius: 0.048 },
    scapula: { from: [-0.06, 0.155, 0.04], to: [-0.02, 0.165, 0.22], radius: 0.02 },
    humerus: { from: [-0.02, 0.165, 0.22], to: [-0.02, 0.12, 0.46], radius: 0.03 },
    antebrachium: { from: [-0.02, 0.12, 0.46], to: [-0.02, 0.08, 0.74], radius: 0.024 },
    manus: { from: [-0.02, 0.08, 0.74], to: [-0.015, 0.04, 1.28], radius: 0.018 },
    ilium: { from: [-0.08, 0.12, 0.03], to: [-0.04, 0.13, 0.05], radius: 0.022 },
    pubis: { from: [-0.05, 0.1, 0.04], to: [-0.03, 0.04, 0.045], radius: 0.014 },
    femur: { from: [-0.05, 0.11, 0.045], to: [-0.045, 0.04, 0.055], radius: 0.014 },
    tibia: { from: [-0.045, 0.04, 0.055], to: [-0.045, -0.02, 0.058], radius: 0.012 },
    metatarsus: { from: [-0.045, -0.02, 0.058], to: [-0.044, -0.07, 0.056], radius: 0.01 },
    pes: { from: [-0.044, -0.07, 0.056], to: [-0.02, -0.09, 0.058], radius: 0.011 },
  },

};
