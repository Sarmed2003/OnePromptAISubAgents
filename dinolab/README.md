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

**Root directory:** set the Vercel project **Root Directory** to `dinolab/web` so the Vite app (and bundled assets like the research mascot) build correctly.

**Research console on Vercel:** production builds on `*.vercel.app` show a **hosted preview** layout (two-column **Context** + mascot **Loco**, read-only question field, **“down for now, up soon!”** — **no** Bedrock `fetch`) unless you set `VITE_ALLOW_VERCEL_RESEARCH=true` **and** a working `VITE_API_URL`. Local `npm run dev` keeps the full Bedrock form when `VITE_API_URL` is set.

**Deployment canceled — “unverified commit”:** Vercel skips builds when the Git commit’s author email is not linked to a **verified** GitHub account. Fix: [verify your email on GitHub](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/verifying-your-email-address), set `git config user.email` to that address, then amend or make a new commit and push. If the commit was made by someone else, they must verify their email or you must merge a new commit authored with a verified identity.

## Environment (web)

Copy `web/.env.example` to `web/.env`:

- `VITE_API_URL` — API Gateway base URL after deploy
- `VITE_ASSET_BASE` — optional CloudFront or S3 website URL for large assets later
- `VITE_ALLOW_VERCEL_RESEARCH` — on Vercel only, `true` enables the full research form when the API is ready
- `VITE_RESEARCH_COMING_SOON` — optional `true` on **non-Vercel** builds to mimic the Vercel “coming soon” UI

## Scientific use disclaimer

Generated answers are **model outputs** for research assistance, not peer review. Always verify against primary literature and specimen data.
