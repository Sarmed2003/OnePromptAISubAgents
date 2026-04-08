export type AnatomyLayer = "skeleton" | "muscle" | "soft" | "xray";

export interface BoneRecord {
  id: string;
  label: string;
  scientificName: string;
  description: string;
  /** Osteological notes for college-level copy */
  osteology: string;
  /** SVG group id in AnatomyViewer */
  svgGroupId: string;
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
}
