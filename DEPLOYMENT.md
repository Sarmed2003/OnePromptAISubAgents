# Deployment Guide

## Overview

This is a containerized Node.js/TypeScript application with both a backend API and frontend static assets. It uses Docker for containerization and GitHub Actions for CI/CD.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local development)
- GitHub repository with Actions enabled

## Local Development

### Setup

```bash
npm install
cp .env.example .env
```

### Running Locally

**Without Docker:**
```bash
npm run build
npm start
```

**With Docker Compose:**
```bash
docker-compose up
```

Application will be available at `http://localhost:3000`

### Health Check

```bash
node scripts/health-check.js
```

## CI/CD Pipeline

The GitHub Actions workflow runs on every push to `main` and pull requests:

1. **Lint** (`npm run lint`) - ESLint validation
2. **Type Check** (`npm run type-check`) - TypeScript compilation check
3. **Test** (`npm run test`) - Vitest unit tests
4. **Build** (`npm run build`) - Production build
5. **Docker Build** - Multi-stage Docker image build (main branch only)

## Docker Deployment

### Building the Image

```bash
docker build -t app:latest .
```

### Running the Container

```bash
docker run -p 3000:3000 -e NODE_ENV=production app:latest
```

### Environment Variables

Configure via `.env` file or Docker environment:

- `NODE_ENV` - Set to `production` for production deployments
- `PORT` - Application port (default: 3000)
- `LOG_LEVEL` - Logging level (default: info)
- `API_TIMEOUT` - API request timeout in ms (default: 30000)

## Production Deployment

### Option 1: Cloud Container Registry (ECR, Docker Hub, GHCR)

1. Configure Docker registry credentials in GitHub Secrets
2. Update `.github/workflows/deploy.yml` with your registry
3. Push to main branch to trigger automated deployment

### Option 2: Kubernetes

Example deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-app
  template:
    metadata:
      labels:
        app: api-app
    spec:
      containers:
      - name: app
        image: app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

### Option 3: Traditional VPS/VM

1. SSH into your server
2. Install Docker and Docker Compose
3. Clone repository and run: `docker-compose up -d`
4. Configure reverse proxy (nginx/Apache) to forward requests to localhost:3000

## Monitoring & Logs

### Docker Logs

```bash
docker logs -f <container_id>
```

### Health Endpoint

The application exposes a health check endpoint:

```bash
curl http://localhost:3000/health
```

## Graceful Shutdown

The application handles `SIGTERM` and `SIGINT` signals for graceful shutdown:

- Stops accepting new connections
- Waits for existing requests to complete
- Closes database connections
- Exits cleanly

## Scaling

### Docker Compose

```bash
docker-compose up -d --scale app=3
```

### Kubernetes

```bash
kubectl scale deployment api-app --replicas=3
```

## Troubleshooting

### Container fails to start

1. Check logs: `docker logs <container_id>`
2. Verify environment variables are set
3. Ensure port 3000 is not in use

### Health check fails

1. Verify `/health` endpoint is responding
2. Check application logs for errors
3. Verify network connectivity

### Build failures in CI

1. Check GitHub Actions logs
2. Verify Node.js version compatibility
3. Ensure all dependencies are declared in package.json

## Rollback Procedure

1. Identify the previous stable image tag
2. Update deployment to use previous image
3. Monitor application health
4. Investigate root cause of failed deployment

## Security Considerations

- Run container as non-root user (nodejs:1001)
- Keep base image updated (node:20-alpine)
- Scan images for vulnerabilities: `docker scan app:latest`
- Use environment variables for secrets (never commit to repo)
- Enable HTTPS in production via reverse proxy
- Implement rate limiting and request validation

## Performance Optimization

- Multi-stage Docker build reduces image size
- Alpine base image (~150MB vs ~900MB for full Node)
- Layer caching in CI/CD for faster builds
- Health checks configured for fast recovery
- Non-root user reduces attack surface

## Support

For issues or questions, refer to:
- Application README.md
- GitHub Actions logs
- Docker documentation: https://docs.docker.com
