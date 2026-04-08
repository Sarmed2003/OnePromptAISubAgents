import { useCallback, useEffect, useMemo, useState } from "react";
import { AnatomyViewer } from "./components/AnatomyViewer";
import { BoneDetailPanel } from "./components/BoneDetailPanel";
import { DinoPicker } from "./components/DinoPicker";
import { LayerToggle } from "./components/LayerToggle";
import { ScientificResearchConsole } from "./components/ScientificResearchConsole";
import { SPECIES } from "./data/species";
import type { AnatomyLayer, BoneRecord } from "./data/types";
import { API_URL, isResearchComingSoon } from "./config";

const DEFAULT_LAYERS: AnatomyLayer[] = ["skeleton", "muscle", "soft"];

export default function App() {
  const [speciesId, setSpeciesId] = useState(SPECIES[0]?.id ?? "trex");
  const species = useMemo(() => SPECIES.find((s) => s.id === speciesId)!, [speciesId]);
  const [layers, setLayers] = useState<Set<AnatomyLayer>>(() => new Set(DEFAULT_LAYERS));
  const [selectedBone, setSelectedBone] = useState<BoneRecord | null>(null);
  const [researchOpen, setResearchOpen] = useState(false);
  const researchSoon = isResearchComingSoon();

  useEffect(() => {
    setSelectedBone(null);
  }, [speciesId]);

  const toggleLayer = useCallback((layer: AnatomyLayer) => {
    setLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  const onSelectBone = useCallback((bone: BoneRecord) => {
    setSelectedBone(bone);
  }, []);

  return (
    <div className="dinolab-root">
      <div className="crt-overlay" aria-hidden />
      <header className="site-header pixel-corners">
        <div className="site-header__brand">
          <span className="logo-pixel">◆</span>
          <div>
            <h1 className="site-title">DINOLAB</h1>
            <p className="site-tagline">Bone detective lab · research interface</p>
          </div>
        </div>
        <div className="site-header__status">
          <span
            className={`pill ${API_URL && !researchSoon ? "pill--live" : "pill--local"}`}
          >
            {researchSoon ? "Research · soon" : API_URL ? "API linked" : "Local preview"}
          </span>
          <button
            type="button"
            className="btn-header-ask pixel-corners"
            onClick={() => setResearchOpen(true)}
          >
            Research console
          </button>
        </div>
      </header>

      <main className="site-main">
        <aside className="sidebar-left">
          <DinoPicker species={SPECIES} selectedId={speciesId} onSelect={setSpeciesId} />
          <dl className="species-meta">
            <div><dt>Clade</dt><dd>{species.clade}</dd></div>
            <div><dt>Period</dt><dd>{species.period}</dd></div>
            <div><dt>Age</dt><dd>{species.maRange}</dd></div>
            <div><dt>Locality</dt><dd>{species.locality}</dd></div>
          </dl>
          <div className="sidebar-left__layers">
            <h3 className="sidebar-section-title">Anatomy layers</h3>
            <LayerToggle active={layers} onToggle={toggleLayer} />
          </div>
        </aside>

        <section className="stage">
          <AnatomyViewer
            species={species}
            activeLayers={layers}
            selectedBoneId={selectedBone?.id ?? null}
            onSelectBone={onSelectBone}
          />
        </section>

        <aside className="sidebar-right">
          <BoneDetailPanel
            species={species}
            bone={selectedBone}
            onOpenResearch={() => setResearchOpen(true)}
          />
        </aside>
      </main>

      <footer className="site-footer">
        DINOLAB v1.0 · Bone Detective Lab · AWS Bedrock + S3 + DynamoDB ·
        Content for research assistance only — verify against primary literature
      </footer>

      <ScientificResearchConsole
        open={researchOpen}
        onClose={() => setResearchOpen(false)}
        species={species}
        bone={selectedBone}
      />
    </div>
  );
}
