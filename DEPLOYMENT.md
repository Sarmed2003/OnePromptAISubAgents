# Deployment Guide

## Overview

This is a Node.js TypeScript API platform with both CLI game components and backend services. The project is containerized and ready for deployment.

## Tech Stack

- **Runtime**: Node.js 20 (Alpine)
- **Language**: TypeScript
- **Build Tool**: npm
- **Testing**: Vitest
- **Linting**: ESLint
- **Container**: Docker
- **CI/CD**: GitHub Actions

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional)

### Setup

```bash
# Install dependencies
npm ci

# Copy environment variables
cp .env.example .env

# Run development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Docker Compose

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## CI/CD Pipeline

The GitHub Actions workflow runs on every push and pull request:

1. **Lint**: ESLint validation
2. **Type Check**: TypeScript compilation check
3. **Test**: Vitest with coverage reporting to Codecov
4. **Build**: TypeScript compilation to JavaScript
5. **Docker Build**: Multi-stage Docker image build (cache only)
6. **Deploy**: Automatic deployment on main branch merge

### Required Secrets

Configure the following secrets in GitHub Actions:

- `AUTH_SECRET`: Authentication secret for signing tokens (stored in AWS Secrets Manager or GitHub Secrets, injected at runtime)
- `AWS_ROLE_ARN`: For AWS deployments
- `AWS_REGION`: Target AWS region
- `DEPLOY_KEY`: SSH key for deployment servers

**Important**: Never commit `AUTH_SECRET` or any sensitive credentials to version control. Use secure secret management systems:

- **AWS Secrets Manager**: Recommended for AWS deployments
- **GitHub Secrets**: For GitHub Actions CI/CD
- **HashiCorp Vault**: For multi-environment deployments
- **Environment-specific configuration**: Use different secrets per environment (dev, staging, production)

## Production Deployment

### Docker

```bash
# Build image
docker build -t api-platform:latest .

# Run container with secure secret injection
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e AUTH_SECRET="${AUTH_SECRET}" \
  api-platform:latest
```

### Environment Variables

Set the following in production:

```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
CORS_ORIGIN=https://yourdomain.com
AUTH_ENABLED=true
# AUTH_SECRET must be injected from secure secret management, never hardcoded
```

See `.env.example` for all available options.

### Secure Secret Management

#### AWS Secrets Manager

```bash
# Store secret
aws secretsmanager create-secret --name api-platform/auth-secret --secret-string "your-secret-key"

# Retrieve and inject into container
AUTH_SECRET=$(aws secretsmanager get-secret-value --secret-id api-platform/auth-secret --query SecretString --output text)
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e AUTH_SECRET="${AUTH_SECRET}" \
  api-platform:latest
```

#### GitHub Actions

1. Add secret to GitHub repository settings: Settings → Secrets and variables → Actions
2. Create `AUTH_SECRET` as a repository secret
3. Use in workflow:

```yaml
env:
  AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
```

#### Kubernetes (if applicable)

```bash
# Create secret
kubectl create secret generic api-platform-secrets \
  --from-literal=auth-secret="your-secret-key"

# Reference in deployment manifest
env:
  - name: AUTH_SECRET
    valueFrom:
      secretKeyRef:
        name: api-platform-secrets
        key: auth-secret
```

### Health Checks

The application exposes a health check endpoint:

```bash
curl http://localhost:3000/health
```

The Docker container includes an automatic health check that:
- Starts after 5 seconds
- Runs every 30 seconds
- Allows 3 seconds per check
- Retries up to 3 times before marking unhealthy

### Graceful Shutdown

The application handles `SIGTERM` and `SIGINT` signals for graceful shutdown. Containers will have 30 seconds to terminate before force kill.

## Monitoring

### Logs

Logs are written to stdout and can be captured by container orchestration platforms:

```bash
# View logs
docker logs <container-id>

# Stream logs
docker logs -f <container-id>
```

### Health Endpoint

Monitor application health at `/health` endpoint:

```bash
GET /health
Response: { "status": "ok" }
```

## Scaling

The application is stateless and can be scaled horizontally:

- Multiple container instances can run simultaneously
- No shared state between instances
- Use a load balancer to distribute traffic
- Implement connection pooling for external services

## Security

- Non-root user (nodejs:nodejs) runs the application
- Minimal Alpine base image reduces attack surface
- Dependencies pinned in package-lock.json
- **No secrets in Docker image** — all sensitive values injected at runtime
- Environment variables for sensitive configuration
- Secrets managed through secure secret management systems (AWS Secrets Manager, GitHub Secrets, etc.)
- Regular security audits of dependencies (`npm audit`)
- CORS properly configured for production domains

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs <container-id>

# Verify health check
docker ps --filter "id=<container-id>"

# Test manually
docker run -it api-platform:latest /bin/sh
```

### Port already in use

```bash
# Change port
docker run -p 8080:3000 api-platform:latest

# Or set PORT env var
docker run -e PORT=8080 -p 8080:8080 api-platform:latest
```

### High memory usage

- Check for memory leaks in application code
- Monitor with: `docker stats <container-id>`
- Set memory limits: `docker run -m 512m api-platform:latest`

### Missing AUTH_SECRET error

If the application fails with an authentication error:

1. Verify `AUTH_SECRET` is set in your secret management system
2. Confirm the environment variable is injected into the container
3. Check that the secret value is not empty or malformed
4. Review application logs for specific error details

## Performance Optimization

1. **Build Cache**: Docker layer caching is optimized in multi-stage build
2. **Dependencies**: Only production dependencies in final image
3. **Base Image**: Alpine Linux is minimal (~5MB)
4. **Node Heap**: Set `--max-old-space-size` if needed

## Rollback

To rollback to a previous version:

```bash
# Use git tags
git checkout v1.0.0
git push origin v1.0.0

# GitHub Actions will deploy the tagged version
```

## Additional Resources

- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
