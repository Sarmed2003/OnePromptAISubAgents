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

export function AnatomyViewer({
  species,
  activeLayers,
  selectedBoneId,
  onSelectBone,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [isLoading3D, setIsLoading3D] = useState(false);

  const showBones = activeLayers.has("skeleton") || activeLayers.has("xray");
  const xrayMode = activeLayers.has("xray");
  const shape = SPECIMEN_SHAPES[species.id] ?? DEFAULT_SHAPE;
  const boneOrder = BONE_ORDER;
  const castStage = species.viewerStyle === "cast";

  const handleBoneClick = (e: React.MouseEvent<SVGElement>): void => {
    const target = e.target as SVGElement;
    const boneGroup = target.closest("[data-bone-id]");

    if (!boneGroup) {
      return;
    }

    const boneId = boneGroup.getAttribute("data-bone-id");
    if (!boneId) {
      return;
    }

    const bone = species.bones.find((b) => b.id === boneId);
    if (bone) {
      onSelectBone(bone);
    }
  };

  const handleViewModeChange = (newMode: ViewMode): void => {
    setViewMode(newMode);
    if (newMode === "3d") {
      setIsLoading3D(true);
    }
  };

  const handle3DLoad = (): void => {
    setIsLoading3D(false);
  };

  return (
    <div className="anatomy-viewer hologram-panel pixel-corners">
      <header className="anatomy-viewer__head">
        <div className="anatomy-viewer__head-row">
          <span className="tag tag--pulse">
            {viewMode === "3d" ? "ORBIT · 360°" : "LATERAL · SCHEMA"}
          </span>
          <div
            className="anatomy-viewer__view-toggle"
            role="group"
            aria-label="Bone map display mode"
          >
            <button
              type="button"
              className={`anatomy-view-toggle ${viewMode === "2d" ? "is-active" : ""}`}
              onClick={() => handleViewModeChange("2d")}
              aria-pressed={viewMode === "2d"}
            >
              2D schema
            </button>
            <button
              type="button"
              className={`anatomy-view-toggle ${viewMode === "3d" ? "is-active" : ""}`}
              onClick={() => handleViewModeChange("3d")}
              aria-pressed={viewMode === "3d"}
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
                <div className="loading-spinner">Loading 3D viewer…</div>
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
            onClick={handleBoneClick}
          >
            <defs>
              <linearGradient id="holofill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d26a" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#d67d34" stopOpacity="0.2" />
              </linearGradient>
              <filter id="hologram-glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g transform={shape.frameTransform}>
              <g
                className={`anatomy-bones ${showBones ? "is-visible" : "is-hidden"}`}
                style={{ pointerEvents: showBones ? "auto" : "none" }}
              >
                {boneOrder.map((boneId) => {
                  const boneData = species.bones.find((b) => b.id === boneId);
                  const isSelected = selectedBoneId === boneId;

                  return (
                    <g key={boneId}>
                      <g
                        id={`bone-${boneId}`}
                        data-bone-id={boneId}
                        className={`bone-group ${isSelected ? "is-selected" : ""}`}
                        style={{
                          cursor: "pointer",
                          filter: isSelected ? "url(#hologram-glow)" : undefined,
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={boneData ? `Select ${boneData.name}` : `Select bone ${boneId}`}
                      >
                        <path
                          d={shape.bones[boneId]}
                          fill="url(#holofill)"
                          stroke="#00d26a"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
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
                            className={`bone-group ${isSelected ? "is-selected" : ""}`}
                            style={{
                              cursor: "pointer",
                              filter: isSelected ? "url(#hologram-glow)" : undefined,
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={boneData ? `Select ${boneData.name} (far side)` : `Select bone ${boneId} (far side)`}
                          >
                            <path
                              d={shape.bones[boneId]}
                              fill="url(#holofill)"
                              stroke="#00d26a"
                              strokeWidth="1"
                              vectorEffect="non-scaling-stroke"
                            />
                          </g>
                        </g>
                      ) : null}
                    </g>
                  );
                })}
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
