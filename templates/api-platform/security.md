# API Platform Security Checks

In addition to standard OWASP checks, audit these cloud-specific areas:

## IAM Least Privilege

- Lambda execution roles should only have permissions for the specific DynamoDB table, EventBridge bus, or SQS queue they need
- Never use `dynamodb:*` or `Action: "*"` — always scope to specific actions (`dynamodb:GetItem`, `dynamodb:PutItem`)
- CDK `grantReadWriteData()` is preferred over manual IAM policy construction

## API Authentication

- All mutating endpoints (POST, PUT, DELETE) must require authentication
- Read endpoints may be public if intentional — flag for review if auth is missing
- Use Cognito User Pool authorizer or Lambda authorizer on API Gateway
- API keys alone are not sufficient for user authentication (they are for rate limiting)

## Secrets Management

- Database connection strings, API keys, and tokens must come from SSM Parameter Store or Secrets Manager
- Environment variables are acceptable for non-secret config (table names, region)
- Never commit `.env` files, AWS credentials, or secret values to the repository

## CORS Policy

- `Access-Control-Allow-Origin: "*"` is acceptable for development only
- Production should restrict to specific domains
- Flag overly permissive CORS as a medium-severity finding

## Input Validation

- All Lambda handlers must validate and sanitize `event.body` before processing
- Use schema validation (zod, joi) rather than manual field checks
- Path parameters and query strings must be validated (type, length, format)
- Reject unexpected fields in request bodies
