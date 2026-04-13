# DINOLAB — Bone Detective Lab

College-level **retro-futuristic** web UI for exploring dinosaur **osteology** (2D lateral schematic + **interactive 3D bone map**) and optional **scientific Q&A** backed by **Amazon Bedrock** (via API Gateway + Lambda). It is an **example product** you can generate or extend with the **OnePromptAI multi-agent swarm** (see the [root README](../README.md) for the orchestrator, dashboard, and local run commands).

## Features

- **Species selector** (T. rex, *Velociraptor*, *Pteranodon*) with metadata (clade, period, locality).
- **Display modes**: **Osteology** (bones) and optional **Radiograph** (X-ray-style density) — 2D and 3D orbit share the same bone ids.
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

Typecheck and production build require the same install step (`npm install` or `npm ci`). If `npm run lint` reports hundreds of errors about missing `react` or `JSX.IntrinsicElements`, dependencies are not installed in `dinolab/web`.

Without `VITE_API_URL`, the research console does not call an API and shows a **configuration error** when you try to ask a question. For local Bedrock testing, set `VITE_API_URL` to `http://127.0.0.1:8787` (default port in `infra/local_ask_server.py`; override with `--port`) and run that server; for production, use the deployed `DinolabApiUrl`.

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

### Running the research console on AWS (full web app)

The research console is a normal browser `fetch` from the SPA to your HTTP API. To host everything on AWS:

1. **Deploy the SAM stack** (`sam build` / `sam deploy`) so you have `DinolabApiUrl` and optionally `DinolabAssetBucketName`.
2. **Align CORS with your UI origin.** The Ask Lambda returns `Access-Control-Allow-Origin` from the **`CorsOrigin` parameter** (see `infra/template.yaml`). Set it to your real frontend URL, for example `https://dino.example.com` or your CloudFront distribution URL (no trailing slash). Wildcard `*` works for quick tests but is inappropriate for credentialed or locked-down production setups.
3. **Build the web app with the API baked in:** in `dinolab/web`, set `VITE_API_URL` to the **exact** `DinolabApiUrl` output (no trailing slash), then `npm run build`.
4. **Host the static `dist/`** on **S3 + CloudFront** (or **Amplify Hosting**), with `index.html` fallback for client-side routing if you add routes later.
5. **Bedrock access:** the Lambda execution role and region must allow `bedrock:InvokeModel` for the model ID you configure in the stack.

With that, users load the SPA from CloudFront; questions hit API Gateway → Lambda → Bedrock; answers return with CORS headers matching your chosen origin.

### Vercel (`*.vercel.app`)

The default `https://YOUR-PROJECT.vercel.app` hostname comes from the **Vercel project name** (Dashboard → Project → Settings → General). Rename the project to something like `dino-lab` or `dinolab-bone-lab` to get a URL containing those words, or attach a custom domain.

**Root directory (recommended):** set the Vercel project **Root Directory** to `dinolab/web`. That folder contains **`vercel.json`** (`framework: vite`, `npm ci` + `npm run build`, output **`dist`**). **Node 20+** is declared in `package.json` `engines`.

**Root directory = repo root:** if you import the whole monorepo with root **`.`**, use the **`vercel.json` at the repository root** (it `cd`s into `dinolab/web` for install/build and sets `outputDirectory` to `dinolab/web/dist`). Prefer **`dinolab/web`** as the project root when possible so only one config applies.

**Environment variables (Production / Preview):** set at least **`VITE_API_URL`** to your deployed Ask API URL (no trailing slash) if you want the research console to call Bedrock. For the full form on `*.vercel.app`, also set **`VITE_ALLOW_VERCEL_RESEARCH=true`** and ensure the Lambda **CORS** allows your Vercel origin.

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
