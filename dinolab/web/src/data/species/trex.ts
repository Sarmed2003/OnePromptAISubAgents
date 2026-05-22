import type { DinosaurSpecies } from "../types";
import { buildBones } from "./sharedBones";
import { buildSueHighFidelityBoneRecords } from "./trexSueHighFidelityBones";

const trexCoarseBones = buildBones({
  skull: {
    description: "Large skull built for strong biting and tearing.",
    osteology: "Tooth shape and bite marks suggest T. rex could crush bone better than many other theropods.",
    plain_language: "The skull: a massive, reinforced box housing the brain and jaw muscles, with teeth designed to crush bone and tear flesh.",
    research_note: "Paleontologists analyze bite marks and jaw mechanics to understand hunting behavior; CT scans of brain casts reveal visual and olfactory capabilities.",
  },
  humerus: {
    description: "Short but sturdy upper arm.",
    osteology: "Even with short arms, the bone shows real muscle attachments, so the forelimb still had function.",
    plain_language: "The humerus: the upper arm bone connecting shoulder to forearm, shorter than in other theropods but powerfully built for grasping and manipulation.",
    research_note: "Muscle attachment scars on the humerus indicate the forelimbs could generate significant force, challenging the idea that T. rex arms were vestigial.",
  },
  femur: {
    description: "Heavy thigh bone supporting a very large body.",
    osteology: "Growth lines in bone help estimate how quickly this animal grew as a juvenile.",
    plain_language: "The femur: the thigh bone that bore most of the dinosaur's weight, columnar and robust to support a multi-ton body during walking and running.",
    research_note: "Paleontologists study femur thickness and growth rings to estimate muscle mass, body mass, and growth rates; stress patterns reveal loading forces during locomotion.",
  },
});

export const tyrannosaurusRex: DinosaurSpecies = {
  id: "trex",
  commonName: "Tyrannosaurus",
  binomial: "Tyrannosaurus rex",
  clade: "Theropod dinosaur",
  period: "Late Cretaceous",
  maRange: "~68–66 million years ago",
  locality: "Western North America",
  family: "Tyrannosauridae",
  time_period: "Late Cretaceous (Maastrichtian stage)",
  geographic_origin: "Western North America (modern-day Montana, South Dakota, Wyoming, and Alberta)",
  notes:
    "A very large land predator. Researchers use bite marks, skull shape, and leg bones to study how it hunted, scavenged, and moved.",
  viewerStyle: "cast",
  bones: [...trexCoarseBones, ...buildSueHighFidelityBoneRecords(trexCoarseBones)],
};