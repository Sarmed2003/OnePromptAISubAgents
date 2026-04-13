# Obsidian + OnePromptAI knowledge vault

## How it works (no extra integration code)

1. Set **`VAULT_PATH`** in `.env` to the folder you open as an Obsidian vault (or a subfolder of it dedicated to agent context).
2. Write **Markdown** (`.md`) anywhere under that path **except**:
   - **`vault/.obsidian/`** — Obsidian app data (ignored by the orchestrator).
   - **`vault/runs/`** — auto-written run summaries (ignored so logs are not fed back as “knowledge”).
3. On each run, **`VaultReader.load_for_planner()`** concatenates eligible notes (up to **`VAULT_MAX_CONTEXT_CHARS`**) and **prepends** them to the planner prompt. The **architect** phase uses **`load_for_architect()`**, which lists **`vault/architecture/`** first, then other files ordered by folder priority.
4. **YAML frontmatter** at the top of a note (`---` … `---`) is **stripped** before sending text to the LLM, so Obsidian properties stay in your notes but do not waste context tokens.

## Folder priority (planner ingestion order)

Top-level directories are read in this order when building context: **`memory/`**, **`decisions/`**, **`patterns/`**, **`architecture/`**, **`errors/`**, then any other folders (alphabetically by path). Use this to keep durable “memory” and ADRs ahead of scratch notes.

## Benefits

- **Human-friendly editing** with backlinks, graph, and templates in Obsidian.
- **Git-friendly** markdown next to the repo (commit knowledge with the project).
- **Planner/architect conditioning** without a separate vector DB for small-to-medium vaults.

## AWS services used by this monorepo (reference)

| Service | Where | Purpose |
|--------|--------|--------|
| **Amazon Bedrock** | `oneprompt/llm_client.py`, `dinolab/infra/local_ask_server.py`, Lambda `ask` | LLM calls (Converse API) for orchestrator and DINOLAB research Q&A. |
| **Amazon DynamoDB** | `oneprompt/db.py` (default `DB_BACKEND`), SAM template, optional Lambda log | Task/event persistence for the swarm; optional query log for DINOLAB asks. |
| **AWS Lambda** | `dinolab/infra` (SAM) | HTTP handler for DINOLAB Bedrock API in production. |
| **API Gateway (HTTP)** | SAM template | Front door for the deployed ask endpoint. |
| **Amazon S3** | SAM template, `dinolab/README.md` | Asset bucket for static SPA / future GLTF packs; **`aws s3 sync`** for deploy. Not used by the core Python orchestrator on your laptop. |
| **Bedrock control plane** | `oneprompt/bedrock_tools.py` | `list_inference_profiles` (optional CLI helper). |

**Not used by application code:** **EC2** (README mentions it only as an optional hackathon idea for remote workers). There is no `boto3` EC2 client in the repo.

**S3 “why / why not” (orchestrator):** The multi-agent runner talks to **Git**, **Bedrock/Gemini/Ollama**, and **DynamoDB/Mongo/memory**. It does **not** upload artifacts to S3. S3 appears in the **DINOLAB** deployment path for hosting the web build and optional assets.
