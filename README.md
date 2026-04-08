# OnePromptAI

**Autonomous multi-agent coding orchestrator** — build entire projects from a single prompt using a coordinated swarm of AI agents.

Inspired by [Longshot](https://github.com/Blastgits/longshot), OnePromptAI is a scaled-down, hackathon-friendly implementation that runs on a single machine using free-tier APIs.

## What It Does

Given a project specification, OnePromptAI:

1. **Plans** — A planner agent decomposes the project into granular, parallelizable tasks
2. **Dispatches** — Tasks are assigned to isolated worker agents running on separate git branches
3. **Executes** — Workers generate complete code, commit to their branches, and produce handoff reports
4. **Merges** — A serial merge queue integrates worker branches into main, detecting conflicts
5. **Reconciles** — A reconciler agent monitors build health and spawns targeted fix tasks
6. **Visualizes** — A Rich-powered terminal dashboard shows real-time progress

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
   └───────────────────────┘
```

## Tech Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| LLM | **Google Gemini API** (free tier) | Planning, code generation, reconciliation |
| Orchestrator | **Python + asyncio** | Coordinates all agents and queues |
| State Storage | **MongoDB** | Persists tasks, events, and run metrics |
| Version Control | **Git + GitHub** | Branch isolation, merge queue, CI/CD |
| Sandboxing | **Local git worktrees** | Isolated workspace per worker |
| Dashboard | **Rich** (Python) | Real-time terminal monitoring UI |
| CLI | **Click** | Command-line interface |

## Quick Start

```bash
# 1. Clone this repo
git clone https://github.com/YOUR_USERNAME/OnePromptAI.git
cd OnePromptAI

# 2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your API keys (see Setup Guide below)

# 5. Run
python main.py "Build a REST API with user authentication"

# With dashboard
python main.py --dashboard "Build a todo app"

# With a SPEC.md file
python main.py --spec examples/example/SPEC.md "Build the project"
```

## Setup Guide

### Prerequisites
- Python 3.11+
- Git
- Node.js 18+ (for target projects that use Node)

### Required Accounts & API Keys

#### 1. Google Gemini API (FREE)
- Go to [Google AI Studio](https://aistudio.google.com/apikey)
- Click "Create API Key"
- Set `GEMINI_API_KEY` in your `.env`
- Free tier: 15 RPM, 1M tokens/day (sufficient for our scale)

#### 2. GitHub Personal Access Token
- Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
- Create a Fine-grained token with repo read/write permissions
- Set `GIT_TOKEN` in your `.env`

#### 3. Target Repository
- Create a new empty GitHub repo for the project to be built
- Set `GIT_REPO_URL` in your `.env`

#### 4. MongoDB (Optional but recommended)
- **Local:** Install via `brew install mongodb-community` and run `mongod`
- **Cloud (Free):** Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier
- Set `MONGODB_URI` in your `.env`
- The system works without MongoDB (in-memory only), but you lose persistence

### Optional: AWS Sandbox
If you have AWS Sandbox access from the hackathon, you can run workers on EC2 instances instead of locally. This is optional — local execution works fine for 3-5 workers on a MacBook Air M4.

## Configuration

All configuration is via `.env`. See `.env.example` for all options.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `GIT_REPO_URL` | Yes | — | Target repository URL |
| `GIT_TOKEN` | Yes | — | GitHub PAT with push access |
| `MAX_WORKERS` | No | `3` | Parallel workers (3-5 for laptop) |
| `MONGODB_URI` | No | `mongodb://localhost:27017` | MongoDB connection |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Model to use |

## How It Compares to Longshot

| Feature | Longshot | OnePromptAI |
|---------|----------|-------------|
| LLMs | GPT 5.2 + GLM 5.0 | Gemini 2.0 Flash (free) |
| Sandboxing | Modal (serverless GPU) | Local git worktrees |
| Max workers | 50+ | 3-5 |
| Language | TypeScript + Python | Pure Python |
| State | Git-only | MongoDB + Git |
| Dashboard | Rich terminal | Rich terminal |
| MCP Server | Poke | Not needed |
| Cost per run | ~$0.43+ (Modal credits) | Free (Gemini free tier) |
| Scale | 100k+ LOC, 5k+ commits | Smaller projects, 50-200 commits |

## Project Structure

```
OnePromptAI/
├── main.py                 # CLI entry point
├── dashboard.py            # Rich terminal dashboard
├── oneprompt/
│   ├── config.py           # Environment configuration
│   ├── types.py            # Shared data models
│   ├── llm_client.py       # Gemini API wrapper
│   ├── orchestrator.py     # Main coordination loop
│   ├── planner.py          # Task decomposition
│   ├── worker.py           # Code generation agent
│   ├── reconciler.py       # Build health monitor
│   ├── task_queue.py       # Priority task queue
│   ├── merge_queue.py      # Git merge queue
│   ├── git_utils.py        # Git operations
│   ├── sandbox.py          # Local worktree isolation
│   └── db.py               # MongoDB persistence
├── prompts/
│   ├── planner.md          # Planner system prompt
│   ├── subplanner.md       # Subplanner system prompt
│   ├── worker.md           # Worker system prompt
│   └── reconciler.md       # Reconciler system prompt
├── dinolab/                # DINOLAB web UI + SAM infra (see dinolab/README.md)
├── templates/              # Optional prompt overlays (see templates/README.md)
├── examples/
│   └── example/
│       ├── SPEC.md         # Example project specification
│       ├── AGENTS.md       # Agent coordination rules
│       ├── ENTRY_POINT.md  # Project entry point docs
│       ├── DECISIONS.md    # Architecture decisions
│       └── RUNBOOK.md      # Operational runbook
├── scripts/
│   └── gource-dinolab.sh   # Gource helper for target-repo history
├── requirements.txt
├── pyproject.toml
└── .env.example
```

## License

MIT

## Also in this repository

- **dinolab/web/** — Vite + React DINOLAB UI. For Vercel, set the project **Root Directory** to `dinolab/web`.
- **oneprompt/** — Python multi-agent orchestrator (swarm).
- **templates/** — optional prompt overlays for `main.py` / `TEMPLATE` env (see `templates/README.md`).

### Vercel: “Deployment was canceled … unverified commit”

Vercel will not build commits whose **author email** GitHub does not treat as yours (unverified or not added). See [Vercel: troubleshoot collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration) and [GitHub: verifying your email](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/verifying-your-email-address).

1. On GitHub: **Settings → Emails** — add the address you use in Git (e.g. university or `noreply`) and complete **verification**.
2. Locally: `git config user.name "Your Name"` and `git config user.email "same-as-github-verified@example.com"`.
3. **Vercel:** [Account → Settings → Authentication](https://vercel.com/account/settings/authentication) — connect **GitHub**. Under [Email](https://vercel.com/account/settings#email), add/verify any extra addresses you commit with.
4. Create a **new commit** with the corrected author (empty commit is enough), push to `main`, or run `git commit --amend --reset-author --no-edit` on the latest commit and **force-push** if you are the only one on the branch.

On the GitHub commit page, your avatar should appear on the commit; if it shows as “unverified” or generic, Vercel may still cancel until the email matches a verified GitHub email.

**Do not `git push` from `target-repo/`** to fix Vercel: that directory is a **separate clone** used for agent output. Amending commits there and using `git push --force-with-lease` without `git fetch` yields **stale info**, and a forced push could **wipe `main`** on GitHub. Sync it with `git fetch origin && git reset --hard origin/main`, and always push from your **primary** repo root (`OnePromptAI` / `OnePromptAISubAgents` checkout).
