# API Platform Testing Patterns

## Lambda Handler Unit Tests

Use `aws-sdk-client-mock` to mock AWS SDK v3 calls:

```typescript
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../src/handlers/getUser";

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

test("GET /users/:id returns user when found", async () => {
  ddbMock.on(GetCommand).resolves({
    Item: { id: "123", email: "test@example.com", name: "Test User" },
  });

  const event = {
    pathParameters: { id: "123" },
  } as any;

  const result = await handler(event);
  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body).data.email).toBe("test@example.com");
});

test("GET /users/:id returns 404 when not found", async () => {
  ddbMock.on(GetCommand).resolves({ Item: undefined });

  const event = { pathParameters: { id: "999" } } as any;
  const result = await handler(event);
  expect(result.statusCode).toBe(404);
});
```

## CDK Snapshot Tests

Use CDK's `Template.fromStack()` for infrastructure validation:

```typescript
import { Template } from "aws-cdk-lib/assertions";
import { App } from "aws-cdk-lib";
import { ApiStack } from "../infra/api-stack";

test("API Stack creates expected resources", () => {
  const app = new App();
  const stack = new ApiStack(app, "TestStack");
  const template = Template.fromStack(stack);

  template.resourceCountIs("AWS::Lambda::Function", 5);
  template.resourceCountIs("AWS::DynamoDB::Table", 1);
  template.hasResourceProperties("AWS::ApiGateway::RestApi", {
    Name: "UsersApi",
  });
});
```

## Test Framework

- **TypeScript/Node.js**: Use Jest with `ts-jest` preset
- **Python**: Use pytest with `moto` for AWS mocking
- Test file naming: `tests/test_<module>.ts` or `tests/<module>.test.ts`
- Include `jest.config.ts` or `jest` config in `package.json`
