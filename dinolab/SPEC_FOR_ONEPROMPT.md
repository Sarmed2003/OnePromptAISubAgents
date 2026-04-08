# OnePromptAI run spec — DINOLAB

Paste the following as your planning prompt (or merge into `SPEC.md`) when you want workers to extend this application in `dinolab/web` and `dinolab/infra`:

---

**Project:** DINOLAB — college-level dinosaur osteology lab UI (`dinolab/web`, Vite + React + TypeScript) with AWS SAM backend (`dinolab/infra`): API Gateway HTTP API, Lambda → Amazon Bedrock (scientific Q&A), S3 asset bucket (CORS-ready for GLTF/JSON packs), DynamoDB query log with TTL.

**Non-goals:** Content for young children; keep copy at upper-division undergraduate / intro graduate tone.

**UI requirements:** Maintain retro-futuristic aesthetic (pixel headers, holographic panels, CRT scanlines). Layered anatomy (osteology, myology schematic, soft envelope, radiograph styling). Every bone region must remain clickable and sync to the detail panel. Research console must POST to `/lab/ask` with species and optional bone context.

**AWS:** Prefer extending `template.yaml` over ad-hoc consoles. Large media belong in the Dinolab asset S3 bucket; use presigned URLs if adding upload flows.

**Testing:** `cd dinolab/web && npm run build` must pass before merge.

---
