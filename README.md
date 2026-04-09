# DINOLAB

**Live progress dashboard for multi-agent AI project generation** — watch your project build in real-time as autonomous agents coordinate across parallel tasks.

DINOLAB is the web UI + orchestration layer for [OnePromptAI](https://github.com/YOUR_USERNAME/OnePromptAI), a scaled-down, hackathon-friendly multi-agent orchestrator that runs on a single machine using free-tier APIs.

## What It Does

Given a project specification, DINOLAB:

1. **Plans** — A planner agent decomposes the project into granular, parallelizable tasks
2. **Dispatches** — Tasks are assigned to isolated worker agents running on separate git branches
3. **Executes** — Workers generate complete code, commit to their branches, and produce handoff reports
4. **Merges** — A serial merge queue integrates worker branches into main, detecting conflicts
5. **Reconciles** — A reconciler agent monitors build health and spawns targeted fix tasks
6. **Visualizes** — A **live web dashboard** shows real-time progress, agent activity, and git history

## Quick Start: 3 Steps

### Step 1: Install Dependencies

```bash
# Navigate to the web directory
cd dinolab/web/

# Install Node.js dependencies and run dev server
npm install && npm run dev
```

The dev server starts on `http://localhost:5173` by default. **The live progress dashboard appears immediately on build start** — no waiting, no manual refresh.

### Step 2: Start the Orchestrator (Python)

In a separate terminal, from the repository root:

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys (see Setup Guide below)

# Run the orchestrator with dashboard
python main.py --dashboard "Build a REST API with user authentication"
```

The orchestrator connects to the web dashboard and streams real-time updates. You'll see:
- **Tasks** being planned and dispatched
- **Workers** executing in parallel
- **Merge queue** integrating branches
- **Build health** monitored by the reconciler
- **Git commits** flowing into the target repository

### Step 3 (Optional): Generate History Movie

Once your project is built and committed to GitHub, generate a Gource visualization:

```bash
# From the repository root
bash scripts/gource-dinolab.sh
```

This creates a `.mp4` movie of your project's git history, showing commits flowing across branches and merging into main. Perfect for demos.

---

## Setup Guide

### Prerequisites
- **Python 3.11+**
- **Git**
- **Node.js 18+** (for the web UI)
- **Gource** (optional, for history movie): `brew install gource` or `apt-get install gource`

### Required Accounts & API Keys

Configure the **LLM** with `LLM_PROVIDER` in `.env` (see `.env.example`: **bedrock** and **gemini** are documented; **ollama** for local models).

#### 1. Google Gemini API (FREE)
- Go to [Google AI Studio](https://aistudio.google.com/apikey)
- Click "Create API Key"
- Set `GEMINI_API_KEY` in your `.env`
- Free tier: 15 RPM, 1M tokens/day (sufficient for our scale)

#### 1b. AWS Bedrock (if `LLM_PROVIDER=bedrock`)
- IAM user or role with `bedrock:InvokeModel`; set `AWS_REGION`, `BEDROCK_MODEL_ID`, and credentials (or use `~/.aws/credentials`).
- See comments in `.env.example` for model IDs and access notes.

#### 2. GitHub Personal Access Token
- Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
- Create a Fine-grained token with repo read/write permissions
- Set `GIT_TOKEN` in your `.env`

#### 3. Target Repository
- Create a new empty GitHub repo for the project to be built
- Set `GIT_REPO_URL` in your `.env`

#### 4. Persistence (pick one in `.env`)
- **DynamoDB (default):** Set `DB_BACKEND=dynamodb` with AWS credentials / IAM; tables are created on first connect.
- **MongoDB:** Set `DB_BACKEND=mongodb` and `MONGODB_URI` (local or [Atlas](https://www.mongodb.com/cloud/atlas)).
- **In-memory:** Set `DB_BACKEND=memory` for a quick try (no cross-run persistence).

### Optional: Local Ask Server (for interactive agent feedback)

If you want agents to ask clarifying questions during execution, run the optional ask server:

```bash
# In a third terminal
python -m oneprompt.ask_server
```

This allows workers to pause and request input from you (e.g., "Should I use TypeScript or JavaScript?"). Without it, agents proceed with defaults. See `oneprompt/ask_server.py` for configuration.

---

## Architecture

```
User Prompt / SPEC.md
        │
        ▼
   ┌─────────┐
   │ Planner  │ ── Gemini API ── decomposes into tasks
   └────┬─────┘
        │
   ┌────▼──────┐
   │ Subplanner│ ── further breaks down large tasks
   └────┬──────┘
        │
   ┌────▼──────────────────────────┐
   │ Worker Pool (3-5 parallel)    │
   │  ┌────────┐ ┌────────┐       │
   │  │Worker 1│ │Worker 2│ ...   │ ── each on isolated git branch
   │  └───┬────┘ └───┬────┘       │
   └──────┼──────────┼────────────┘
          │          │
   ┌──────▼──────────▼────┐
   │    Merge Queue        │ ── serial merge into main
   └──────────┬────────────┘
              │
   ┌──────────▼────────────┐
   │    Reconciler          │ ── checks build health, emits fixes
   └──────────┬────────────┘
              │
   ┌──────────▼────────────┐
   │  DINOLAB Web Dashboard │ ── live progress, agent activity, git history
   └───────────────────────┘
```

## Tech Stack

| Component | Tool | Purpose |
|-----------|------|------|
| LLM | **AWS Bedrock**, **Google Gemini**, or **Ollama** (`LLM_PROVIDER` in `.env`) | Planning, code generation, reconciliation |
| Orchestrator | **Python + asyncio** | Coordinates all agents and queues |
| State Storage | **DynamoDB** (default), **MongoDB**, or **in-memory** (`DB_BACKEND`) | Tasks, events, run metrics |
| Version Control | **Git + GitHub** | Branch isolation, merge queue, CI/CD |
| Sandboxing | **Local git worktrees** | Isolated workspace per worker |
| Web Dashboard | **Vite + React** | Real-time progress, agent activity, git log |
| Terminal Dashboard | **Rich** (Python) | Alternative terminal monitoring UI |
| CLI | **Click** | Command-line interface |

## Configuration

All configuration is via `.env`. See `.env.example` for all options.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------||
| `LLM_PROVIDER` | No | `gemini` in code; see `.env.example` | `bedrock`, `gemini`, or `ollama` |
| `GEMINI_API_KEY` | If `LLM_PROVIDER=gemini` | — | Google AI Studio API key |
| `GIT_REPO_URL` | Yes | — | Target repository URL |
| `GIT_TOKEN` | Yes | — | GitHub PAT with push access |
| `MAX_WORKERS` | No | `8` in code | Parallel workers (3–5 typical on a laptop) |
| `DB_BACKEND` | No | `dynamodb` | `dynamodb`, `mongodb`, or `memory` |
| `MONGODB_URI` | If `DB_BACKEND=mongodb` | — | MongoDB connection string |
| `DASHBOARD_URL` | No | `http://localhost:5173` | Web dashboard URL for agent updates |

## Decision Point: Do You Want to Publish Live?

Once your project is built and tested locally:

### Option A: Deploy to Vercel (Recommended for Web UIs)
If your project includes a web UI (React, Next.js, etc.):

1. Push your target repo to GitHub
2. Go to [Vercel](https://vercel.com) and import the repository
3. Set **Root Directory** to `dinolab/web/` if using DINOLAB UI
4. Deploy — Vercel auto-builds on every push

**Troubleshooting:** If Vercel cancels with "unverified commit", see the **Vercel Deployment** section below.

### Option B: Deploy Backend API
If your project is a REST API or service:

1. Push to GitHub
2. Deploy to your preferred platform:
   - **AWS Lambda** + API Gateway
   - **Render**, **Railway**, **Fly.io** (simple git-to-deploy)
   - **Docker** + your own server

### Option C: Keep Local
Run the orchestrator + dashboard locally for development. Useful for:
- Iterating on agent behavior
- Testing without deploying
- Demos and hackathons

---

## Generating a Gource History Movie

Gource visualizes your project's git history as a beautiful, flowing tree of commits.

### Prerequisites
```bash
# macOS
brew install gource

# Ubuntu/Debian
sudo apt-get install gource

# Or download: https://gource.io/
```

### Generate the Movie

```bash
# From the DINOLAB repository root
bash scripts/gource-dinolab.sh
```

This script:
1. Clones or updates your target repository (from `GIT_REPO_URL` in `.env`)
2. Runs Gource to generate a `.mp4` file
3. Saves it to `gource-output.mp4`

The movie shows:
- **Branches** as separate streams
- **Commits** flowing from workers into main
- **File changes** as they accumulate
- **Merge events** as branches integrate

Perfect for:
- Demos at hackathons or conferences
- Showcasing parallel agent work
- Understanding project evolution at a glance

### Customizing Gource Output

Edit `scripts/gource-dinolab.sh` to adjust:
- Resolution (`--width`, `--height`)
- Duration (`--stop-at-end`, `--seconds-per-day`)
- Output format (`--output-ppm-stream`)

See [Gource documentation](https://gource.io/) for all options.

---

## Project Structure

```
DINOLAB/
├── README.md                   # This file
├── main.py                     # CLI entry point
├── dashboard.py                # Rich terminal dashboard
├── oneprompt/
│   ├── config.py               # Environment configuration
│   ├── types.py                # Shared data models
│   ├── llm_client.py           # Gemini API wrapper
│   ├── orchestrator.py         # Main coordination loop
│   ├── planner.py              # Task decomposition
│   ├── worker.py               # Code generation agent
│   ├── reconciler.py           # Build health monitor
│   ├── task_queue.py           # Priority task queue
│   ├── merge_queue.py          # Git merge queue
│   ├── git_utils.py            # Git operations
│   ├── vault.py                # Optional knowledge vault + run summaries
│   ├── sandbox.py              # Local worktree isolation
│   ├── ask_server.py           # Optional interactive ask server
│   └── db.py                   # MongoDB persistence
├── prompts/
│   ├── planner.md              # Planner system prompt
│   ├── subplanner.md           # Subplanner system prompt
│   ├── worker.md               # Worker system prompt
│   └── reconciler.md           # Reconciler system prompt
├── dinolab/
│   ├── README.md               # DINOLAB web UI documentation
│   ├── web/                    # Vite + React web dashboard
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── sam/                    # AWS SAM infrastructure (optional)
├── templates/                  # Optional prompt overlays (see templates/README.md)
├── examples/
│   └── example/
│       ├── SPEC.md             # Example project specification
│       ├── AGENTS.md           # Agent coordination rules
│       ├── ENTRY_POINT.md      # Project entry point docs
│       ├── DECISIONS.md        # Architecture decisions
│       └── RUNBOOK.md          # Operational runbook
├── scripts/
│   └── gource-dinolab.sh       # Gource helper for target-repo history
├── requirements.txt
├── pyproject.toml
└── .env.example
```

## Troubleshooting

### Dashboard shows **0 agents** for many minutes (FEATURES `0/1`, timer ticking)

Workers only start **after** (1) smart phase selection, (2) **planner** LLM, (3) **subplanner** calls for large tasks, (4) optional **architect** LLM. That can take **several minutes** on a big spec or a **large target-repo file tree**. Check the **Activity** log for `LLM · planner` / `Planner returned N top-level task(s)`.

- Set **`MAX_FILE_TREE_LINES=400`** (or lower) in `.env` if the target repo is a monorepo.
- Use an **empty or small** target repo for demos, or `python main.py --reset` before re-running.
- Increase **`SUBPLANNER_MAX_PARALLEL`** (e.g. `6`) to speed the pre-worker phase.

### "Run complete" but no agents / `none scheduled (planner returned no tasks)`

The run still spends time on **clone, smart-phase selection, and planner LLM calls** — it is not instant. If the **planner** returns an empty task list, workers never start (often when the **target repo file tree** already matches the spec and the model chooses `"tasks": []`). The orchestrator **retries planning once** with a stronger nudge; if it still fails:

- `python main.py --reset` then re-run, or use an **empty** target GitHub repo.
- Run with `LOG_LEVEL=debug` to see planner logs.
- Optional: lower `VAULT_MAX_CONTEXT_CHARS` if vault context overwhelms the model.

Missing files under `prompts/*.md` (e.g. `architect.md`) log warnings; phases that need them are **skipped** until you add those prompts.

### Web Dashboard Not Connecting

If the web UI shows "Waiting for orchestrator...":

1. Check that `npm run dev` is running on `http://localhost:5173`
2. Check that `python main.py --dashboard ...` is running and has `DASHBOARD_URL=http://localhost:5173` in `.env`
3. Check browser console for CORS or connection errors
4. Verify the orchestrator is writing updates to the dashboard (check terminal output)

### Gource Movie Generation Fails

If `scripts/gource-dinolab.sh` fails:

1. Verify Gource is installed: `gource --version`
2. Check that `GIT_REPO_URL` in `.env` is valid and accessible
3. Verify git history exists: `cd target-repo && git log --oneline | head -20`
4. Try manually: `gource /path/to/target-repo --output-ppm-stream | ffmpeg -y -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset ultrafast -pix_fmt yuv420p output.mp4`

### Vercel: "Deployment was canceled … unverified commit"

Vercel will not build commits whose **author email** GitHub does not treat as yours (unverified or not added). See [Vercel: troubleshoot collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration) and [GitHub: verifying your email](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/verifying-your-email-address).

1. On GitHub: **Settings → Emails** — add the address you use in Git (e.g. university or `noreply`) and complete **verification**.
2. Locally: `git config user.name "Your Name"` and `git config user.email "same-as-github-verified@example.com"`.
3. **Vercel:** [Account → Settings → Authentication](https://vercel.com/account/settings/authentication) — connect **GitHub**. Under [Email](https://vercel.com/account/settings#email), add/verify any extra addresses you commit with.
4. Create a **new commit** with the corrected author (empty commit is enough), push to `main`, or run `git commit --amend --reset-author --no-edit` on the latest commit and **force-push** if you are the only one on the branch.

On the GitHub commit page, your avatar should appear on the commit; if it shows as "unverified" or generic, Vercel may still cancel until the email matches a verified GitHub email.

**Do not `git push` from `target-repo/`** to fix Vercel: that directory is a **separate clone** used for agent output. Amending commits there and using `git push --force-with-lease` without `git fetch` yields **stale info**, and a forced push could **wipe `main`** on GitHub. Sync it with `git fetch origin && git reset --hard origin/main`, and always push from your **primary** repo root (DINOLAB checkout).

---

## Next Steps

1. **Try a demo:** `npm install && npm run dev` in `dinolab/web/`, then `python main.py --dashboard "Build a todo app"`
2. **Read the docs:** See `dinolab/README.md` for web UI details, `templates/README.md` for prompt customization
3. **Deploy:** Follow the **Decision Point** section above to publish your first project
4. **Generate a movie:** Use `scripts/gource-dinolab.sh` to visualize your project's git history

---

## License

MIT

## Also in this repository

- **dinolab/web/** — Vite + React DINOLAB UI. For Vercel, set the project **Root Directory** to `dinolab/web`.
- **oneprompt/** — Python multi-agent orchestrator (swarm).
- **templates/** — optional prompt overlays for `main.py` / `TEMPLATE` env (see `templates/README.md`).
