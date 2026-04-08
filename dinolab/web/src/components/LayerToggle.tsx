import type { AnatomyLayer } from "../data/types";

const LAYERS: { id: AnatomyLayer; label: string; hint: string }[] = [
  { id: "skeleton", label: "Osteology", hint: "Skeletal layer" },
  { id: "muscle", label: "Myology", hint: "Schematic hypaxial/epaxial blocks" },
  { id: "soft", label: "Integument", hint: "Body outline / soft-tissue envelope" },
  { id: "xray", label: "Radiograph", hint: "Negative-style density view" },
];

interface Props {
  active: Set<AnatomyLayer>;
  onToggle: (layer: AnatomyLayer) => void;
}

export function LayerToggle({ active, onToggle }: Props) {
  return (
    <div className="layer-toggle" role="group" aria-label="Anatomy layers">
      {LAYERS.map((L) => (
        <button
          key={L.id}
          type="button"
          className={`layer-btn pixel-corners ${active.has(L.id) ? "is-on" : ""}`}
          onClick={() => onToggle(L.id)}
          title={L.hint}
        >
          <span className="layer-btn__label">{L.label}</span>
          <span className="layer-btn__hint">{L.hint}</span>
        </button>
      ))}
    </div>
  );
}
