export type BoneId =
  | "skull"
  | "mandible"
  | "cervical"
  | "dorsal"
  | "sacrum"
  | "ribs"
  | "caudal"
  | "scapula"
  | "humerus"
  | "antebrachium"
  | "manus"
  | "ilium"
  | "pubis"
  | "femur"
  | "tibia"
  | "metatarsus"
  | "pes";

/** Axial + appendicular order for viewers (paired limbs use lateral mirror in 2D / Z mirror in 3D). */
export const BONE_ORDER: BoneId[] = [
  "skull",
  "mandible",
  "cervical",
  "dorsal",
  "sacrum",
  "ribs",
  "caudal",
  "scapula",
  "humerus",
  "antebrachium",
  "manus",
  "ilium",
  "pubis",
  "femur",
  "tibia",
  "metatarsus",
  "pes",
];

/** In lateral 2D schema, duplicate these paths mirrored across the body axis so the far fore/hind limb is visible. */
export const LATERAL_MIRROR_BONE_IDS: BoneId[] = [
  "scapula",
  "humerus",
  "antebrachium",
  "manus",
  "femur",
  "tibia",
  "metatarsus",
  "pes",
];

/** Lateral SVG paths for bones only (osteology-first UI). */
export interface AnatomyShape {
  bones: Record<BoneId, string>;
  frameTransform: string;
}

const TREX: AnatomyShape = {
  bones: {
    skull: "M 48 88 Q 55 62 88 58 Q 118 55 128 78 Q 122 98 95 102 Q 65 100 48 88 Z",
    mandible: "M 52 98 Q 72 108 98 104 Q 118 100 128 92 Q 108 88 82 90 Q 58 92 52 98 Z",
    cervical: "M 128 78 Q 145 72 162 78 L 168 95 Q 150 100 132 95 Z",
    dorsal: "M 168 95 Q 195 88 225 92 L 232 118 Q 200 125 172 118 Z",
    sacrum: "M 198 120 L 214 116 L 220 128 L 200 132 Z",
    ribs: "M 172 96 Q 188 108 204 122 Q 198 128 186 118 Q 174 106 172 96 Z M 178 102 Q 194 118 212 132 Q 206 138 192 126 Q 178 112 178 102 Z",
    caudal: "M 232 118 Q 280 115 320 128 Q 355 145 368 168 Q 340 158 300 145 Q 260 132 235 128 Z",
    scapula: "M 178 98 L 195 108 L 188 128 L 172 118 Z",
    humerus: "M 188 128 L 198 145 L 192 158 L 182 148 Z",
    antebrachium: "M 192 158 L 202 168 L 198 178 L 188 172 Z",
    manus: "M 198 178 L 208 182 L 205 188 L 195 184 Z",
    ilium: "M 200 118 Q 218 108 238 115 L 242 135 Q 218 140 198 132 Z",
    pubis: "M 208 136 L 228 152 L 220 162 L 202 148 Z",
    femur: "M 222 135 Q 228 150 225 172 Q 215 175 208 165 Q 210 148 215 138 Z",
    tibia: "M 225 172 Q 232 192 229 204 Q 222 208 214 200 Q 216 186 220 176 Z",
    metatarsus: "M 229 204 L 232 214 L 228 220 L 224 210 Z",
    pes: "M 228 218 Q 238 224 248 228 Q 235 230 222 226 Z",
  },
  frameTransform: "translate(0 0) scale(1 1)",
};

const VELOCIRAPTOR: AnatomyShape = {
  bones: {
    skull: "M 58 92 Q 70 74 102 74 Q 132 74 146 84 Q 128 96 98 98 Q 74 98 58 92 Z",
    mandible: "M 62 100 Q 82 108 104 104 Q 124 100 138 92 Q 118 88 92 90 Q 68 92 62 100 Z",
    cervical: "M 146 84 Q 160 80 174 84 L 176 96 Q 160 100 146 96 Z",
    dorsal: "M 176 96 Q 206 90 232 94 L 236 110 Q 206 116 178 112 Z",
    sacrum: "M 206 112 L 220 108 L 224 118 L 208 122 Z",
    ribs: "M 182 98 Q 198 110 214 124 Q 208 130 196 120 Q 184 106 182 98 Z",
    caudal: "M 236 110 Q 278 108 320 108 Q 350 110 372 118 Q 336 122 302 124 Q 262 124 238 120 Z",
    scapula: "M 182 102 L 194 108 L 188 122 L 176 116 Z",
    humerus: "M 188 122 L 196 136 L 190 146 L 182 136 Z",
    antebrachium: "M 190 146 L 200 158 L 194 166 L 186 158 Z",
    manus: "M 194 166 L 206 172 L 202 178 L 190 172 Z",
    ilium: "M 198 112 Q 214 106 230 112 L 232 126 Q 214 130 198 124 Z",
    pubis: "M 204 128 L 222 142 L 214 152 L 198 140 Z",
    femur: "M 218 126 Q 226 140 224 158 Q 216 164 208 156 Q 210 140 214 128 Z",
    tibia: "M 224 158 Q 232 176 230 188 Q 224 192 216 186 Q 218 174 222 162 Z",
    metatarsus: "M 230 188 L 234 198 L 230 204 L 226 194 Z",
    pes: "M 230 194 Q 242 202 252 208 Q 240 210 228 206 Z",
  },
  frameTransform: "translate(4 -2) scale(0.97 0.97)",
};

const PTERANODON: AnatomyShape = {
  bones: {
    skull: "M 52 122 Q 82 110 118 112 Q 144 114 162 124 Q 126 130 90 130 Q 62 130 52 122 Z",
    mandible: "M 58 128 Q 88 118 120 120 Q 138 122 152 128 Q 120 134 88 132 Q 68 132 58 128 Z",
    cervical: "M 162 124 Q 174 120 188 122 L 190 132 Q 174 134 162 132 Z",
    dorsal: "M 190 132 Q 212 126 232 130 L 236 144 Q 214 148 192 144 Z",
    sacrum: "M 218 142 L 230 140 L 232 150 L 220 152 Z",
    ribs: "M 196 134 Q 210 142 222 150 Q 218 154 206 148 Q 194 140 196 134 Z",
    caudal: "M 236 144 Q 250 146 264 150 Q 252 154 238 154 Z",
    scapula: "M 194 138 L 206 144 L 200 158 L 188 152 Z",
    humerus: "M 206 144 L 228 136 L 232 154 L 210 162 Z",
    antebrachium: "M 228 136 Q 272 122 314 122 L 314 136 Q 272 146 232 154 Z",
    manus: "M 314 122 Q 352 110 388 124 Q 360 134 336 140 Q 324 142 314 136 Z",
    ilium: "M 206 148 Q 218 146 228 152 L 228 164 Q 218 166 206 160 Z",
    pubis: "M 212 158 L 224 170 L 218 178 L 208 168 Z",
    femur: "M 220 160 Q 226 170 224 182 Q 216 186 210 178 Q 212 168 216 160 Z",
    tibia: "M 224 182 Q 230 198 228 208 Q 222 210 216 204 Q 218 194 220 184 Z",
    metatarsus: "M 228 208 L 232 216 L 228 222 L 224 212 Z",
    pes: "M 228 218 Q 238 224 248 228 Q 238 230 226 226 Z",
  },
  frameTransform: "translate(-6 -8) scale(1.02 0.93)",
};

export const SPECIMEN_SHAPES: Record<string, AnatomyShape> = {
  trex: TREX,
  velociraptor: VELOCIRAPTOR,
  pteranodon: PTERANODON,
};

export const DEFAULT_SHAPE: AnatomyShape = TREX;
