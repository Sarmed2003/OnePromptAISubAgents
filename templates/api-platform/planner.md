# API Platform Planning Guide

When decomposing API/backend/serverless projects, follow these patterns:

## Decomposition Strategy

Each independently deployable unit gets its own task. Maximize parallelism by ensuring zero file overlap between tasks.

### Example: "Build a REST API for user management with auth"

| Task | File(s) | Purpose |
|------|---------|---------|
| task-001 | `src/models/user.ts` | User type definitions, DynamoDB entity schema, shared interfaces |
| task-002 | `src/handlers/createUser.ts` | POST /users — Lambda handler for user creation |
| task-003 | `src/handlers/getUser.ts` | GET /users/:id — Lambda handler for fetching a user |
| task-004 | `src/handlers/listUsers.ts` | GET /users — Lambda handler for listing users with pagination |
| task-005 | `src/handlers/updateUser.ts` | PUT /users/:id — Lambda handler for updating a user |
| task-006 | `src/handlers/deleteUser.ts` | DELETE /users/:id — Lambda handler for deleting a user |
| task-007 | `src/middleware/auth.ts` | JWT/API key validation middleware shared by all handlers |
| task-008 | `src/middleware/validation.ts` | Request body validation using zod or joi schemas |
| task-009 | `src/lib/dynamodb.ts` | DynamoDB DocumentClient singleton, helper functions (get, put, query, delete) |
| task-010 | `infra/api-stack.ts` | CDK stack: API Gateway REST API, Lambda functions, DynamoDB table |
| task-011 | `infra/auth-stack.ts` | CDK stack: Cognito user pool or API key resource |
| task-012 | `infra/app.ts` | CDK app entry point wiring all stacks together |

This gives 12 parallel agents with zero merge conflicts.

### Example: "Build an event-driven webhook integration hub"

| Task | File(s) | Purpose |
|------|---------|---------|
| task-001 | `src/models/webhook.ts` | Webhook config type, event schemas, shared interfaces |
| task-002 | `src/handlers/registerWebhook.ts` | POST /webhooks — register a new webhook endpoint |
| task-003 | `src/handlers/listWebhooks.ts` | GET /webhooks — list configured webhooks |
| task-004 | `src/handlers/ingestEvent.ts` | POST /events — receive incoming events from external sources |
| task-005 | `src/handlers/deliverWebhook.ts` | SQS consumer — deliver events to registered webhook URLs with retries |
| task-006 | `src/lib/dynamodb.ts` | DynamoDB client helpers for webhook config and delivery log tables |
| task-007 | `src/lib/eventbridge.ts` | EventBridge client helpers for publishing and rule management |
| task-008 | `infra/api-stack.ts` | CDK: API Gateway + Lambda handlers |
| task-009 | `infra/events-stack.ts` | CDK: EventBridge bus, SQS queues, DLQ, delivery Lambda |
| task-010 | `infra/data-stack.ts` | CDK: DynamoDB tables (webhooks, delivery_log) |
| task-011 | `infra/app.ts` | CDK app entry point |

## Key Rules for API Projects

- **Each Lambda handler = 1 task** — one handler per file, one file per task
- **Shared types/models = 1 task** — all interfaces and schemas in a dedicated file
- **Each CDK stack = 1 task** — never mix infrastructure and application code
- **Middleware is shared** — give it its own task with its own files
- **CDK app entry point = 1 task** — wires stacks together, loaded last
- **Library/utility modules = 1 task each** — DynamoDB client, EventBridge helpers, etc.
- **Never put two Lambda handlers in the same file** — eliminates merge conflicts
