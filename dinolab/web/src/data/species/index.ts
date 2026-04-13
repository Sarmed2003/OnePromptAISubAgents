import type { DinosaurSpecies } from "../types";
import { getTheropodHighFidelityBoneRecords } from "../theropodHighFidelityRig";
import { pteranodon } from "./pteranodon";
import { tyrannosaurusRex } from "./trex";
import { velociraptor } from "./velociraptor";

/** T. rex already ships fine-grained bones in `trex.ts`; other taxa append the shared high-fi 3D set. */
function withHighFiPostcrania(s: DinosaurSpecies): DinosaurSpecies {
  if (s.id === "trex") return s;
  return {
    ...s,
    bones: [...s.bones, ...getTheropodHighFidelityBoneRecords(s.id, s.bones)],
  };
}

export const SPECIES: DinosaurSpecies[] = [
  withHighFiPostcrania(tyrannosaurusRex),
  withHighFiPostcrania(velociraptor),
  withHighFiPostcrania(pteranodon),
];

export function getSpecies(id: string): DinosaurSpecies | undefined {
  return SPECIES.find((s) => s.id === id);
}
