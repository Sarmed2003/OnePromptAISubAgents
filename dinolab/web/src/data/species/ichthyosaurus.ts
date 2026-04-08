import type { DinosaurSpecies } from "../types";
import { buildBones } from "./sharedBones";

export const ichthyosaurus: DinosaurSpecies = {
  id: "ichthyosaurus",
  commonName: "Ichthyosaurus",
  binomial: "Ichthyosaurus communis",
  clade: "Ichthyosaur (marine reptile, not a dinosaur)",
  period: "Early Jurassic",
  maRange: "~201–174 million years ago",
  locality: "Europe (especially UK coasts)",
  notes:
    "A dolphin-shaped marine reptile. Its body was highly adapted for fast swimming in open water.",
  bones: buildBones({
    dorsal: {
      description: "Back bones helped support a streamlined swimming body.",
      osteology: "Vertebral shape is used to estimate flexibility during fast cruising.",
    },
    antebrachium: {
      label: "Front flipper bones",
      description: "Forelimb bones formed paddle-like flippers.",
      osteology: "Packed small bones increased control and stiffness in water.",
    },
    manus: {
      label: "Flipper digits",
      description: "Many small finger bones made broad flippers for steering.",
      osteology: "Digit counts in flippers are used to compare lineages and swimming styles.",
    },
    pes: {
      label: "Rear flipper bones",
      description: "Rear flippers helped stabilize motion in water.",
      osteology: "Rear limb reduction patterns show adaptation away from land movement.",
    },
  }),
};
