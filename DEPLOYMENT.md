# Deployment Guide

## Overview

This is a containerized Node.js/TypeScript application with both a backend API and frontend static assets. It uses Docker for containerization and GitHub Actions for CI/CD. The API includes built-in rate limiting to protect against abuse.

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

## Rate Limiting

The API implements per-user rate limiting to protect against abuse and DoS attacks:

### Configuration

- **Rate Limit**: 100 requests per minute per user
- **Window**: 60 seconds
- **Identifier**: User ID (if authenticated) or IP address (if anonymous)

### Rate Limit Headers

All API responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699564800000
```

### Rate Limit Exceeded Response

When a user exceeds the rate limit, the API returns a 429 (Too Many Requests) response:

```json
{
  "error": {
    "message": "Rate limit exceeded. Maximum 100 requests per minute allowed.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

The response includes a `Retry-After` header indicating when to retry:

```
Retry-After: 45
```

### Disabling Rate Limiting for Specific Routes

To exclude the health check endpoint from rate limiting, apply middleware selectively on specific routes:

```typescript
router.get('/health', (req, res) => {
  // No rate limiting applied
});

router.use(rateLimitMiddleware);
router.get('/api/notes', ...);
```

### Adjusting Rate Limits

To modify rate limits, edit the constants in `src/middleware/errorHandler.ts`:

```typescript
const RATE_LIMIT_WINDOW_MS = 60000;        // Window duration in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 100;       // Max requests per window
```

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

**Note on Rate Limiting with Kubernetes:**

When deploying to Kubernetes with multiple replicas, the in-memory rate limiting store is per-instance. For distributed rate limiting across all replicas, consider:

1. **Redis-based rate limiting** - Use Redis to store rate limit counters across all instances
2. **API Gateway rate limiting** - Implement rate limiting at the ingress level (e.g., nginx, Istio)
3. **Sticky sessions** - Route requests from the same user to the same pod (less ideal)

Example Redis integration:

```typescript
import redis from 'redis';

const redisClient = redis.createClient();

export async function rateLimitMiddlewareRedis(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = (req as any).userId || req.ip || 'anonymous';
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Remove old entries
  await redisClient.zremrangebyscore(key, '-inf', windowStart);

  // Count requests in current window
  const count = await redisClient.zcard(key);

  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json(
      formatError(
        `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed.`,
        'RATE_LIMIT_EXCEEDED'
      )
    );
    return;
  }

  // Add current request
  await redisClient.zadd(key, now, `${now}-${Math.random()}`);
  await redisClient.expire(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));

  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', RATE_LIMIT_MAX_REQUESTS - count - 1);

  next();
}
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

### Rate Limiting Monitoring

Monitor rate limit violations in application logs. Look for `RATE_LIMIT_EXCEEDED` errors:

```bash
docker logs <container_id> | grep RATE_LIMIT_EXCEEDED
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

**Important:** When scaling horizontally, rate limiting is per-instance. For consistent rate limiting across instances, use Redis-based rate limiting (see Kubernetes section above).

### Kubernetes

```bash
kubectl scale deployment api-app --replicas=3
```

For distributed rate limiting, deploy a Redis instance alongside the application.

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

### Rate limiting not working

1. Verify `rateLimitMiddleware` is applied in `src/routes/index.ts`
2. Check that rate limit constants are correctly configured
3. For multi-instance deployments, ensure Redis is configured
4. Monitor `X-RateLimit-*` headers in responses

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
- **Rate limiting enabled** - Protects against abuse and DoS attacks (100 requests/minute per user)
- Implement request validation
- Monitor rate limit violations for suspicious activity

## Performance Optimization

- Multi-stage Docker build reduces image size
- Alpine base image (~150MB vs ~900MB for full Node)
- Layer caching in CI/CD for faster builds
- Health checks configured for fast recovery
- Non-root user reduces attack surface
- In-memory rate limiting for low-latency protection (consider Redis for distributed systems)

## Support

For issues or questions, refer to:
- Application README.md
- GitHub Actions logs
- Docker documentation: https://docs.docker.com
