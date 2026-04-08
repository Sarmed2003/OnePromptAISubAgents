# API Platform Architecture Contracts

When designing API/backend/serverless systems, define these exact contracts:

## REST Endpoint Contracts

For every API endpoint, specify the exact HTTP method, path, request body, response body, and status codes:

```
POST /users
  Request:  { email: string, name: string, role?: "admin" | "user" }
  Response: { data: User } | { error: { message: string, code: string } }
  Status:   201 Created | 400 Bad Request | 409 Conflict

GET /users/:id
  Response: { data: User } | { error: { message: string, code: string } }
  Status:   200 OK | 404 Not Found

GET /users?limit=N&cursor=string
  Response: { data: User[], nextCursor?: string }
  Status:   200 OK
```

## TypeScript Interface Contracts

Define shared types that ALL handlers must import and use:

```typescript
// src/models/user.ts — created by task-001, used by ALL handler tasks
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role?: "admin" | "user";
}

export interface ApiResponse<T> {
  data?: T;
  error?: { message: string; code: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}
```

## DynamoDB Table Design

Specify the exact table schema, keys, and access patterns:

```
Table: Users
  PK: USER#{id}           (String)
  SK: METADATA             (String)
  GSI1: EmailIndex
    GSI1PK: {email}        (String)
    Projection: ALL

Access Patterns:
  - Get user by ID:     PK = USER#{id}, SK = METADATA
  - Get user by email:  GSI1PK = {email}
  - List all users:     Scan (with pagination via ExclusiveStartKey)
```

## Lambda Handler Pattern

Every handler MUST follow this exact pattern:

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // ... business logic ...
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ data: result }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: { message, code: "INTERNAL_ERROR" } }),
    };
  }
};
```

## CDK Construct Contracts

Specify what each CDK stack exports so cross-stack references work:

```
DataStack exports:
  - usersTable: dynamodb.Table  (table name and ARN)

ApiStack imports:
  - usersTable from DataStack
  exports:
  - apiUrl: string  (the API Gateway URL)

AuthStack exports:
  - userPool: cognito.UserPool
  - userPoolClient: cognito.UserPoolClient
```

## EventBridge Event Schema (if applicable)

```
Source: "myapp.users"
DetailType: "UserCreated"
Detail: {
  userId: string,
  email: string,
  timestamp: string
}
```

## Error Response Convention

All error responses across all endpoints MUST use this shape:
```json
{
  "error": {
    "message": "Human-readable error description",
    "code": "MACHINE_READABLE_CODE"
  }
}
```

Standard error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `UNAUTHORIZED`, `FORBIDDEN`, `INTERNAL_ERROR`
