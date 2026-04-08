# DINOLAB infrastructure (AWS SAM)

## Deploy

```bash
cd dinolab/infra
sam build
sam deploy --guided
```

- **Stack name:** e.g. `dinolab-prod`
- **BedrockModelId:** use an inference profile or on-demand model ID enabled in your account
- **CorsOrigin:** set to your CloudFront or S3 website origin in production (e.g. `https://dinolab.example.edu`)

## Outputs → web app

1. Copy **DinolabApiUrl** into `dinolab/web/.env` as `VITE_API_URL` (no trailing slash).
2. `cd ../web && npm run build`
3. Sync the static site to **DinolabAssetBucketName** (private bucket — use Origin Access Control + CloudFront in production, or temporary presigned access for demos):

```bash
aws s3 sync ../web/dist s3://BUCKET_NAME --delete
```

## S3 use cases

- Versioned **JSON** species packs (additional taxa) loaded at runtime via `fetch` from a public prefix (requires bucket policy or CloudFront OAC change if you need public read).
- **GLTF / textures** for future 3D viewers; keep CORS rules aligned with your frontend origin.

## DynamoDB

`DinolabQueryLogTable` stores anonymized previews (question truncation, answer preview) with **TTL** — not a full audit trail; extend schema if compliance requires it.
