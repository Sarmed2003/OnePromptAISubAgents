# OnePromptAI

**Multi-agent coding swarm** — turn a single prompt into a planned set of parallel tasks, each executed on its own git branch, merged through a queue, and (optionally) reviewed through SDLC-style phases. A **Rich terminal dashboard** shows sub-agents (planner, workers, reviewer, etc.), merge health, and task progress in real time.

**DINOLAB** in this repo is a **reference project** the swarm can build or extend (Vite + React UI + optional AWS SAM backend). The core product is the **orchestrator + dashboard + worker pool**, not only DINOLAB.

---

## Plain-language: what happens

1. You describe what you want built (prompt or SPEC file).
2. A **planner** breaks that into a list of tasks that can run without stepping on the same files.
3. **Subplanners** sometimes expand big tasks into smaller ones.
4. Optional phases (architect, reviewer, QA, security, DevOps, etc.) add structure when enabled.
5. Several **workers** run **at the same time** (up to your `MAX_WORKERS` limit). Each worker is like a separate “agent” focused on one task, on its own branch.
6. A **merge queue** brings worker branches back into `main` one after another so conflicts are easier to control.
7. If something breaks (build, merge, health checks), the system can spawn **fix-up** tasks.
8. The **dashboard** lists who is running (by role), who finished, merge stats, and an activity log.

**Important:** A **task** is a unit of work (one chunk of the plan). A **worker** is the runtime that picks up tasks from the queue. You usually have **fewer concurrent workers than total tasks** — workers are recycled. Parallelism = up to `MAX_WORKERS` tasks **at the same time**, not “one AWS instance per task.”

---

## Technical: stack, flow, and value

| Layer | Technology | What it does | Value |
|--------|------------|--------------|--------|
| CLI | **Click** | Args, optional interactive dashboard prompt | Simple entrypoint; `python main.py --dashboard` can prompt after welcome |
| Orchestration | **Python 3.11+, asyncio** | Phases, worker pool, merge queue | Single-machine swarm without Kubernetes |
| LLM | **Bedrock / Gemini / Ollama** (`LLM_CLIENT`) | Planner, subplanner, workers, reconciler, SDLC phases | Pick cloud vs local; Bedrock fits AWS-centric teams |
| Persistence | **DynamoDB** (default), **MongoDB**, or **memory** | Tasks, events, run metrics | **DynamoDB** + **boto3**: durable state without running a DB server |
| Git | **GitPython**, remote **GitHub** | Clone target repo, branches, commits, merge | Isolation per worker via branches/worktrees |
| Isolation | **Git worktrees** (`sandbox.py`) | Separate working trees per worker | Avoids file clashes while coding |
| Dashboard | **Rich** (`dashboard.py`) | Live layout: metrics, in-progress agents, completed, merge bar | **Achieved** operator visibility without a separate web UI |
| Knowledge | **Markdown vault** (`vault.py`) | Optional context for planner/architect; Obsidian-friendly | **Utilizing** on-disk `.md` (and **stripped YAML frontmatter**) to steer the model without a vector DB |
| DINOLAB deploy | **AWS SAM**: **API Gateway**, **Lambda**, **S3**, **DynamoDB** (optional log) | Hosted research Q&A + static assets | **Swarm runtime does not require these** — they are for the DINOLAB web app + Bedrock HTTP API |

**AWS and the swarm only:** If `LLM_PROVIDER=bedrock`, the orchestrator calls **Amazon Bedrock** (`bedrock-runtime`, Converse). If `DB_BACKEND=dynamodb`, it uses **DynamoDB**. No **EC2** or **S3** are used by the core swarm process on your laptop.

---

## Run locally (swarm)

```bash
git clone https://github.com/YOUR_USERNAME/OnePromptAI.git
cd OnePromptAI
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: GIT_REPO_URL, GIT_TOKEN, LLM keys, TARGET_REPO_PATH, etc.

# Headless (NDJSON events on stdout)
python main.py "Your task description"

# Terminal dashboard + interactive prompt (welcome line, then type your task)
python main.py --dashboard

# Dashboard + prompt on the command line
python main.py --dashboard "Your task description"

# From a SPEC file
python main.py --spec path/to/SPEC.md "Build the project"

# Fresh clone of target repo next run
python main.py --reset
```

---

## DINOLAB research console (Bedrock Q&A in the browser)

Terminal 1 — local API (pick a free port if `8787` is busy):

```bash
cd dinolab/infra
BEDROCK_MODEL_ID=us.anthropic.claude-haiku-4-5-20251001-v1:0 BEDROCK_REGION=us-east-1 \
  python local_ask_server.py --host 127.0.0.1 --port 8787
```

Terminal 2 — web UI:

```bash
cd dinolab/web
# In .env: VITE_API_URL=http://127.0.0.1:8787  (must match the server port)
npm install
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173`). The research panel calls your API, which calls **Bedrock**.

---

## Bring your own repo / use case

1. **Fork or clone** OnePromptAI.
2. **Create an empty (or template) GitHub repo** for generated code; set `GIT_REPO_URL` and `GIT_TOKEN` in `.env`.
3. Set **`TARGET_REPO_PATH`** (local clone path, e.g. `./target-repo`).
4. Choose **`LLM_PROVIDER`** and keys (**Gemini**, **Bedrock**, or **Ollama**).
5. Choose **`DB_BACKEND`** (`memory` for a quick try without AWS; `dynamodb` for persistence).
6. Optionally add **`vault/`** markdown (or open the same folder in **Obsidian**) for planner/architect context — see `vault/OBSIDIAN.md`.
7. Run **`python main.py --dashboard`** and enter your prompt.

You do **not** have to use DINOLAB; point `GIT_REPO_URL` at any repo the swarm should clone and push to.

---

## Configuration (summary)

| Variable | Role |
|----------|------|
| `LLM_PROVIDER` | `bedrock` \| `gemini` \| `ollama` |
| `GIT_REPO_URL` / `GIT_TOKEN` | Target repository |
| `MAX_WORKERS` | Parallel workers (typical 3–5 on a laptop) |
| `DB_BACKEND` | `dynamodb` \| `mongodb` \| `memory` |
| `VAULT_PATH` | Optional knowledge markdown |
| `STRICT_SDLC` / phase `*_ENABLED` | Which phases run (affects dashboard “roles”) |

Full list: **`.env.example`**.

---

## FAQ

**Q (non-technical): Is each line on the dashboard a separate person?**  
**A:** No. They are **roles or workers** tracked by the app. Several “workers” may run one after another on different tasks; only up to `MAX_WORKERS` run at the same time.

**Q (non-technical): Why didn’t I see “Architect” or “Reviewer”?**  
**A:** Those steps only appear if those **phases are enabled** and the run **reaches** them. If smart phase selection skips them, or a flag turns them off, they won’t show. See `.env.example` (`ARCHITECT_ENABLED`, `STRICT_SDLC`, etc.).

**Q (non-technical): Where did my code go?**  
**A:** In the **local clone** at `TARGET_REPO_PATH`, and on **GitHub** at `GIT_REPO_URL` after pushes.

**Q (technical): DynamoDB vs memory?**  
**A:** Memory loses state when the process exits. DynamoDB keeps task/event history and supports restarts; requires AWS credentials and `boto3`.

**Q (technical): Why Bedrock for the swarm vs DINOLAB Lambda?**  
**A:** Same family of API (Converse): orchestrator can use Bedrock directly from your machine; DINOLAB’s deployed **Lambda** is a separate HTTP path for the browser research console.

**Q (technical): How does Obsidian tie in?**  
**A:** Edit `.md` under `VAULT_PATH`. The orchestrator **does not** call Obsidian; it reads files. `.obsidian/` is ignored. See `vault/OBSIDIAN.md`.

---

## Architecture (high level)

```
User prompt / SPEC.md
       │
       ▼
  Planner (LLM) ──► task list
       │
       ▼
  Subplanner(s) (optional, LLM) ──► refined tasks
       │
       ▼
  Optional SDLC phases (architect, review, QA, …) ──► LLM + git commits
       │
       ▼
  Worker pool (async, max N parallel) ──► branches, commits, handoffs
       │
       ▼
  Merge queue (serial) ──► main
       │
       ▼
  Reconciler / recovery tasks (as needed)
```

---

## Project layout

```
OnePromptAI/
├── main.py              # CLI (interactive --dashboard supported)
├── dashboard.py         # Rich AGENTSWARM-style UI
├── oneprompt/           # Orchestrator, LLM client, db, vault, merge/worker logic
├── prompts/             # System prompts for roles
├── dinolab/             # Example web app + SAM infra (optional)
├── examples/            # Sample SPEC / demo prompts
├── vault/               # Optional knowledge base (+ OBSIDIAN.md)
├── templates/           # Optional template packs
└── scripts/             # e.g. gource helper
```

---

## Troubleshooting (short)

- **Port in use** (DINOLAB API): `lsof -nP -iTCP:8787 -sTCP:LISTEN` then `kill <PID>`, or use `--port 8788` and match `VITE_API_URL`.
- **Planner returns 0 tasks:** often target repo already matches spec; try `--reset` or an empty repo; see logs / `MAX_FILE_TREE_LINES`.
- **Strict SDLC exit code 1:** failed tasks or phase errors; fix or set `STRICT_SDLC=false` for a looser run.

---

## Compare / inspiration

Inspired by [Longshot](https://github.com/Blastgits/longshot). OnePromptAI targets **smaller** projects and **local** worktrees, with **configurable** LLM and DB backends.

---

## License

MIT

---

## Also in this repository

- **`dinolab/web/`** — DINOLAB UI (Vite + React). Deploy details: `dinolab/README.md`.
- **Vercel “unverified commit”** — see previous troubleshooting in GitHub/Vercel docs; use a verified commit author email.
