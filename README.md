# API Platform

A TypeScript-based API platform with Express.js, featuring a notes service, health checks, and comprehensive middleware.

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Development

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run type-check
```

### Build & Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Docker

### Build Image
```bash
docker build -t api-platform .
```

### Run Container
```bash
docker run -p 3000:3000 api-platform
```

### Docker Compose
```bash
docker-compose up
```

## Environment Variables

See `.env.example` for all available configuration options.

```bash
cp .env.example .env
```

## API Endpoints

### Health Check
```
GET /health
```

### Notes
```
GET /api/notes          # Get all notes
POST /api/notes         # Create a note
GET /api/notes/:id      # Get a note by ID
PUT /api/notes/:id      # Update a note
DELETE /api/notes/:id   # Delete a note
```

## Architecture

- **Middleware**: Logging, error handling, authentication
- **Handlers**: Business logic for routes
- **Stores**: In-memory data persistence (can be replaced with database)
- **Types**: TypeScript interfaces for type safety

## CI/CD

This project uses GitHub Actions for:
- **Linting** with ESLint
- **Type Checking** with TypeScript
- **Testing** with Vitest
- **Building** Docker images
- **Deploying** to production

See `.github/workflows/ci.yml` for details.

## Deployment

### Docker / Container Orchestration
1. Build and push image to registry
2. Deploy using `docker run` or Kubernetes
3. Configure environment variables
4. Health checks are configured in Dockerfile

### Graceful Shutdown
The server listens for `SIGTERM` and `SIGINT` signals for graceful shutdown.

## Logging

All logs are output as JSON to stdout for CloudWatch/ELK integration:
```json
{"timestamp": "...", "level": "info", "method": "GET", "path": "/health", ...}
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

## License

MIT
