# Deployment Guide

## Overview

This application is a Node.js/TypeScript API with a web frontend. It uses Docker for containerization and GitHub Actions for CI/CD.

## Prerequisites

- Node.js 20 or later
- Docker and Docker Compose
- Git

## Local Development

### Setup

```bash
npm install
cp .env.example .env
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Running Tests

```bash
npm run test
npm run test:watch
```

### Linting and Type Checking

```bash
npm run lint
npm run type-check
```

## Docker Deployment

### Build Image

```bash
docker build -t app:latest .
```

### Run Container

```bash
docker run -p 3000:3000 -e NODE_ENV=production app:latest
```

### Using Docker Compose

```bash
docker-compose up
```

For development with hot reload:

```bash
docker-compose -f docker-compose.yml up
```

## Environment Variables

See `.env.example` for all available configuration options. Key variables:

- `NODE_ENV`: Set to `production` for production deployments
- `PORT`: Application port (default: 3000)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## Health Checks

The application exposes a health check endpoint at `GET /health`. This is used by:

- Docker health checks (every 30 seconds)
- Load balancers
- Orchestration platforms (Kubernetes, ECS)

## Graceful Shutdown

The application handles `SIGTERM` and `SIGINT` signals for graceful shutdown:

1. Stops accepting new requests
2. Waits for in-flight requests to complete (with timeout)
3. Closes database connections
4. Exits cleanly

## CI/CD Pipeline

### Trigger Events

- **Pull Requests**: Runs lint, type-check, and tests
- **Push to main**: Runs full CI pipeline + Docker build
- **Tags (v*)**: Builds and pushes Docker image with version tag

### Pipeline Stages

1. **Lint** (`npm run lint`): ESLint validation
2. **Type Check** (`npm run type-check`): TypeScript validation
3. **Test** (`npm run test`): Unit and integration tests
4. **Build** (`npm run build`): TypeScript compilation
5. **Docker Build**: Multi-stage Docker image creation

### Artifacts

- Test coverage reports (30 days retention)
- Build artifacts (7 days retention)

## Production Deployment

### Best Practices

1. **Environment Variables**: Set all required variables before startup
2. **Health Checks**: Enable health check endpoint for load balancers
3. **Logging**: Use structured JSON logging for aggregation
4. **Resource Limits**: Set appropriate CPU and memory limits
5. **Restart Policy**: Use `unless-stopped` or equivalent

### Kubernetes Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
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
          initialDelaySeconds: 5
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### AWS ECS Example

```json
{
  "family": "app",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "node scripts/health-check.js"],
        "interval": 30,
        "timeout": 3,
        "retries": 3,
        "startPeriod": 5
      },
      "memory": 512,
      "cpu": 256,
      "essential": true
    }
  ]
}
```

## Monitoring and Logging

### Structured Logging

The application uses structured JSON logging. Example:

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "info",
  "message": "Request processed",
  "method": "GET",
  "path": "/health",
  "statusCode": 200,
  "duration": 1.5
}
```

### Log Aggregation

Use tools like:

- **CloudWatch** (AWS)
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Datadog**
- **New Relic**

## Troubleshooting

### Application won't start

1. Check environment variables are set correctly
2. Verify PORT is not in use
3. Check logs: `docker logs <container-id>`

### Health check failing

1. Ensure application is fully started
2. Check network connectivity
3. Verify `/health` endpoint is responding

### High memory usage

1. Check for memory leaks in application code
2. Increase container memory limit
3. Enable garbage collection logging

## Rollback Procedure

1. Identify the previous stable image tag
2. Update deployment to use previous image
3. Monitor health checks and logs
4. Investigate root cause of failure
