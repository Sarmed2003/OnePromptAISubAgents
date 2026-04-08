import type { DinosaurSpecies } from "../types";
import { buildBones } from "./sharedBones";

export const velociraptor: DinosaurSpecies = {
  id: "velociraptor",
  commonName: "Velociraptor",
  binomial: "Velociraptor mongoliensis",
  clade: "Dromaeosaurid theropod",
  period: "Late Cretaceous",
  maRange: "~75–71 million years ago",
  locality: "Mongolia",
  notes:
    "A small predatory dinosaur. Famous for its curved toe claw and close evolutionary link to birds.",
  bones: buildBones({
    skull: {
      description: "Narrow skull with sharp teeth for gripping prey.",
      osteology: "Skull and jaw shape suggest quick bites and active predation on smaller animals.",
    },
    manus: {
      description: "Long hand bones useful for grabbing.",
      osteology: "Hand proportions support the idea of active forelimb use while hunting.",
    },
    pes: {
      description: "Foot with a raised curved claw on the second toe.",
      osteology: "That claw is central to debates about hunting style and prey control.",
    },
  }),
};
