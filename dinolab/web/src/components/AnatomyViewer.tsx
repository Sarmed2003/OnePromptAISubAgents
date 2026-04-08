import type { AnatomyLayer, BoneRecord, DinosaurSpecies } from "../data/types";
import { DEFAULT_SHAPE, SPECIMEN_SHAPES, type BoneId } from "../data/anatomyShapes";

interface Props {
  species: DinosaurSpecies;
  activeLayers: Set<AnatomyLayer>;
  selectedBoneId: string | null;
  onSelectBone: (bone: BoneRecord) => void;
}

function layerClass(active: Set<AnatomyLayer>, layer: AnatomyLayer): string {
  return `anatomy-layer anatomy-layer--${layer} ${active.has(layer) ? "is-on" : "is-off"}`;
}

// Global fit transforms to keep soft/myology tightly aligned to the radiograph skeleton.
const SOFT_FIT_TRANSFORM = "translate(34 20) scale(0.84 0.84)";
const MUSCLE_FIT_TRANSFORM = "translate(21 12) scale(0.9 0.9)";

export function AnatomyViewer({ species, activeLayers, selectedBoneId, onSelectBone }: Props) {
  const showBones = activeLayers.has("skeleton") || activeLayers.has("xray");
  const xrayMode = activeLayers.has("xray");
  const shape = SPECIMEN_SHAPES[species.id] ?? DEFAULT_SHAPE;
  const boneOrder: BoneId[] = [
    "skull",
    "cervical",
    "dorsal",
    "caudal",
    "scapula",
    "humerus",
    "antebrachium",
    "manus",
    "ilium",
    "femur",
    "tibia",
    "pes",
  ];

  const handleClick = (e: React.MouseEvent<SVGElement>) => {
    const t = e.target as SVGElement;
    const g = t.closest("[data-bone-id]");
    if (!g) return;
    const id = g.getAttribute("data-bone-id");
    if (!id) return;
    const bone = species.bones.find((b) => b.id === id);
    if (bone) onSelectBone(bone);
  };

  return (
    <div className="anatomy-viewer hologram-panel pixel-corners">
      <header className="anatomy-viewer__head">
        <span className="tag tag--pulse">LATERAL · SCHEMA</span>
        <h2>Interactive bone map</h2>
        <p className="anatomy-viewer__taxon">{species.binomial}</p>
      </header>
      <div
        className={`anatomy-svg-wrap ${xrayMode ? "is-xray" : ""}`}
        data-bones-visible={showBones}
      >
        <svg
          className="anatomy-svg"
          viewBox="0 0 420 240"
          role="img"
          aria-label={`Layered anatomy schematic for ${species.binomial}`}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="holofill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d26a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d67d34" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <g transform={shape.frameTransform}>
            <g transform={SOFT_FIT_TRANSFORM}>
              <g className={layerClass(activeLayers, "soft")} pointerEvents="none">
                {shape.softLayers.map((layerPath, idx) => (
                  <path key={`soft-${idx}`} className="soft-silhouette" d={layerPath} />
                ))}
              </g>
            </g>

            <g transform={MUSCLE_FIT_TRANSFORM}>
              <g className={layerClass(activeLayers, "muscle")} pointerEvents="none">
                {shape.muscles.map((musclePath, idx) => (
                  <path
                    key={`muscle-${idx}`}
                    className={`muscle-block muscle-block--region-${idx + 1}`}
                    d={musclePath}
                  />
                ))}
              </g>
            </g>

            <g
              className={`anatomy-bones ${showBones ? "is-visible" : "is-hidden"}`}
              style={{ pointerEvents: showBones ? "auto" : "none" }}
            >
              {boneOrder.map((boneId) => (
                <g
                  key={boneId}
                  id={`bone-${boneId}`}
                  data-bone-id={boneId}
                  className={`bone-group ${selectedBoneId === boneId ? "is-selected" : ""}`}
                >
                  <path d={shape.bones[boneId]} />
                </g>
              ))}
            </g>
          </g>
        </svg>
      </div>
      <footer className="anatomy-viewer__foot">
        <span>
          {species.bones.length} clickable bones · osteology and radiograph use the same bone map
        </span>
      </footer>
    </div>
  );
}
