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
      plainLanguageDescription: "The dorsal vertebrae formed the core of the spine and supported the dorsal fin, which provided stability and hydrodynamic efficiency during high-speed swimming. These vertebrae were tightly articulated to minimize lateral flexion and maximize forward propulsion. The robust vertebral bodies anchored powerful axial muscles that drove the tail side-to-side.",
      researchNotes: "Vertebral morphology analysis reveals that Ichthyosaurus had a relatively stiff spine compared to modern fish, suggesting a cruising rather than undulating swimming style. Growth rings in vertebral centra provide age estimates and show that Ichthyosaurus could live 20–30 years. Fossil evidence of calcified dorsal fins shows these structures were keeled and hydrodynamic, similar to modern tuna and sharks.",
      osteology: "Vertebral shape is used to estimate flexibility during fast cruising.",
    },
    antebrachium: {
      label: "Front flipper bones",
      description: "Forelimb bones formed paddle-like flippers.",
      plainLanguageDescription: "The radius and ulna were shortened and flattened, forming the structural core of the front flipper used for steering and lift generation during swimming. These bones were embedded in a matrix of smaller bones and cartilage that created a rigid, hydrodynamic paddle. The flipper's shape and articulation allowed fine maneuvering during prey pursuit and social interactions.",
      researchNotes: "Comparative analysis of flipper bone density and structure reveals that Ichthyosaur flippers were optimized for high-speed turning and precision maneuvering rather than propulsion. Fossil evidence shows that flipper bone proportions varied among individuals, possibly indicating sexual dimorphism or ontogenetic changes. Biomechanical modeling suggests the flippers could generate significant lift forces for vertical maneuvering and prey capture.",
      osteology: "Packed small bones increased control and stiffness in water.",
    },
    manus: {
      label: "Flipper digits",
      description: "Many small finger bones made broad flippers for steering.",
      plainLanguageDescription: "The manus contained numerous small bones arranged in a fan-like pattern, creating a broad paddle that maximized surface area for steering and lift generation. Unlike terrestrial limbs, the finger bones were not reduced but rather increased in number and packed tightly together. This structure represents an extreme adaptation to aquatic life where terrestrial limb function was no longer needed.",
      researchNotes: "Digit ray counts in Ichthyosaur flippers can exceed 10 bones per ray, far exceeding the five-digit tetrapod standard and representing hyperphalangy. Bone size and arrangement analysis reveals that manus structure varied among species, with larger specimens having proportionally larger flippers. Fossil flipper impressions show that these bones were connected by cartilage and soft tissue, creating flexible yet powerful swimming appendages.",
      osteology: "Digit counts in flippers are used to compare lineages and swimming styles.",
    },
    pes: {
      label: "Rear flipper bones",
      description: "Rear flippers helped stabilize motion in water.",
      plainLanguageDescription: "The hind flippers were smaller than the front flippers and were positioned lower on the body, functioning primarily for vertical stability and rudder-like steering adjustments. These flippers were less muscular and less actively controlled than the front flippers, suggesting a more passive role in locomotion. The rear flipper structure shows clear reduction from terrestrial limb anatomy.",
      researchNotes: "Bone morphology and muscle attachment analysis indicate that rear flippers were not actively powered but rather moved passively in response to body motion. Comparative anatomy reveals that rear flipper reduction was progressive within Ichthyosaur evolution, with later species showing more reduced hind limbs. Fossil trackways and body impressions show that rear flippers were held in a streamlined position during fast swimming, minimizing drag.",
      osteology: "Rear limb reduction patterns show adaptation away from land movement.",
    },
  }),
};