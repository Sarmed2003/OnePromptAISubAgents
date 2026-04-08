# API Platform Integration Patterns

When fixing cross-file references in TypeScript/CDK API projects:

## TypeScript Import Resolution

- Handlers import models: `import { User } from "../models/user";`
- Handlers import lib: `import { docClient } from "../lib/dynamodb";`
- CDK stacks import constructs: `import { ApiStack } from "./api-stack";`
- All paths are relative — never use absolute paths or path aliases without tsconfig support

## CDK Cross-Stack References

When one stack needs resources from another:

```typescript
// data-stack.ts exports the table
export class DataStack extends Stack {
  public readonly usersTable: dynamodb.Table;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.usersTable = new dynamodb.Table(this, "UsersTable", { ... });
  }
}

// api-stack.ts imports it
interface ApiStackProps extends StackProps {
  usersTable: dynamodb.Table;
}
export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    // use props.usersTable
  }
}

// app.ts wires them
const data = new DataStack(app, "DataStack");
new ApiStack(app, "ApiStack", { usersTable: data.usersTable });
```

## Common Fixes

- Missing `export` on shared types/interfaces
- Wrong relative path depth (`../` vs `../../`)
- CDK stack not passing table/resources to dependent stacks
- Missing `aws-lambda` types in handler imports (need `@types/aws-lambda` in package.json)
- Handler environment variables not matching CDK `environment` keys
