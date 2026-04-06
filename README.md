# DemoPulse - Demo REST API

A TypeScript-based demo REST API platform built with Express.js, featuring a notes service, health checks, and comprehensive middleware. DemoPulse is designed to showcase modern API development patterns and serve as a reference implementation for building scalable Node.js applications.

## Table of Contents

- [Project Description](#project-description)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [CI/CD](#cicd)
- [Logging](#logging)
- [License](#license)

## Project Description

DemoPulse is a demo REST API that demonstrates best practices for building production-ready Node.js applications. It includes:

- **Health checks** for monitoring and load balancer integration
- **Notes service** with full CRUD operations
- **Comprehensive middleware** for logging, error handling, and request validation
- **Type-safe TypeScript** codebase with strict type checking
- **Modular architecture** with clear separation of concerns
- **Docker support** for containerized deployment
- **Automated testing** with comprehensive test coverage
- **CI/CD pipelines** for continuous integration and deployment

This project serves as a reference implementation and learning resource for developers building modern REST APIs.

## Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn package manager
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/demopulse.git
   cd demopulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm test -- --watch

# Run linter
npm run lint

# Type check TypeScript
npm run type-check

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check

Healthy status check for monitoring and load balancers.

```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600
}
```

### Notes Service

#### Get All Notes

Retrieve all notes from the system.

```http
GET /api/notes
```

**Response (200 OK):**
```json
[
  {
    "id": "note-001",
    "title": "Welcome to DemoPulse",
    "content": "This is a sample note.",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  {
    "id": "note-002",
    "title": "API Documentation",
    "content": "Comprehensive REST API endpoints.",
    "createdAt": "2024-01-15T10:15:00Z",
    "updatedAt": "2024-01-15T10:15:00Z"
  }
]
```

#### Create a Note

Create a new note.

```http
POST /api/notes
Content-Type: application/json

{
  "title": "New Note",
  "content": "Note content goes here."
}
```

**Response (201 Created):**
```json
{
  "id": "note-003",
  "title": "New Note",
  "content": "Note content goes here.",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Get a Note by ID

Retrieve a specific note by its ID.

```http
GET /api/notes/:id
```

**Response (200 OK):**
```json
{
  "id": "note-001",
  "title": "Welcome to DemoPulse",
  "content": "This is a sample note.",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": {
    "message": "Note not found",
    "code": "NOT_FOUND"
  }
}
```

#### Update a Note

Update an existing note.

```http
PUT /api/notes/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content."
}
```

**Response (200 OK):**
```json
{
  "id": "note-001",
  "title": "Updated Title",
  "content": "Updated content.",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

#### Delete a Note

Delete a note by its ID.

```http
DELETE /api/notes/:id
```

**Response (204 No Content):**
```
(empty body)
```

## Running Tests

DemoPulse includes comprehensive test coverage using Vitest.

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

Generate a coverage report to see which parts of the code are tested:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

### Run Tests in Watch Mode

Continuously run tests as you modify files:

```bash
npm test -- --watch
```

### Test Organization

Tests are colocated with their source files:

```
handlers/
  notes.test.ts
  notes.ts
middleware/
  errorHandler.test.ts
  errorHandler.ts
```

## Project Structure

DemoPulse follows a modular architecture with clear separation of concerns:

```
demopulse/
├── src/
│   ├── handlers/              # Request handlers for routes
│   │   ├── health.ts          # Health check endpoint
│   │   ├── notes.ts           # Notes CRUD operations
│   │   └── *.test.ts          # Handler tests
│   ├── middleware/            # Express middleware
│   │   ├── errorHandler.ts    # Error handling middleware
│   │   ├── logger.ts          # Request logging middleware
│   │   ├── validator.ts       # Request validation middleware
│   │   └── *.test.ts          # Middleware tests
│   ├── routes/                # Route definitions
│   │   ├── index.ts           # Main router setup
│   │   ├── health.ts          # Health check routes
│   │   └── notes.ts           # Notes service routes
│   ├── types/                 # TypeScript type definitions
│   │   ├── note.ts            # Note entity types
│   │   ├── request.ts         # Request/response types
│   │   └── error.ts           # Error types
│   ├── stores/                # Data persistence layer
│   │   └── noteStore.ts       # In-memory note storage
│   ├── lib/                   # Utility functions
│   │   ├── logger.ts          # Logging utilities
│   │   └── validation.ts      # Validation utilities
│   └── app.ts                 # Express app configuration
├── .env.example               # Example environment variables
├── .gitignore                 # Git ignore rules
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker Compose configuration
├── package.json               # Project metadata and dependencies
├── tsconfig.json              # TypeScript configuration
├── vitest.config.ts           # Vitest configuration
└── README.md                  # This file
```

### Directory Descriptions

- **handlers/**: Contains request handler functions for each route. Each handler implements the business logic for processing requests and returning responses.

- **middleware/**: Contains Express middleware functions for cross-cutting concerns like error handling, logging, and request validation.

- **routes/**: Defines Express route definitions and endpoint mappings. Routes connect HTTP methods and paths to appropriate handlers.

- **types/**: Contains TypeScript interfaces and type definitions for type safety across the application.

- **stores/**: Implements the data persistence layer. Currently uses in-memory storage but can be replaced with database adapters.

- **lib/**: Contains utility functions and helper modules used throughout the application.

## Contributing Guidelines

We welcome contributions from the community! Please follow these guidelines to maintain code quality and consistency.

### Modular Design Principles

1. **Single Responsibility**: Each file should have one clear responsibility. Functions should do one thing well.

2. **Clear Dependencies**: Import only what you need. Avoid circular dependencies.

3. **Type Safety**: Use TypeScript types and interfaces. Avoid `any` types.

4. **Error Handling**: Always handle errors gracefully. Use typed error classes.

5. **Testing**: Write tests for new features. Aim for high coverage.

### File Organization

- Keep files small and focused (under 200 lines when possible)
- Group related functionality together
- Use meaningful file names that describe their purpose
- Colocate tests with source files using `.test.ts` suffix

### Naming Conventions

- **Files**: Use kebab-case (e.g., `error-handler.ts`)
- **Functions**: Use camelCase (e.g., `validateNote()`)
- **Types/Interfaces**: Use PascalCase (e.g., `Note`, `CreateNoteRequest`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_NOTE_LENGTH`)

### Code Quality Standards

1. **Linting**: Run `npm run lint` before committing. Fix all ESLint errors.

2. **Type Checking**: Run `npm run type-check` to ensure no TypeScript errors.

3. **Testing**: Write tests for new features. Run `npm test` to verify.

4. **Documentation**: Add JSDoc comments to exported functions and complex logic.

### Commit Process

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following the guidelines above
3. Run `npm run lint` and `npm run type-check` to verify quality
4. Run `npm test` to ensure tests pass
5. Commit with a clear message: `git commit -m "Add feature description"`
6. Push to your fork and create a pull request

### Pull Request Requirements

- All tests must pass
- No linting errors
- Type checking must pass
- Code coverage should not decrease
- Include a clear description of changes

## Deployment

### Docker Deployment

#### Build Docker Image

```bash
docker build -t demopulse:latest .
```

#### Run Container

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  demopulse:latest
```

#### Docker Compose

For local development with services:

```bash
docker-compose up
```

Stop services:

```bash
docker-compose down
```

### Environment Variables

Configure the application using environment variables:

```bash
# Server configuration
NODE_ENV=production          # Environment: development, staging, production
PORT=3000                    # Server port
LOG_LEVEL=info               # Logging level: debug, info, warn, error

# Application configuration
API_PREFIX=/api              # API endpoint prefix
MAX_REQUEST_SIZE=10mb        # Maximum request body size
```

See `.env.example` for all available options.

### Graceful Shutdown

The server listens for `SIGTERM` and `SIGINT` signals and performs graceful shutdown:

- Stops accepting new requests
- Waits for in-flight requests to complete
- Closes database connections
- Exits cleanly

### Health Checks

The `/health` endpoint is configured for load balancers and container orchestration:

```bash
curl http://localhost:3000/health
```

Configure your load balancer to check this endpoint regularly.

### Kubernetes Deployment

Example Kubernetes manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demopulse
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demopulse
  template:
    metadata:
      labels:
        app: demopulse
    spec:
      containers:
      - name: demopulse
        image: your-registry/demopulse:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Environment Variables

All configuration is managed through environment variables. Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Common variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `LOG_LEVEL` | `info` | Logging level |
| `API_PREFIX` | `/api` | API endpoint prefix |
| `MAX_REQUEST_SIZE` | `10mb` | Maximum request body size |

## CI/CD

DemoPulse uses GitHub Actions for continuous integration and deployment:

- **Linting**: ESLint checks code quality
- **Type Checking**: TypeScript strict mode validation
- **Testing**: Vitest runs all unit and integration tests
- **Building**: Docker images are built and tested
- **Deployment**: Automated deployment to production

See `.github/workflows/ci.yml` for detailed configuration.

## Logging

All logs are output as JSON to stdout for easy integration with logging platforms like CloudWatch, ELK, and Datadog:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "method": "GET",
  "path": "/health",
  "statusCode": 200,
  "duration": 2,
  "message": "Request completed"
}
```

### Log Levels

- **debug**: Detailed diagnostic information
- **info**: General informational messages
- **warn**: Warning messages for potentially harmful situations
- **error**: Error messages for error events

Set `LOG_LEVEL` environment variable to control verbosity.

## License

MIT License - see LICENSE file for details.

---

## Getting Help

- **Issues**: Report bugs or request features on GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Documentation**: Check the inline code documentation and comments
- **Examples**: Review the test files for usage examples

Happy coding! 🚀
