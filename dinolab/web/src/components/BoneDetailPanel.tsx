import type { BoneRecord, DinosaurSpecies } from "../data/types";

interface Props {
  species: DinosaurSpecies;
  bone: BoneRecord | null;
  onOpenResearch: () => void;
}

export function BoneDetailPanel({ species, bone, onOpenResearch }: Props) {
  if (!bone) {
    return (
      <aside className="bone-panel bone-panel--empty hologram-panel pixel-corners">
        <p className="bone-panel__placeholder">
          <span className="cursor-blink">▍</span> Select a bone in the 2D schematic or 3D viewer.
        </p>
      </aside>
    );
  }

  return (
    <aside className="bone-panel hologram-panel pixel-corners">
      <div className="bone-panel__scan">
        <div className="wireframe-bone" aria-hidden>
          <div className="wireframe-bone__core" />
          <div className="wireframe-bone__ring wireframe-bone__ring--a" />
          <div className="wireframe-bone__ring wireframe-bone__ring--b" />
          <div className="wireframe-bone__grid" />
        </div>
        <div className="bone-panel__meta">
          <span className="tag">{species.binomial}</span>
          <h3>{bone.label}</h3>
          <p className="bone-panel__sci">{bone.scientificName}</p>
        </div>
      </div>
      <section className="bone-panel__body">
        <h4>What this bone does</h4>
        <p>{bone.description}</p>
        <h4>How scientists study it</h4>
        <p className="bone-panel__ost">{bone.osteology}</p>
        <button type="button" className="btn-bonus pixel-corners" onClick={onOpenResearch}>
          <span className="btn-bonus__glow" />
          Ask AI about this bone
        </button>
      </section>
    </aside>
  );
}
