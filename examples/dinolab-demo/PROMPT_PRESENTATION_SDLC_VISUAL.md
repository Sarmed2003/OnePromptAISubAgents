# Presentation: see **all SDLC roles** in the terminal dashboard

## Why you mostly saw **Engineer**

1. **Every normal queue task** (`task-001`, `task-002`, …) is labeled **Engineer** on purpose. The dashboard maps worker rows with `oneprompt/run_roles.py` — only special ids (e.g. `consolidation-*`, `fix-*`, `*-sub-*`) get other worker labels.
2. **Planner**, **SubPlanner**, **Architect**, **Reviewer**, **QA Tester**, **Security**, **DevOps**, **Integrator**, **Bundler**, and **Sandbox** are **separate phases** — they show as their own rows **after** planning and (for most of them) **after** the big **merge** wave finishes.
3. **32-task swarm + `STRICT_SDLC=false`** (recommended in that spec for speed) turns **smart phase selection** on. The LLM then **disables** Review / QA / Security / DevOps for “only markdown under `docs/`” work — so you mostly see **Planner + many Engineers**, not the later roles.
4. With **32 tasks**, post-merge phases start **very late**; easy to stop watching before **Architect** (runs before workers) vs **Reviewer** (after merges) etc.

## Roles the dashboard knows about

| Role key        | Label shown (typical)        | When it appears |
|----------------|------------------------------|-----------------|
| `planner`      | Planner                      | Root plan |
| `subplanner`   | SubPlanner                   | Task decomposition (if triggered) |
| `engineer`     | Engineer                     | Default for implementation workers |
| `architect`    | Architect                    | After plan, before workers run |
| `reviewer`     | Reviewer                     | After merges (on `main`) |
| `qa_tester`    | QA Tester                    | After review (tests generation) |
| `sandbox`      | Sandbox                      | Build/test execution phase |
| `security`     | Security                     | Security audit phase |
| `reconciler`   | Reconciler                   | Finalization sweeps / fix tasks (ids like `fix-*`) |
| `integrator`   | Integrator (consolidation)   | Cross-file integration pass |
| `bundler`      | Bundler                      | Single-file bundle pass (when applicable) |
| `devops`       | DevOps                       | CI/deploy artifacts phase |

(`Worker` is a fallback style if a role string is unknown.)

## Environment (so **all** phases can run)

In `.env` for the talk:

```bash
STRICT_SDLC=true
ARCHITECT_ENABLED=true
REVIEW_ENABLED=true
QA_ENABLED=true
SECURITY_ENABLED=true
DEVOPS_ENABLED=true
```

With **`STRICT_SDLC=true`**, smart phase skipping is **off** — you do **not** rely on the LLM to turn phases off for “small” specs.

## Commands to run (pick one)

**A — Full DINOLAB spec** (greenfield / empty target — asks for web app, CI, tests, infra → all lanes light up):

```bash
cd /Users/sarmedmahmood/OnePromptAI
source .venv/bin/activate
python main.py --reset
python main.py --dashboard --gource --spec examples/dinolab-demo/PROMPT.md "Build the project"
```

**B — Target repo already has `dinolab/`** (incremental tasks so the planner does not return empty):

```bash
cd /Users/sarmedmahmood/OnePromptAI
source .venv/bin/activate
python main.py --reset
python main.py --dashboard --gource --spec examples/dinolab-demo/PROMPT_SAME_REPO.md "Build the project"
```

**C — Many parallel workers** (busy Engineer column; **do not** set `STRICT_SDLC=false` if you need Review/QA/Security/DevOps in the same run):

```bash
python main.py --dashboard --gource --max-workers 12 --spec examples/dinolab-demo/PROMPT_PRESENTATION_SWARM.md "Presentation swarm demo"
```

For (C), expect a **long** run before post-merge roles appear unless you lower task count.

---

Keep **`--gource`** if you want distinct git author names for the history visualization afterward.
