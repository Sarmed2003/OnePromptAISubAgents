import { type FormEvent, useState } from "react";
import type { BoneRecord, DinosaurSpecies } from "../data/types";
import { isResearchComingSoon, isVercelHostedResearchUI } from "../config";
import { useAgentAsk } from "../hooks/useAgentAsk";
import { PROJECT } from "../project";
import researchMascotUrl from "../assets/research-mascot.png";

/** Served from `public/mascots/` so production (Vercel) always gets a stable URL, not only a bundled import. */
const DINOLAB_HOSTED_LOGO = `${import.meta.env.BASE_URL}mascots/dinolab-mascot-logo.png`;

interface Props {
  open: boolean;
  onClose: () => void;
  species: DinosaurSpecies;
  bone: BoneRecord | null;
}

export function ScientificResearchConsole({ open, onClose, species, bone }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const { ask, loading, error, hasApi } = useAgentAsk();
  const comingSoon = isResearchComingSoon();
  const vercelHostedUi = isVercelHostedResearchUI();

  if (!open) return null;

  const ctx =
    bone != null
      ? `${bone.label} (${bone.scientificName})\n${bone.description}\n${bone.osteology}`
      : species.notes;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAnswer("");
    const res = await ask({
      question: question.trim(),
      speciesId: species.id,
      speciesBinomial: species.binomial,
      boneId: bone?.id,
      boneScientificName: bone?.scientificName,
      boneContext: ctx,
    });
    setAnswer(res.answer || res.error || "");
  };

  if (comingSoon && vercelHostedUi) {
    const hostedHost =
      typeof window !== "undefined" ? window.location.hostname : PROJECT.vercelHost;
    const profileLead = bone
      ? `${bone.label} (${bone.scientificName}) — ${bone.description}`
      : species.notes;

    return (
      <div className="research-overlay" role="dialog" aria-modal aria-labelledby="research-title">
        <div className="research-modal research-modal--vercel-hosted hologram-panel pixel-corners">
          <header className="research-modal__head">
            <div>
              <h2 id="research-title">
                {PROJECT.appName} — multi-agent research console
              </h2>
              <p className="research-modal__sub">
                {PROJECT.githubRepo} · {hostedHost} · Bedrock Q&amp;A offline on the public web
              </p>
            </div>
            <button type="button" className="btn-close pixel-corners" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </header>

          <div className="research-vercel__top">
            <div className="research-vercel__context pixel-corners">
              <span className="tag">Context</span>
              <h3 className="research-vercel__accent">Dinosaur profile</h3>
              <p className="research-vercel__profile-name">{species.binomial}</p>
              <p className="research-vercel__body">{profileLead}</p>
              <h3 className="research-vercel__accent">Loco · {PROJECT.subtitle}</h3>
              <p className="research-vercel__body">
                Loco rides along while this hosted build ({hostedHost}) keeps Amazon Bedrock research
                turned off for visitors. The live stack ships from{" "}
                <strong>{PROJECT.githubRepo}</strong> alongside the {PROJECT.orchestrator} swarm. Clone the
                repo, run <code className="research-vercel__code">dinolab/web</code> with{" "}
                <code className="research-vercel__code">VITE_API_URL</code> pointed at your ask endpoint (e.g.{" "}
                <code className="research-vercel__code">local_ask_server.py</code> on port 8787) to use the
                full research console with your API keys—never on this public page.
              </p>
            </div>
            <div className="research-vercel__mascot-wrap research-vercel__mascot-wrap--logo">
              <img
                className="research-vercel__logo"
                src={DINOLAB_HOSTED_LOGO}
                alt="DINOLAB mascot — pixel-art dinosaur and rider logo"
              />
            </div>
          </div>

          <div className="research-vercel__field">
            <label htmlFor="vercel-research-placeholder" className="research-vercel__label">
              Research question (college level, beginner-friendly)
            </label>
            <textarea
              id="vercel-research-placeholder"
              className="research-input research-input--vercel pixel-corners"
              rows={5}
              readOnly
              tabIndex={-1}
              placeholder="e.g. What does the femur shape in this species tell us about speed, body weight, and growth as it aged?"
              value=""
            />
          </div>

          <div className="research-vercel__actions">
            <button type="button" className="btn-vercel-soon pixel-corners" disabled>
              down for now, up soon!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (comingSoon) {
    return (
      <div className="research-overlay" role="dialog" aria-modal aria-labelledby="research-title">
        <div className="research-modal research-modal--soon hologram-panel pixel-corners">
          <header className="research-modal__head">
            <div>
              <h2 id="research-title">Multi-agent research console</h2>
              <p className="research-modal__sub">Opening soon on this site</p>
            </div>
            <button type="button" className="btn-close pixel-corners" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </header>
          <div className="research-modal__context">
            <span className="tag">Context</span>
            <p>
              <strong>{species.binomial}</strong>
              {bone ? ` · ${bone.scientificName}` : ""}
            </p>
          </div>
          <div className="research-coming-soon">
            <img
              className="research-coming-soon__mascot"
              src={researchMascotUrl}
              alt="Pixel-art dinosaur with a small coding companion"
            />
            <p className="research-coming-soon__msg">The research console will be up and running soon!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="research-overlay" role="dialog" aria-modal aria-labelledby="research-title">
      <div className="research-modal hologram-panel pixel-corners">
        <header className="research-modal__head">
          <div>
            <h2 id="research-title">Multi-agent research console</h2>
            <p className="research-modal__sub">
              {hasApi
                ? "Connected to AWS research service (Lambda + Bedrock)"
                : "Research service not connected"}
            </p>
          </div>
          <button type="button" className="btn-close pixel-corners" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="research-modal__context">
          <span className="tag">Context</span>
          <p>
            <strong>{species.binomial}</strong>
            {bone ? ` · ${bone.scientificName}` : ""}
          </p>
        </div>
        <form className="research-form" onSubmit={handleSubmit}>
          <label htmlFor="q">Research question (college level, beginner-friendly)</label>
          <textarea
            id="q"
            className="research-input pixel-corners"
            rows={5}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What does the femur shape in this species tell us about speed, body weight, and growth as it aged?"
          />
          <div className="research-actions">
            <button type="submit" className="btn-submit pixel-corners" disabled={loading || !hasApi}>
              {loading ? "Invoking model…" : "Submit to Bedrock agent"}
            </button>
          </div>
        </form>
        {error ? <p className="research-error">{error}</p> : null}
        {answer ? (
          <section className="research-answer pixel-corners" aria-label="Research synthesis">
            <div className="research-answer__head">
              <h3>Synthesis</h3>
              <span className="research-answer__scroll-hint" title="Full model output is below; scroll to read every section.">
                Scroll for full detail
              </span>
            </div>
            <div
              className="research-answer__scroll"
              tabIndex={0}
              role="region"
              aria-label="Synthesis text, scroll for complete answer"
            >
              <pre className="research-answer__text">{answer}</pre>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
