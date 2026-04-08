# API Platform Worker Conventions

When implementing Lambda handlers, CDK stacks, or backend services, follow these patterns:

## AWS SDK v3 (TypeScript)

Always use modular imports from AWS SDK v3:

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
```

NEVER use AWS SDK v2 (`aws-sdk`). Always use v3 modular packages.

## Lambda Handler Conventions

- Always return `{ statusCode, headers, body }` — never throw unhandled
- Always set `Content-Type: application/json` and CORS headers
- Read table names, region, etc. from `process.env` — never hardcode
- Parse `event.body` with `JSON.parse()` inside a try/catch
- Validate all input before processing
- Use `event.pathParameters?.id` for path params (may be undefined)
- Use `event.queryStringParameters?.limit` for query params

## CDK Conventions

- Use L2 constructs (e.g., `new dynamodb.Table(...)` not `new CfnTable(...)`)
- Export resources via stack properties, not `CfnOutput` (unless needed for cross-account)
- Grant permissions explicitly: `table.grantReadWriteData(lambdaFn)`
- Use `RemovalPolicy.DESTROY` for dev, `RemovalPolicy.RETAIN` for prod tables
- Set `billingMode: dynamodb.BillingMode.PAY_PER_REQUEST` for DynamoDB (serverless)
- Bundle Lambda code with `NodejsFunction` from `aws-cdk-lib/aws-lambda-nodejs`

## Environment Variables

Every Lambda reads configuration from environment variables injected by CDK:

```typescript
const TABLE_NAME = process.env.TABLE_NAME!;
const REGION = process.env.AWS_REGION || "us-east-1";
```

CDK sets these:
```typescript
const fn = new NodejsFunction(this, "CreateUser", {
  environment: {
    TABLE_NAME: table.tableName,
  },
});
```

## Error Handling

Wrap all handler logic in try/catch. Return structured error responses:

```typescript
catch (err) {
  console.error("CreateUser failed:", err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return {
    statusCode: err instanceof ValidationError ? 400 : 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: { message, code: "INTERNAL_ERROR" } }),
  };
}
```

## Import Paths

Use relative imports for local modules:
```typescript
import { User, CreateUserRequest, ApiResponse } from "../models/user";
import { docClient, TABLE_NAME } from "../lib/dynamodb";
```

Use package imports for AWS and external dependencies:
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
```
