import { type FormEvent, useState } from "react";
import type { BoneRecord, DinosaurSpecies } from "../data/types";
import { isResearchComingSoon } from "../config";
import { useAgentAsk } from "../hooks/useAgentAsk";
import mascotUrl from "../assets/research-mascot.png";

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
              src={mascotUrl}
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
          <section className="research-answer pixel-corners">
            <h3>Synthesis</h3>
            <pre className="research-answer__text">{answer}</pre>
          </section>
        ) : null}
      </div>
    </div>
  );
}
