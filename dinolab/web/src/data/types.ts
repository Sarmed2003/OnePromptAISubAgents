/** Osteology-first UI: skeleton + optional radiograph styling (no schematic muscle/soft-tissue layers). */
export type AnatomyLayer = "skeleton" | "xray";

export interface BoneRecord {
  id: string;
  label: string;
  scientificName: string;
  description: string;
  /** Osteological notes for college-level copy */
  osteology: string;
  /** SVG group id in AnatomyViewer */
  svgGroupId: string;
  /** Plain-language explanation of what the bone does in the animal's body */
  plainLanguageDescription?: string;
  /** Scientific context on how researchers study this bone */
  researchNotes?: string;
}

export interface DinosaurSpecies {
  id: string;
  commonName: string;
  binomial: string;
  clade: string;
  period: string;
  maRange: string;
  locality: string;
  notes: string;
  bones: BoneRecord[];
  /**
   * "cast" = black stage + off-white bone materials in 3D (visual style only; no external specimen copy).
   */
  viewerStyle?: "default" | "cast";
}
