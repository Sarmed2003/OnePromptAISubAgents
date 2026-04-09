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
      plainLanguageDescription: "The elongated snout was specialized for aquatic hunting, with conical teeth designed to grip slippery fish prey rather than tearing flesh. The skull's hydrodynamic shape minimized drag during underwater pursuit, and the forward-positioned nares (nostrils) allowed breathing while mostly submerged. The overall morphology reveals a predator equally at home in water as on land.",
      researchNotes: "Coprolite (fossilized fecal) analysis associated with Spinosaurus specimens contains fish scales and bone fragments, providing direct evidence of piscivory. Isotopic analysis of tooth enamel indicates that Spinosaurus spent significant time in aquatic environments. Recent fossil discoveries including paddle-like feet have revolutionized understanding of this species as a semi-aquatic or fully aquatic predator.",
      osteology: "Snout shape and tooth form are commonly compared with modern fish-eating animals.",
    },
    caudal: {
      description: "Tail vertebrae supported a deep tail useful for water propulsion.",
      plainLanguageDescription: "The caudal vertebrae were tall and dorsoventrally compressed, supporting tall neural spines that created a paddle-like tail fin for swimming propulsion. This tail structure provided powerful thrust for pursuing aquatic prey and maneuvering in water. The morphology is unique among theropods and represents a major adaptation to aquatic life.",
      researchNotes: "3D reconstruction of tail vertebrae shows that neural spines could have supported a sail-like or fin-like structure extending 1–2 meters above the spine. Comparative analysis with modern crocodilians and swimming reptiles reveals similar vertebral adaptations for aquatic propulsion. Biomechanical modeling suggests the tail could generate sufficient thrust for speeds of 10–12 km/h in water.",
      osteology: "Tail shape is central evidence in arguments for active swimming.",
    },
    pes: {
      description: "Foot bones were broad and likely adapted for soft ground near water.",
      plainLanguageDescription: "The hind feet were notably broad and paddle-like compared to other theropods, with splayed toes that distributed weight across soft muddy substrates. The bone structure suggests webbing may have connected the toes, similar to modern waterfowl. This morphology represents a compromise between terrestrial mobility and aquatic efficiency.",
      researchNotes: "Fossil trackways attributed to Spinosaurus show a distinctive toe-spread pattern consistent with semi-aquatic locomotion. Comparative skeletal analysis reveals that pes proportions differ significantly from cursorial theropods, supporting interpretations of reduced running speed but enhanced swimming capability. Bone density measurements suggest some bones were denser than typical theropod bones, possibly aiding in diving and underwater maneuvering.",
      osteology: "Hind limb and foot proportions differ from classic land-running theropods.",
    },
  }),
};