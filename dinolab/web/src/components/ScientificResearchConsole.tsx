import { type FormEvent, useState } from "react";
import type { BoneRecord, DinosaurSpecies } from "../data/types";
import { isResearchComingSoon, isVercelHostedResearchUI } from "../config";
import { useAgentAsk } from "../hooks/useAgentAsk";
import { PROJECT } from "../project";
import { ComingSoonResearch } from "./ComingSoonResearch";

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

  // Show ComingSoonResearch when service is unavailable
  if ((comingSoon && vercelHostedUi) || !hasApi) {
    return (
      <ComingSoonResearch
        species={species}
        bone={bone}
        onClose={onClose}
        vercelHostedUi={vercelHostedUi && comingSoon}
      />
    );
  }

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
