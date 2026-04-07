# Deployment Guide

## Overview

This is a containerized Node.js/TypeScript application with both a game frontend (HTML/CSS/JS) and a REST API backend. The application is deployment-ready with Docker, CI/CD pipelines, and health checks.

## Technology Stack

- **Runtime**: Node.js 20 (Alpine)
- **Language**: TypeScript
- **Framework**: Express.js (inferred from src/app.ts)
- **Testing**: Vitest
- **Linting**: ESLint
- **Container**: Docker + docker-compose
- **CI/CD**: GitHub Actions

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (for containerized deployment)

### Setup

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Type check
npm run type-check

# Run tests
npm run test

# Build
npm run build

# Start development server
npm run dev
```

### Docker Compose

```bash
# Build and start
docker-compose up --build

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

## Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Key variables:

- `NODE_ENV`: `development`, `staging`, or `production`
- `PORT`: Server port (default: 3000)
- `HOST`: Bind address (default: 0.0.0.0)
- `LOG_LEVEL`: `debug`, `info`, `warn`, `error`
- `CORS_ORIGIN`: Allowed CORS origin

## Docker Deployment

### Build

```bash
docker build -t api-platform:latest .
```

### Run

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  api-platform:latest
```

### Health Check

The container includes a built-in health check:

```bash
curl http://localhost:3000/health
```

Expected response (200 OK):

```json
{"status": "ok"}
```

## CI/CD Pipeline

### Workflows

1. **ci.yml** (on push & PR):
   - Lint code (ESLint)
   - Type check (TypeScript)
   - Run tests (Vitest)
   - Build artifacts

2. **deploy.yml** (on push to main):
   - Build Docker image
   - Push to container registry
   - Deploy to production

### GitHub Secrets

For the deploy workflow, configure these secrets in your repository:

- `REGISTRY`: Container registry URL (e.g., `ghcr.io`)
- `IMAGE_NAME`: Image name (e.g., `owner/api-platform`)

## Production Deployment

### 12-Factor Compliance

This application follows the 12-factor app methodology:

1. **Codebase**: Single Git repository
2. **Dependencies**: Declared in `package.json`
3. **Config**: Stored in environment variables (`.env`)
4. **Backing Services**: Attached via connection strings (if applicable)
5. **Build/Release/Run**: Strictly separated stages
6. **Processes**: Stateless, share-nothing
7. **Port Binding**: Exports HTTP service via PORT env var
8. **Concurrency**: Scales via process replication
9. **Disposability**: Fast startup (< 5s), graceful shutdown (SIGTERM handling)
10. **Dev/Prod Parity**: Identical environments
11. **Logs**: Stdout/stderr event streams (JSON formatted)
12. **Admin Processes**: One-off tasks as separate scripts

### Graceful Shutdown

The application handles `SIGTERM` signals for graceful shutdown:

```bash
# Kubernetes will send SIGTERM before forceful termination
# Application has up to 30 seconds to shut down cleanly
```

### Logging

Logs are written to stdout in JSON format for easy parsing:

```json
{"timestamp": "2024-01-15T10:30:45Z", "level": "info", "message": "Server started", "port": 3000}
```

### Scaling

Run multiple instances behind a load balancer:

```bash
# Docker Swarm
docker service create --replicas 3 api-platform:latest

# Kubernetes
kubectl scale deployment api-platform --replicas=3
```

## Monitoring

### Health Checks

- **Endpoint**: `GET /health`
- **Response**: `{"status": "ok"}`
- **Interval**: 30s
- **Timeout**: 3s
- **Unhealthy threshold**: 3 failures

### Metrics

Recommended monitoring:

- HTTP request latency
- Error rate (5xx responses)
- Container CPU & memory usage
- Startup/shutdown duration

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs <container-id>

# Verify health check
docker inspect --format='{{json .State.Health}}' <container-id>
```

### Port already in use

```bash
# Change port
docker run -p 8080:3000 api-platform:latest
```

### Permission denied

The container runs as non-root user `nodejs` (UID 1001). Ensure file permissions are correct:

```bash
chown -R 1001:1001 /app
```

## Security

- Non-root user execution
- Alpine base image (minimal attack surface)
- No secrets in Dockerfile or environment defaults
- Health check prevents serving traffic during startup
- Graceful shutdown prevents data loss

## Next Steps

1. Configure GitHub secrets for container registry
2. Set up monitoring/alerting (CloudWatch, Datadog, etc.)
3. Configure log aggregation (ELK, Splunk, etc.)
4. Set up automated backups (if applicable)
5. Configure CDN/caching for static assets
