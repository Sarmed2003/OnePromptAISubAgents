# API Platform DevOps — CDK-First Deployment

For serverless API projects using AWS CDK, generate deployment infrastructure accordingly.

## CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npx cdk synth        # validate templates
      - run: npx cdk diff          # show changes (PR only)
        if: github.event_name == 'pull_request'
      - run: npx cdk deploy --all --require-approval never
        if: github.ref == 'refs/heads/main'
        env:
          AWS_REGION: us-east-1
```

## Key Rules

- **No Dockerfile needed** for pure Lambda/serverless projects
- Use `cdk synth` as the build/validate step
- Use `cdk diff` on PRs to show infrastructure changes before merge
- Use `cdk deploy --all` on main branch merges
- Configure AWS credentials via OIDC federation (IAM role), not static keys
- Run `cdk bootstrap` once per account/region before first deploy

## Monitoring

- Enable **X-Ray tracing** on Lambda functions: `tracing: lambda.Tracing.ACTIVE`
- Create **CloudWatch alarms** for Lambda errors and DynamoDB throttles
- Use **structured logging** (JSON) in Lambda handlers for CloudWatch Logs Insights
- Set up **API Gateway access logging** with request/response details

## Environment Separation

Use CDK context or environment variables to separate dev/staging/prod:

```typescript
const stage = app.node.tryGetContext("stage") || "dev";
new ApiStack(app, `ApiStack-${stage}`, { stage });
```

Deploy with: `cdk deploy --context stage=prod`
