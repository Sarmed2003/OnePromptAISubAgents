import { type FormEvent, useState } from "react";
import type { BoneRecord, DinosaurSpecies } from "../data/types";
import { isResearchComingSoon, isVercelHostedResearchUI } from "../config";
import { useAgentAsk } from "../hooks/useAgentAsk";
import { PROJECT } from "../project";

interface Props {
  open: boolean;
  onClose: () => void;
  species: DinosaurSpecies;
  bone: BoneRecord | null;
}

/** One paragraph for public Vercel modal: species overview plus bone detail when selected (no extra column / second disclaimer block). */
function vercelHostedContextBody(species: DinosaurSpecies, bone: BoneRecord | null): string {
  if (bone == null) return species.notes;
  const chunks = [
    species.notes,
    `Selected element: ${bone.label} (${bone.scientificName}).`,
    bone.plainLanguageDescription ?? bone.description,
    bone.osteology,
    bone.researchNotes,
  ];
  return chunks.filter((s) => typeof s === "string" && s.trim()).join(" ");
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
    const contextBody = vercelHostedContextBody(species, bone);

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
            <button type="button" className="btn-close pixel-corners" onClick={onClose} aria-label="Close research console">
              ✕
            </button>
          </header>

          <div className="research-vercel__body-block">
            <div className="research-vercel__context pixel-corners">
              <span className="tag">Context</span>
              <h3 className="research-vercel__accent">Dinosaur profile</h3>
              <p className="research-vercel__profile-name">{species.binomial}</p>
              <p className="research-vercel__body">{contextBody}</p>
            </div>
            <form
              className="research-form research-form--vercel-hosted"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Research question (disabled on public host)"
            >
              <label htmlFor="q-vercel-hosted">Research question (college level, beginner-friendly)</label>
              <textarea
                id="q-vercel-hosted"
                className="research-input pixel-corners research-input--readonly"
                rows={5}
                readOnly
                tabIndex={0}
                placeholder="e.g. What does the femur shape in this species tell us about speed, body weight, and growth as it aged?"
                aria-describedby="q-vercel-hosted-desc"
              />
              <p id="q-vercel-hosted-desc" className="research-input__desc">Research questions are coming soon on the public host.</p>
              <div className="research-actions">
                <button type="button" className="btn-submit btn-submit--vercel-soon pixel-corners" disabled aria-label="Submit research question (disabled)">
                  down for now, up soon!
                </button>
              </div>
            </form>
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
            <button type="button" className="btn-close pixel-corners" onClick={onClose} aria-label="Close research console">
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
          <div className="research-coming-soon research-coming-soon--text-only">
            <img
              src="/research-mascot.png"
              alt="Friendly research mascot"
              className="research-coming-soon__mascot"
            />
            <p className="research-coming-soon__msg">
              The research console will be up and running soon! Our expert-powered Q&amp;A system is being prepared to help you explore the science behind these amazing dinosaurs.
            </p>
            <p className="research-coming-soon__subtext">
              In the meantime, explore the fossils and learn more about {species.binomial}.
            </p>
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
          <button type="button" className="btn-close pixel-corners" onClick={onClose} aria-label="Close research console">
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
        <form className="research-form" onSubmit={handleSubmit} aria-label="Submit research question">
          <label htmlFor="q">Research question (college level, beginner-friendly)</label>
          <textarea
            id="q"
            className="research-input pixel-corners"
            rows={5}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What does the femur shape in this species tell us about speed, body weight, and growth as it aged?"
            aria-describedby="q-help"
            disabled={!hasApi}
          />
          {!hasApi && (
            <p id="q-help" className="research-input__help">
              Research service is not available. Please check your configuration.
            </p>
          )}
          <div className="research-actions">
            <button
              type="submit"
              className="btn-submit pixel-corners"
              disabled={loading || !hasApi || !question.trim()}
              aria-label={loading ? "Invoking model, please wait" : "Submit question to Bedrock agent"}
            >
              {loading ? "Invoking model…" : "Submit to Bedrock agent"}
            </button>
          </div>
        </form>
        {error ? (
          <section className="research-error" role="alert" aria-labelledby="error-title">
            <h3 id="error-title" className="research-error__title">Error</h3>
            <p className="research-error__msg">{error}</p>
          </section>
        ) : null}
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
