import type { BoneId } from "../anatomyShapes";
import type { BoneRecord } from "../types";

/** Ventral dermal ossicles — no separate 2D region; used for 3D gastralia picks only. */
export const GASTRALIA_COPY: Pick<BoneRecord, "description" | "osteology"> = {
  description:
    "Gastralia are interlocking dermal elements forming a ventral basket rostral to the pubis; they stiffen the abdominal wall without enclosing a true sternal plate like mammals.",
  osteology:
    "Row count, overlap, and cross-section are compared across theropods to infer trunk support and breathing-related mechanics; they are phylogenetically informative in some clades.",
};

/** Look up the same narrative used for the 2D schematic region (shared text + species overrides). */
export function getCoarseBoneCopy(
  coarseBones: BoneRecord[],
  boneId: BoneId,
): Pick<BoneRecord, "description" | "osteology"> {
  const b = coarseBones.find((x) => x.id === boneId);
  if (!b) {
    throw new Error(`Missing coarse bone "${boneId}" in species profile`);
  }
  return { description: b.description, osteology: b.osteology };
}

type BoneOverride = Partial<Pick<BoneRecord, "description" | "osteology" | "scientificName" | "label">>;

const BASE_BONES: Record<BoneId, BoneRecord> = {
  skull: {
    id: "skull",
    label: "Skull (cranium)",
    scientificName: "Cranium",
    description: "The skull gives clues about bite force, feeding style, and where major senses were located.",
    osteology: "Scientists compare skull shape and tooth wear to estimate diet and hunting or scavenging behavior.",
    svgGroupId: "bone-skull",
  },
  mandible: {
    id: "mandible",
    label: "Lower jaw",
    scientificName: "Mandible / dentary",
    description: "The lower jaw articulates with the skull and carries teeth in toothed lineages.",
    osteology: "Joint position and tooth row curvature help reconstruct gape and feeding mechanics.",
    svgGroupId: "bone-mandible",
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
    label: "Trunk vertebrae",
    scientificName: "Dorsal (thoracic) vertebrae",
    description: "Trunk vertebrae support the rib cage and protect the spinal cord.",
    osteology: "Neural spine height and rib facets inform body depth and locomotor stiffness.",
    svgGroupId: "bone-dorsal",
  },
  sacrum: {
    id: "sacrum",
    label: "Sacrum",
    scientificName: "Sacral vertebrae",
    description: "Fused or tightly linked vertebrae between the trunk and tail transmit force to the pelvis.",
    osteology: "Sacral count and breadth help estimate hip stability and tail thrust.",
    svgGroupId: "bone-sacrum",
  },
  ribs: {
    id: "ribs",
    label: "Rib cage",
    scientificName: "Thoracic ribs",
    description: "Ribs protect viscera and anchor muscles used in breathing and trunk motion.",
    osteology: "Rib curvature and attachment scars inform body cross-section and soft-tissue volume.",
    svgGroupId: "bone-ribs",
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
    label: "Pelvis (ilium)",
    scientificName: "Ilium",
    description: "The ilium is the broad blade of the pelvis that anchors hind-limb muscles.",
    osteology: "Ilium orientation helps infer limb posture (erect vs sprawling components).",
    svgGroupId: "bone-ilium",
  },
  pubis: {
    id: "pubis",
    label: "Pubis & ischium",
    scientificName: "Pubis / ischium",
    description: "The ventral pelvis completes the hip ring and provides muscle attachment.",
    osteology: "Pubo-ischiadic proportions differ between major dinosaur groups and affect hip mobility.",
    svgGroupId: "bone-pubis",
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
    label: "Shin (tibia / fibula)",
    scientificName: "Tibia and fibula",
    description: "These bones affect stride length and force transfer toward the ankle.",
    osteology: "Tibia-to-femur proportion is often used to compare running ability.",
    svgGroupId: "bone-tibia",
  },
  metatarsus: {
    id: "metatarsus",
    label: "Metatarsus (sole)",
    scientificName: "Metatarsals",
    description: "The metatarsus forms the long sole segment between ankle and toes.",
    osteology: "Metatarsal proportions and fusion patterns are common cursoriality indicators.",
    svgGroupId: "bone-metatarsus",
  },
  pes: {
    id: "pes",
    label: "Foot (digits)",
    scientificName: "Pedal phalanges",
    description: "Toe bones are linked to traction, balance, and trackway shape.",
    osteology: "Toe spacing and claw form help connect skeletons to fossil footprints.",
    svgGroupId: "bone-pes",
  },
};

export function buildBones(overrides: Partial<Record<BoneId, BoneOverride>> = {}): BoneRecord[] {
  const order: BoneId[] = [
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
  return order.map((id) => ({
    ...BASE_BONES[id],
    ...(overrides[id] ?? {}),
  }));
}
