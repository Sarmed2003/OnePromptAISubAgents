# DINOLAB — Bone Detective Lab

College-level **retro-futuristic** web UI for exploring dinosaur osteology, layered anatomy, and **scientific Q&A** backed by **Amazon Bedrock** (via API Gateway + Lambda). Designed as the front-end and integration surface for a multi-agent research stack; OnePromptAI can target this repo or folder in a run.

## Features

- **Species selector** with metadata (clade, period, locality).
- **Layered anatomy**: skeleton · myological schematic · soft-tissue silhouette · radiographic (X-ray) styling — toggled per view.
- **Per-bone selection**: holographic / wireframe detail panel with osteological notes.
- **Research console (bonus)**: submits highly technical questions; Lambda invokes Bedrock with a strict paleontology system prompt.

## Repository layout

| Path | Purpose |
|------|---------|
| `web/` | Vite + React + TypeScript UI |
| `infra/` | AWS SAM — HTTP API, Ask Lambda, S3 asset bucket, optional query log table |

## Prerequisites

- Node 20+
- AWS CLI, SAM CLI
- Bedrock model access (e.g. Claude Haiku/Sonnet) in your account/region

## Local UI (no AWS)

```bash
cd dinolab/web
npm install
npm run dev
```

Without `VITE_API_URL`, the research console does not call an API and shows a **configuration error** when you try to ask a question. For local Bedrock testing, set `VITE_API_URL` to `http://127.0.0.1:8788` (see `infra/local_ask_server.py`) and run that server; for production, use the deployed `DinolabApiUrl`.

## Deploy backend + S3 (engineers)

```bash
cd dinolab/infra
sam build
sam deploy --guided
```

Outputs:

- `DinolabApiUrl` — set `VITE_API_URL` to this value (no trailing slash) and rebuild the web app.
- `DinolabAssetBucketName` — sync static build and optionally host SPA:

```bash
cd ../web && npm run build
aws s3 sync dist s3://YOUR_BUCKET_NAME --delete
```

For production, add **CloudFront** + ACM certificate in front of the bucket (same-origin or configured CORS for API on another domain).

### Vercel (`*.vercel.app`)

The default `https://YOUR-PROJECT.vercel.app` hostname comes from the **Vercel project name** (Dashboard → Project → Settings → General). Rename the project to something like `dino-lab` or `dinolab-bone-lab` to get a URL containing those words, or attach a custom domain.

Production builds on `*.vercel.app` show a **coming soon** research-console screen (no API calls) until you set `VITE_RESEARCH_COMING_SOON=false` and a working `VITE_API_URL`, then redeploy.

## Environment (web)

Copy `web/.env.example` to `web/.env`:

- `VITE_API_URL` — API Gateway base URL after deploy
- `VITE_ASSET_BASE` — optional CloudFront or S3 website URL for large assets later
- `VITE_RESEARCH_COMING_SOON` — optional `true` / `false`; overrides the automatic coming-soon behavior on `*.vercel.app`

## Scientific use disclaimer

Generated answers are **model outputs** for research assistance, not peer review. Always verify against primary literature and specimen data.
