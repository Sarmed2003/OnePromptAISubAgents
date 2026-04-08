import type { DinosaurSpecies } from "../types";
import { buildBones } from "./sharedBones";

export const spinosaurus: DinosaurSpecies = {
  id: "spinosaurus",
  commonName: "Spinosaurus",
  binomial: "Spinosaurus aegyptiacus",
  clade: "Spinosaurid theropod",
  period: "Mid Cretaceous",
  maRange: "~99–93 million years ago",
  locality: "North Africa",
  notes:
    "A giant theropod often linked to rivers and coastal habitats. Current research supports a strong swimming component in its lifestyle.",
  bones: buildBones({
    skull: {
      description: "Long, narrow skull with conical teeth, useful for catching fish.",
      osteology: "Snout shape and tooth form are commonly compared with modern fish-eating animals.",
    },
    caudal: {
      description: "Tail vertebrae supported a deep tail useful for water propulsion.",
      osteology: "Tail shape is central evidence in arguments for active swimming.",
    },
    pes: {
      description: "Foot bones were broad and likely adapted for soft ground near water.",
      osteology: "Hind limb and foot proportions differ from classic land-running theropods.",
    },
  }),
};
