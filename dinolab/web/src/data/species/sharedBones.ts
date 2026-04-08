import type { BoneRecord } from "../types";

type BoneId =
  | "skull"
  | "cervical"
  | "dorsal"
  | "caudal"
  | "scapula"
  | "humerus"
  | "antebrachium"
  | "manus"
  | "ilium"
  | "femur"
  | "tibia"
  | "pes";

type BoneOverride = Partial<Pick<BoneRecord, "description" | "osteology" | "scientificName" | "label">>;

const BASE_BONES: Record<BoneId, BoneRecord> = {
  skull: {
    id: "skull",
    label: "Skull",
    scientificName: "Cranium",
    description: "The skull gives clues about bite force, feeding style, and where major senses were located.",
    osteology: "Scientists compare skull shape and tooth wear to estimate diet and hunting or scavenging behavior.",
    svgGroupId: "bone-skull",
  },
  cervical: {
    id: "cervical",
    label: "Neck vertebrae",
    scientificName: "Cervical vertebrae",
    description: "Neck bones show how far the head could move up, down, and side to side.",
    osteology: "Joint shape in the neck helps estimate posture and how quickly the animal could track movement.",
    svgGroupId: "bone-cervical",
  },
  dorsal: {
    id: "dorsal",
    label: "Back vertebrae",
    scientificName: "Dorsal vertebrae",
    description: "Back bones support the ribs and protect the spinal cord.",
    osteology: "Spacing and shape of vertebrae can hint at breathing mechanics and body stiffness.",
    svgGroupId: "bone-dorsal",
  },
  caudal: {
    id: "caudal",
    label: "Tail vertebrae",
    scientificName: "Caudal vertebrae",
    description: "Tail bones influence balance, turning, and in some species swimming power.",
    osteology: "Muscle attachment marks on the tail help reconstruct movement and center of mass.",
    svgGroupId: "bone-caudal",
  },
  scapula: {
    id: "scapula",
    label: "Shoulder girdle",
    scientificName: "Scapula / coracoid",
    description: "Shoulder bones anchor muscles that control forelimbs or wings.",
    osteology: "The shoulder joint angle helps estimate how the front limb was used in life.",
    svgGroupId: "bone-scapula",
  },
  humerus: {
    id: "humerus",
    label: "Upper forelimb",
    scientificName: "Humerus",
    description: "This long bone carries force from shoulder to lower forelimb.",
    osteology: "Bone thickness and shape are used to estimate loading during movement.",
    svgGroupId: "bone-humerus",
  },
  antebrachium: {
    id: "antebrachium",
    label: "Lower forelimb",
    scientificName: "Radius and ulna",
    description: "The lower forelimb helps with reach, rotation, or wing control depending on species.",
    osteology: "Relative radius-ulna size helps estimate limb function and range of motion.",
    svgGroupId: "bone-antebrachium",
  },
  manus: {
    id: "manus",
    label: "Hand / wing tip",
    scientificName: "Manual elements",
    description: "Hand bones can indicate grasping, display, or flight-related support.",
    osteology: "Digit length patterns are useful for comparing behavior across related species.",
    svgGroupId: "bone-manus",
  },
  ilium: {
    id: "ilium",
    label: "Pelvis",
    scientificName: "Ilium",
    description: "The pelvis transfers body weight to the hind limbs.",
    osteology: "Pelvic shape is key for estimating stance and muscle leverage in walking or running.",
    svgGroupId: "bone-ilium",
  },
  femur: {
    id: "femur",
    label: "Thigh bone",
    scientificName: "Femur",
    description: "A major weight-bearing bone used to estimate body mass and locomotion style.",
    osteology: "Histology (thin sections) can reveal growth speed and age trends.",
    svgGroupId: "bone-femur",
  },
  tibia: {
    id: "tibia",
    label: "Shin bones",
    scientificName: "Tibia and fibula",
    description: "These bones affect stride length and force transfer to the foot.",
    osteology: "Tibia-to-femur proportion is often used to compare running ability.",
    svgGroupId: "bone-tibia",
  },
  pes: {
    id: "pes",
    label: "Foot",
    scientificName: "Pedal elements",
    description: "Foot bones are linked to traction, balance, and trackway shape.",
    osteology: "Toe spacing and claw form help connect skeletons to fossil footprints.",
    svgGroupId: "bone-pes",
  },
};

export function buildBones(overrides: Partial<Record<BoneId, BoneOverride>> = {}): BoneRecord[] {
  const order: BoneId[] = [
    "skull",
    "cervical",
    "dorsal",
    "caudal",
    "scapula",
    "humerus",
    "antebrachium",
    "manus",
    "ilium",
    "femur",
    "tibia",
    "pes",
  ];
  return order.map((id) => ({
    ...BASE_BONES[id],
    ...(overrides[id] ?? {}),
  }));
}
