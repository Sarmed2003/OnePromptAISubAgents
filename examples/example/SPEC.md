# Example Project Spec — Todo App REST API

## Product Statement
A simple REST API for managing todo items, built with Node.js and Express. Users can create, read, update, and delete todo items. Data is stored in a JSON file for simplicity.

## Success Criteria (Ranked)
1. All CRUD endpoints work correctly with proper HTTP status codes
2. Input validation prevents malformed data from being stored
3. Error handling provides clear, actionable error messages

### Hard Limits
- Time budget: 30 minutes agent runtime
- Resource budget: Under 50,000 tokens
- External services: None (file-based storage)
- Runtime mode: Node.js with Express

## Acceptance Tests (Runnable, Objective)
- `POST /todos` with valid body results in 201 with created todo
- `GET /todos` results in 200 with array of all todos
- `GET /todos/:id` with valid ID results in 200 with single todo
- `PUT /todos/:id` with valid body results in 200 with updated todo
- `DELETE /todos/:id` with valid ID results in 204
- `POST /todos` with empty title results in 400 with error message

## Non-Negotiables
- No TODOs, placeholders, or pseudocode in core paths.
- Every endpoint has validation and explicit error handling.
- Every major component has at least one minimal test.
- No silent failures; errors are surfaced in logs and responses.

## Architecture Constraints
### Topology
- Repo structure: `src/` for source, `tests/` for tests
- Primary boundaries: routes → controllers → storage

### File/Folder Expectations
- `src/server.js`: Express app setup and middleware
- `src/routes/todos.js`: Route definitions
- `src/controllers/todos.js`: Business logic
- `src/storage.js`: JSON file-based data layer
- `tests/todos.test.js`: API integration tests

## Dependency Philosophy
### Allowed
- express, uuid, jest, supertest

### Banned
- Database drivers (keep it simple with file storage)

## Scope Model
### Must Have
- CRUD endpoints for todos
- Input validation
- Error handling middleware
- Basic tests

### Nice to Have
- Filtering/search
- Pagination
- Request logging

### Out of Scope
- Authentication
- Database integration
- Frontend UI
