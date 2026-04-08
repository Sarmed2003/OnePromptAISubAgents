import type { DinosaurSpecies } from "../data/types";

interface Props {
  species: DinosaurSpecies[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function DinoPicker({ species, selectedId, onSelect }: Props) {
  return (
    <div className="dino-picker hologram-panel pixel-corners">
      <header className="dino-picker__head">
        <span className="tag tag--pulse">SPECIMEN</span>
        <h2>Taxon selector</h2>
      </header>
      <ul className="dino-picker__list">
        {species.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={`dino-picker__item ${selectedId === s.id ? "is-active" : ""}`}
              onClick={() => onSelect(s.id)}
            >
              <span className="dino-picker__name">{s.commonName}</span>
              <span className="dino-picker__binomial">{s.binomial}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
