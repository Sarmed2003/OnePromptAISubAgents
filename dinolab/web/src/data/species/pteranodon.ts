import type { DinosaurSpecies } from "../types";
import { buildBones } from "./sharedBones";

export const pteranodon: DinosaurSpecies = {
  id: "pteranodon",
  commonName: "Pteranodon",
  binomial: "Pteranodon longiceps",
  clade: "Pterosaur (flying reptile, not a dinosaur)",
  period: "Late Cretaceous",
  maRange: "~86–84 million years ago",
  locality: "Western Interior Seaway, North America",
  notes:
    "A large flying reptile with a long beak and head crest. Its wings were built from elongated forelimb elements.",
  bones: buildBones({
    humerus: {
      description: "Upper wing bone built for strong flapping and soaring control.",
      osteology: "Wing-arm bones are light but reinforced, balancing low weight and flight stress.",
    },
    antebrachium: {
      label: "Wing forearm",
      description: "Long forearm elements that support the wing membrane.",
      osteology: "Proportions of these bones are used to estimate glide efficiency and takeoff style.",
    },
    manus: {
      label: "Wing finger",
      scientificName: "Elongated fourth manual digit",
      description: "One extremely long finger held most of the wing membrane.",
      osteology: "This is a key trait separating pterosaurs from birds and bats.",
    },
    pes: {
      description: "Hind feet used for launching and perching behavior.",
      osteology: "Foot bone shape is studied to test launch models from land or water.",
    },
  }),
};
