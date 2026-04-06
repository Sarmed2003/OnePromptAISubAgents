# DemoPulse

A minimal REST API demo showing modular Node.js backend patterns.

## Features

- **Health Check Endpoint** — Verify API availability with a simple `/health` endpoint
- **Notes List Endpoint** — Retrieve and manage notes via `/notes` endpoints
- **In-Memory Storage** — Fast, simple data persistence for demo purposes
- **Automated Tests** — Comprehensive test suite covering all endpoints and edge cases
- **CI/CD Pipeline** — Automated testing and deployment workflows
- **Modular Architecture** — Clean separation of concerns with handlers, types, and routes

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/demopulse.git
cd demopulse

# Install dependencies
npm install

# Start the server
npm start
```

The server runs on `http://localhost:3000` by default.

### API Examples

#### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Notes

```bash
curl http://localhost:3000/notes
```

Expected response:
```json
{
  "notes": [
    {
      "id": "1",
      "title": "Sample Note",
      "content": "This is a demo note.",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create a Note

```bash
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Note",
    "content": "This is my first note."
  }'
```

Expected response:
```json
{
  "id": "2",
  "title": "My Note",
  "content": "This is my first note.",
  "createdAt": "2024-01-15T10:31:00Z"
}
```

## Project Structure

```
src/
├── handlers/        # Request handlers for each endpoint
│   ├── health.ts    # Health check handler
│   └── notes.ts     # Notes CRUD handlers
├── types/           # TypeScript type definitions
│   └── index.ts     # Shared types (Note, Request, Response)
├── routes/          # Route definitions and middleware
│   └── index.ts     # Express route setup
└── index.ts         # Application entry point

tests/
├── health.test.ts   # Health endpoint tests
├── notes.test.ts    # Notes endpoint tests
└── setup.ts         # Test utilities and fixtures
```

### Key Directories

- **src/handlers** — Pure request handlers with business logic. Each handler receives a request and returns a response.
- **src/types** — Centralized TypeScript interfaces for type safety across the application.
- **src/routes** — Express route definitions and middleware configuration.
- **tests** — Jest test suites covering happy paths, error cases, and edge cases.

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The test suite covers:

- **Health Endpoint** — Verifies `/health` returns correct status and timestamp
- **Notes Endpoints** — Tests GET (list), POST (create), and error scenarios
- **Input Validation** — Ensures invalid requests are rejected with proper error messages
- **Edge Cases** — Tests empty lists, missing fields, and malformed JSON
- **Response Format** — Validates all responses match expected JSON schema

## Deployment

### Environment Variables

Configure the following environment variable to customize the server:

- `PORT` (default: `3000`) — The port on which the server listens

Example:
```bash
PORT=8080 npm start
```

### Security Considerations

**This is a demo application.** For production use:

- ⚠️ **No Authentication** — This demo requires no API keys or authentication. Add OAuth2 or API key validation before production.
- ⚠️ **No Rate Limiting** — Add rate limiting middleware to prevent abuse.
- ⚠️ **No Input Sanitization** — Validate and sanitize all user inputs to prevent injection attacks.
- ⚠️ **In-Memory Storage** — Data is lost on server restart. Use a persistent database (PostgreSQL, MongoDB, DynamoDB) for production.
- ⚠️ **No HTTPS** — Always use HTTPS in production.
- ⚠️ **No CORS** — Review and restrict CORS headers based on your deployment.

## Contributing

We welcome contributions! Here's how to get started:

### Before You Start

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Install dependencies: `npm install`

### Development Workflow

1. Make your changes in `src/`
2. Add or update tests in `tests/` to cover your changes
3. Run tests locally: `npm test`
4. Ensure all tests pass before submitting a pull request

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting (prettier is configured)
- Keep functions small and focused
- Add JSDoc comments for public functions

### Submitting Changes

1. Commit with clear messages: `git commit -m "Add feature: description"`
2. Push to your branch: `git push origin feature/your-feature-name`
3. Open a pull request with a clear description of your changes
4. Ensure CI/CD pipeline passes

### Reporting Issues

If you find a bug or have a suggestion:

1. Check existing issues to avoid duplicates
2. Open a new issue with a clear title and description
3. Include steps to reproduce (for bugs)
4. Include your environment (Node version, OS, etc.)

---

**Questions?** Open an issue or contact the maintainers. Happy coding!
