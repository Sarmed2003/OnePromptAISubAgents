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
      plainLanguageDescription: "The elongated skull was designed for precision predation, with forward-facing eyes providing binocular vision for accurate prey targeting. Sharp, slightly recurved teeth were optimized for gripping rather than slicing, suggesting quick immobilizing bites. The relatively large brain case indicates high intelligence and sophisticated hunting coordination.",
      researchNotes: "Endocast studies of the braincase reveal that Velociraptor had a brain-to-body-size ratio comparable to modern eagles, supporting theories of advanced predatory behavior. Tooth microwear analysis shows varied wear patterns suggesting diverse prey items or scavenging behavior. Skull bone texture and muscle attachment sites indicate powerful jaw muscles concentrated at the front of the jaw.",
      osteology: "Skull and jaw shape suggest quick bites and active predation on smaller animals.",
    },
    manus: {
      description: "Long hand bones useful for grabbing.",
      plainLanguageDescription: "The three-fingered hand was highly dexterous with curved claws on digits I and II, and a slightly smaller claw on digit III. These hands could flex and extend with precision, allowing the animal to manipulate and secure struggling prey. The hand structure shows clear anatomical links to the wings of modern birds.",
      researchNotes: "Comparative analysis of manus bone proportions with modern predatory birds reveals similar functional morphology for prey manipulation. Fossilized skin impressions near hand bones suggest feathering on the forelimbs, indicating these were not purely hunting appendages but also involved display or thermoregulation. Muscle attachment patterns indicate the hands could deliver powerful grasping forces.",
      osteology: "Hand proportions support the idea of active forelimb use while hunting.",
    },
    pes: {
      description: "Foot with a raised curved claw on the second toe.",
      plainLanguageDescription: "The hind foot featured a distinctive sickle-shaped claw on the second digit that could reach 6–7 centimeters in length, held retracted above the ground during running. This claw was likely used as a slashing weapon during predatory strikes or intraspecific combat. The remaining toes were used for balance and ground contact during high-speed pursuit.",
      researchNotes: "Biomechanical modeling of the pes suggests the sickle claw could deliver significant cutting force when the foot was brought downward against prey. Wear patterns on claw fossils indicate repeated use in hunting or combat, not just occasional feeding. Comparative studies with modern raptors suggest the claw may have been used to disembowel prey or secure it during feeding.",
      osteology: "That claw is central to debates about hunting style and prey control.",
    },
  }),
};