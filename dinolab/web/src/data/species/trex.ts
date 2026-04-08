import type { DinosaurSpecies } from "../types";
import { buildBones } from "./sharedBones";

export const tyrannosaurusRex: DinosaurSpecies = {
  id: "trex",
  commonName: "Tyrannosaurus",
  binomial: "Tyrannosaurus rex",
  clade: "Theropod dinosaur",
  period: "Late Cretaceous",
  maRange: "~68–66 million years ago",
  locality: "Western North America",
  notes:
    "A very large land predator. Researchers use bite marks, skull shape, and leg bones to study how it hunted, scavenged, and moved.",
  bones: buildBones({
    skull: {
      description: "Large skull built for strong biting and tearing.",
      osteology: "Tooth shape and bite marks suggest T. rex could crush bone better than many other theropods.",
    },
    humerus: {
      description: "Short but sturdy upper arm.",
      osteology: "Even with short arms, the bone shows real muscle attachments, so the forelimb still had function.",
    },
    femur: {
      description: "Heavy thigh bone supporting a very large body.",
      osteology: "Growth lines in bone help estimate how quickly this animal grew as a juvenile.",
    },
  }),
};
