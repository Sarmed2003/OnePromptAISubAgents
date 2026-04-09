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
      plainLanguageDescription: "The skull housed powerful jaw muscles and was reinforced to withstand the forces of biting and shaking prey. Its large size relative to the body suggests that the head was a primary hunting weapon. The thick bone structure protected the brain during violent feeding behavior.",
      researchNotes: "Bite force analysis using skull geometry and muscle attachment scars reveals T. rex could deliver one of the strongest bites of any land animal. CT scanning of fossilized skulls helps paleontologists understand brain structure and sensory capabilities. Tooth wear patterns on individual specimens provide evidence of feeding strategies and prey preferences.",
      osteology: "Tooth shape and bite marks suggest T. rex could crush bone better than many other theropods.",
    },
    humerus: {
      description: "Short but sturdy upper arm.",
      plainLanguageDescription: "Despite their notorious shortness, T. rex forelimbs were muscular and capable of significant force, with the humerus anchoring powerful biceps and triceps. The bone's robust construction suggests the arms were used for gripping prey or pushing the body up from a resting position. The relatively short length was offset by exceptional bone density and strength.",
      researchNotes: "Muscle attachment scars on the humerus reveal that T. rex could lift approximately 400 pounds with each arm, challenging old assumptions about forelimb uselessness. Comparative anatomy with other theropods shows that arm reduction was gradual over evolutionary time. Biomechanical modeling using humerus dimensions helps estimate the mechanical advantage of forelimb movements.",
      osteology: "Even with short arms, the bone shows real muscle attachments, so the forelimb still had function.",
    },
    femur: {
      description: "Heavy thigh bone supporting a very large body.",
      plainLanguageDescription: "The femur was the primary weight-bearing bone connecting the hip to the knee, supporting a body mass estimated between 8,000 and 13,000 kilograms. Its massive diameter and thick cortical bone provided the structural strength necessary to withstand the stresses of bipedal locomotion at high speeds. The bone's shape reveals information about muscle attachments used in running and turning.",
      researchNotes: "Growth rings (LAGs—lines of arrested growth) visible in femur cross-sections allow paleontologists to estimate that T. rex reached adult size within 15–20 years. Biomechanical analysis of femur stress patterns indicates T. rex could run at speeds of 10–25 kilometers per hour despite its enormous size. Comparing femur dimensions across individuals of different ages has revealed that growth rates changed dramatically at sexual maturity.",
      osteology: "Growth lines in bone help estimate how quickly this animal grew as a juvenile.",
    },
  }),
};