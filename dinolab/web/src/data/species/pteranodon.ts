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
      plainLanguageDescription: "The humerus was a robust yet lightweight bone that anchored the massive flight muscles responsible for powered flight and wing control. Its tubular structure with internal struts provided exceptional strength-to-weight ratio necessary for sustained aerial locomotion. The bone's articulation with the forearm allowed complex wing folding and extension during different flight phases.",
      researchNotes: "Muscle attachment scars on the humerus indicate that the pectoralis and supracoracoideus muscles were enormous, driving wing downstroke and recovery. Bone density analysis reveals Pteranodon had pneumatic (air-filled) bones similar to modern birds, dramatically reducing skeletal weight. Comparative biomechanical analysis suggests Pteranodon could sustain powered flight for hours while hunting fish from the seaway.",
      osteology: "Wing-arm bones are light but reinforced, balancing low weight and flight stress.",
    },
    antebrachium: {
      label: "Wing forearm",
      description: "Long forearm elements that support the wing membrane.",
      plainLanguageDescription: "The radius and ulna formed a rigid yet lightweight strut that extended the wing's leading edge and controlled membrane tension during flight. These bones were elongated but not as dramatically as the fourth manual digit, creating a structural framework that resisted aerodynamic forces. The articulation between humerus and antebrachium allowed wing flexing for takeoff and landing.",
      researchNotes: "Fossil evidence shows the antebrachium bones were tightly bound together by ligaments, creating a semi-rigid structure optimized for gliding and soaring flight. Cross-sectional analysis reveals these bones were hollow with internal bracing, similar to aircraft wing spars. Comparison with modern pterosaur fossils and flight models suggests Pteranodon was primarily a glider that used thermal updrafts for sustained flight.",
      osteology: "Proportions of these bones are used to estimate glide efficiency and takeoff style.",
    },
    manus: {
      label: "Wing finger",
      scientificName: "Elongated fourth manual digit",
      description: "One extremely long finger held most of the wing membrane.",
      plainLanguageDescription: "The fourth digit was extraordinarily elongated, extending up to 3 meters in large specimens, and formed the primary support for the pteroid and wing membrane. This single finger bore the majority of aerodynamic load during flight, making it the critical structural element of the wing. The three smaller digits were used for grasping and perching when the animal was grounded.",
      researchNotes: "The fourth digit's extreme elongation is unique to pterosaurs and represents a radical departure from the wing structure of birds and bats. Bone strength analysis indicates the fourth digit could withstand enormous bending and torsional stresses during powered flight and maneuvers. Fossil imprints of wing membranes show that the membrane was attached along the entire length of this digit and extended to the hind limbs.",
      osteology: "This is a key trait separating pterosaurs from birds and bats.",
    },
    pes: {
      description: "Hind feet used for launching and perching behavior.",
      plainLanguageDescription: "The hind feet were relatively small and weak compared to the forelimbs, with five toes that were used primarily for perching on cliffs or trees rather than terrestrial locomotion. The foot structure suggests Pteranodon was an awkward walker but an efficient climber capable of reaching high launch points. The pes bore little aerodynamic function, unlike the forelimbs.",
      researchNotes: "Trackway evidence and skeletal morphology suggest Pteranodon used a quadrupedal launching posture, with hind feet providing grip during the takeoff sequence. Bone structure indicates the pes was not weight-bearing during normal terrestrial movement, supporting theories that Pteranodon spent most time airborne or perched. Comparative analysis with modern climbing animals reveals similar foot bone proportions adapted for gripping rather than walking.",
      osteology: "Foot bone shape is studied to test launch models from land or water.",
    },
  }),
};