# Presentation swarm (many parallel workers, dashboard + Gource)

Safe, throwaway output: **only** `docs/presentation-demo/swarm/`. Tuned so the root planner emits **many** top-level tasks and workers run **in parallel** (raise `MAX_WORKERS` in `.env` for your machine).

## Suggested environment (copy into `.env` for the talk)

```bash
# More lanes on the dashboard at once (adjust to your CPU/RAM)
MAX_WORKERS=12
SUBPLANNER_MAX_PARALLEL=8
# Headroom if the model emits extra rows before the cap trims
MAX_PLANNER_TASKS=64
# Faster task completion = more rows sliding to “done” (optional)
# STRICT_SDLC=false
```

## Run

```bash
cd /Users/sarmedmahmood/OnePromptAI
source .venv/bin/activate
python main.py --dashboard --gource --max-workers 12 --spec examples/dinolab-demo/PROMPT_PRESENTATION_SWARM.md "Presentation swarm demo"
```

(Omit `--max-workers` if you prefer only `.env`; `--gource` labels commits for Gource.)

---

## MANDATORY PLANNING RULE — SWARM MODE (non-negotiable)

This run is a **live UI demo**. The root planner **MUST** output **exactly 32** tasks in JSON, with ids **`task-001` through `task-032`** in order.

### Why these shapes matter (do not skip)

1. **Exactly one path per `scope` array** — e.g. `["docs/presentation-demo/swarm/t07.md"]`. Never two paths in one task. That avoids merge conflicts and keeps the **subplanner from splitting** tasks into more LLM rounds.
2. **`priority` must be 5, 6, or 7 for every task** — never 1–3 (low priority triggers extra decomposition) and avoid priority 4 if possible.
3. **Each `description` must be under 180 characters** — short tasks avoid subplanner “large task” heuristics.
4. **Scopes must not overlap** — file `docs/presentation-demo/swarm/tNN.md` appears in **only one** task.

### Per-task file content

Each worker creates **one** markdown file `docs/presentation-demo/swarm/tNN.md` (NN = 01–32) containing:

- An `#` heading: `Swarm lane NN`
- One sentence: fictional one-line “agent note” for that lane (DINOLAB / museum-lab theme is fine).
- Optional: a bullet with the task id (e.g. `task-014`).

### Hard repository constraints

1. **Create or replace files only** under `docs/presentation-demo/swarm/`.
2. **Do not** modify application source, `package.json`, CI, lockfiles, or anything outside that folder.
3. **Do not** delete unrelated files.

### Acceptance criteria (repeat per task)

Each task’s `acceptance` field should say the file exists, is valid UTF-8 markdown, contains the heading `Swarm lane NN`, and includes at least one full sentence.

---

That is the full product scope: **32 parallel micro-documents** for dashboard and Gource visuals only.
