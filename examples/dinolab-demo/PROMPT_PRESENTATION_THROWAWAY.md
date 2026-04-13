# Throwaway presentation run (safe / isolated)

Use for a **live demo** when you want the swarm to **do visible work** without risking core app or orchestrator code.

For a **busy dashboard** with **many parallel workers** and **32 micro-tasks**, use **`PROMPT_PRESENTATION_SWARM.md`** instead (raise `MAX_WORKERS` in `.env`).

```bash
cd /path/to/OnePromptAI
source .venv/bin/activate
python main.py --dashboard --spec examples/dinolab-demo/PROMPT_PRESENTATION_THROWAWAY.md "Presentation demo"
```

Point `TARGET_REPO_PATH` at a **disposable clone** (recommended) or a branch you can delete after the talk. This spec **only** allows new files under one folder.

---

## Hard constraints (non-negotiable)

1. **Create or update files only** under `docs/presentation-demo/` in the target repository. **No other paths.**
2. **Do not** delete, rename, or modify existing source code, configs, CI workflows, lockfiles, or `package.json`.
3. **Do not** change anything under `oneprompt/` in the OnePromptAI repo (this spec applies to **worker output in the target repo** only).
4. If `docs/presentation-demo/` does not exist, create it. Maximum **three** markdown files total in that directory.

## Task content

- Add `docs/presentation-demo/README.md` with: title **“DINOLAB presentation scratch”**, today’s date, and three bullets: what DINOLAB is (one sentence), who it is for, and that this folder is throwaway demo output.
- Optionally add `docs/presentation-demo/agents-note.md` with a short fictional “agent handoff” paragraph (plain text, no code execution).

That is the entire product scope for this run.
