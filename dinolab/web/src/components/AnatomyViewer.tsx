import { lazy, Suspense, useState } from "react";
import type { AnatomyLayer, BoneRecord, DinosaurSpecies } from "../data/types";
import {
  BONE_ORDER,
  DEFAULT_SHAPE,
  LATERAL_MIRROR_BONE_IDS,
  SPECIMEN_SHAPES,
} from "../data/anatomyShapes";

const SVG_VIEW_WIDTH = 420;

const AnatomyViewer3D = lazy(async () => {
  const m = await import("./AnatomyViewer3D");
  return { default: m.AnatomyViewer3D };
});

type ViewMode = "2d" | "3d";

interface Props {
  species: DinosaurSpecies;
  activeLayers: Set<AnatomyLayer>;
  selectedBoneId: string | null;
  onSelectBone: (bone: BoneRecord) => void;
}

export function AnatomyViewer({ species, activeLayers, selectedBoneId, onSelectBone }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const showBones = activeLayers.has("skeleton") || activeLayers.has("xray");
  const xrayMode = activeLayers.has("xray");
  const shape = SPECIMEN_SHAPES[species.id] ?? DEFAULT_SHAPE;
  const boneOrder = BONE_ORDER;
  const castStage = species.viewerStyle === "cast";

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
        <div className="anatomy-viewer__head-row">
          <span className="tag tag--pulse">
            {viewMode === "3d" ? "ORBIT · 360°" : "LATERAL · SCHEMA"}
          </span>
          <div className="anatomy-viewer__view-toggle" role="group" aria-label="Bone map display mode">
            <button
              type="button"
              className={`anatomy-view-toggle ${viewMode === "2d" ? "is-active" : ""}`}
              onClick={() => setViewMode("2d")}
            >
              2D schema
            </button>
            <button
              type="button"
              className={`anatomy-view-toggle ${viewMode === "3d" ? "is-active" : ""}`}
              onClick={() => setViewMode("3d")}
            >
              3D orbit
            </button>
          </div>
        </div>
        <h2>Interactive bone map</h2>
        <p className="anatomy-viewer__taxon">{species.binomial}</p>
      </header>
      {viewMode === "3d" ? (
        <div
          className={`anatomy-3d-wrap ${xrayMode ? "is-xray" : ""} ${
            castStage ? "anatomy-3d-wrap--cast" : ""
          }`}
          data-bones-visible={showBones}
        >
          <Suspense
            fallback={
              <div className="anatomy-3d-wrap__loading" aria-busy="true">
                Loading 3D viewer…
              </div>
            }
          >
            <AnatomyViewer3D
              species={species}
              activeLayers={activeLayers}
              selectedBoneId={selectedBoneId}
              onSelectBone={onSelectBone}
            />
          </Suspense>
        </div>
      ) : null}
      {viewMode === "2d" ? (
      <div
        className={`anatomy-svg-wrap ${xrayMode ? "is-xray" : ""}`}
        data-bones-visible={showBones}
      >
        <svg
          className="anatomy-svg"
          viewBox="0 0 420 240"
          role="img"
          aria-label={`Lateral bone schematic for ${species.binomial}`}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="holofill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d26a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d67d34" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <g transform={shape.frameTransform}>
            <g
              className={`anatomy-bones ${showBones ? "is-visible" : "is-hidden"}`}
              style={{ pointerEvents: showBones ? "auto" : "none" }}
            >
              {boneOrder.map((boneId) => (
                <g key={boneId}>
                  <g
                    id={`bone-${boneId}`}
                    data-bone-id={boneId}
                    className={`bone-group ${selectedBoneId === boneId ? "is-selected" : ""}`}
                  >
                    <path d={shape.bones[boneId]} />
                  </g>
                  {LATERAL_MIRROR_BONE_IDS.includes(boneId) ? (
                    <g
                      className="bone-group bone-group--contralateral"
                      transform={`translate(${SVG_VIEW_WIDTH} 0) scale(-1 1)`}
                      opacity={0.5}
                    >
                      <g
                        id={`bone-${boneId}-far`}
                        data-bone-id={boneId}
                        className={`bone-group ${selectedBoneId === boneId ? "is-selected" : ""}`}
                      >
                        <path d={shape.bones[boneId]} />
                      </g>
                    </g>
                  ) : null}
                </g>
              ))}
            </g>
          </g>
        </svg>
      </div>
      ) : null}
      <footer className="anatomy-viewer__foot">
        <span>
          {viewMode === "3d"
            ? `${species.bones.length} bones · full 360° orbit · same ids as 2D schematic`
            : `${species.bones.length} clickable bones · far limbs mirrored in 2D · same ids as 3D where applicable`}
        </span>
      </footer>
    </div>
  );
}
