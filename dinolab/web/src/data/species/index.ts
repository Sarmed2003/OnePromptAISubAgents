import type { DinosaurSpecies } from "../types";
import { ichthyosaurus } from "./ichthyosaurus";
import { pteranodon } from "./pteranodon";
import { spinosaurus } from "./spinosaurus";
import { tyrannosaurusRex } from "./trex";
import { velociraptor } from "./velociraptor";

export const SPECIES: DinosaurSpecies[] = [
  tyrannosaurusRex,
  velociraptor,
  pteranodon,
  spinosaurus,
  ichthyosaurus,
];

export function getSpecies(id: string): DinosaurSpecies | undefined {
  return SPECIES.find((s) => s.id === id);
}
