# AWS Deployment Guide for Dinolab Ask Service

## Overview

This guide explains how to deploy the Dinolab ask service to AWS using SAM (Serverless Application Model), Lambda, and API Gateway. **This deployment is optional** — you can continue using the local development server. Follow these steps only if you want to deploy to production.

---

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### 1. AWS Account
- Create an AWS account at [https://aws.amazon.com](https://aws.amazon.com)
- Ensure you have appropriate IAM permissions (Lambda, API Gateway, CloudFormation, S3)

### 2. AWS CLI
Install the AWS CLI v2:

```bash
# macOS
brew install awscliv2

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
# Download from https://awscli.amazonaws.com/AWSCLIV2.msi
```

Verify installation:

```bash
aws --version
```

Configure AWS credentials:

```bash
aws configure
```

You will be prompted for:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

### 3. SAM CLI
Install the AWS SAM CLI:

```bash
# macOS
brew install aws-sam-cli

# Linux
pip install aws-sam-cli

# Windows
# Download from https://github.com/aws/aws-sam-cli/releases
```

Verify installation:

```bash
sam --version
```

### 4. Node.js
Ensure Node.js 18+ is installed:

```bash
node --version
```

---

## Step-by-Step SAM Build and Deploy

### Step 1: Prepare Your Environment

Navigate to the infrastructure directory:

```bash
cd dinolab/infra
```

Ensure you have a `template.yaml` file that defines your Lambda function and API Gateway. If not, create one (see section below).

### Step 2: Build the SAM Application

Run the SAM build command to package your application:

```bash
sam build
```

This command:
- Reads `template.yaml`
- Installs dependencies
- Packages the Lambda function code
- Outputs to `.aws-sam/build/`

### Step 3: Deploy with SAM

Run the SAM deploy command in guided mode (first time only):

```bash
sam deploy --guided
```

You will be prompted for:

1. **Stack Name**: Enter a unique name (e.g., `dinolab-ask-service`)
2. **AWS Region**: Choose your region (e.g., `us-east-1`)
3. **Confirm changes before deploy**: Type `y` to review before deploying
4. **Allow SAM CLI IAM role creation**: Type `y`
5. **Save parameters to samconfig.toml**: Type `y` (saves configuration for future deploys)

Example:

```
	Stack Name [sam-app]: dinolab-ask-service
	AWS Region [us-east-1]: us-east-1
	Confirm changes before deploy [y/N]: y
	Allow SAM CLI IAM role creation [Y/n]: y
	Save parameters to samconfig.toml [Y/n]: y
```

After deployment, SAM will output:
- **Stack ARN**: The AWS CloudFormation stack identifier
- **API Endpoint**: The URL of your deployed API (e.g., `https://abcd1234.execute-api.us-east-1.amazonaws.com/Prod`)

**Save the API Endpoint URL** — you will need it in Step 4.

### Step 4: Verify Deployment

Test your deployed API:

```bash
curl https://your-api-endpoint/ask
```

You should receive a response from your Lambda function.

### Step 5: Future Deployments

For subsequent deployments, use:

```bash
sam deploy
```

SAM will use the saved `samconfig.toml` configuration.

---

## Setting Environment Variables for the Cloud Function

### Option 1: Update template.yaml

Edit `dinolab/infra/template.yaml` and add environment variables to the Lambda function definition:

```yaml
Resources:
  AskFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs18.x
      CodeUri: ../ask-service/
      Environment:
        Variables:
          NODE_ENV: production
          API_KEY: your-api-key-here
          LOG_LEVEL: info
```

Then rebuild and redeploy:

```bash
sam build
sam deploy
```

### Option 2: Update via AWS Console

1. Open the [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Find your function (e.g., `dinolab-ask-service-AskFunction`)
3. Click the function name
4. Scroll to **Environment variables**
5. Click **Edit**
6. Add your variables (e.g., `API_KEY`, `LOG_LEVEL`)
7. Click **Save**

### Option 3: Update via AWS CLI

```bash
aws lambda update-function-configuration \
  --function-name dinolab-ask-service-AskFunction \
  --environment Variables={NODE_ENV=production,API_KEY=your-api-key,LOG_LEVEL=info} \
  --region us-east-1
```

---

## Update dinolab/web/.env with Deployed API Endpoint

After deployment, update your web application's environment variables.

### Step 1: Get the API Endpoint

If you saved it from deployment, skip to Step 2. Otherwise, retrieve it:

```bash
aws cloudformation describe-stacks \
  --stack-name dinolab-ask-service \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

This returns your API endpoint URL (e.g., `https://abcd1234.execute-api.us-east-1.amazonaws.com/Prod`).

### Step 2: Update .env File

Open `dinolab/web/.env` and update:

```bash
# Local development (default)
REACT_APP_ASK_API=http://localhost:3001

# After deploying to AWS, change to:
REACT_APP_ASK_API=https://your-api-endpoint/Prod
```

Replace `https://your-api-endpoint/Prod` with your actual endpoint.

### Step 3: Rebuild and Restart Web Application

```bash
cd dinolab/web
npm install
npm start
```

Your web application will now communicate with the deployed Lambda function.

---

## Security Considerations

### 1. API Key Protection

**Problem**: Your API Gateway endpoint is publicly accessible and can be called by anyone.

**Solution**: Implement API key authentication.

#### Add API Key to template.yaml:

```yaml
Resources:
  ApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Enabled: true
      Name: dinolab-ask-api-key
      StageKeys:
        - RestApiId: !Ref AskApi
          StageName: Prod

  ApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      ApiStages:
        - ApiId: !Ref AskApi
          Stage: Prod
      ApiKeyIds:
        - !Ref ApiKey
      Throttle:
        BurstLimit: 100
        RateLimit: 10
```

Retrieve your API key:

```bash
aws apigateway get-api-keys --region us-east-1 --query 'items[0].value' --output text
```

Update your web application to include the API key in requests:

```javascript
fetch(process.env.REACT_APP_ASK_API + '/ask', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.REACT_APP_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

### 2. CORS Configuration

**Problem**: Your API is accessible from any domain, which can lead to unauthorized cross-origin requests.

**Solution**: Configure CORS to allow only your domain.

#### Add CORS to template.yaml:

```yaml
Resources:
  AskFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs18.x
      CodeUri: ../ask-service/
      Policies:
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action: logs:*
              Resource: arn:aws:logs:*:*:*

  AskApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: dinolab-ask-api
      EndpointConfiguration:
        Types:
          - REGIONAL

  AskResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref AskApi
      ParentId: !GetAtt AskApi.RootResourceId
      PathPart: ask

  AskMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref AskApi
      ResourceId: !Ref AskResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${AskFunction.Arn}/invocations
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true
            method.response.header.Access-Control-Allow-Origin: true

  AskOptionsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref AskApi
      ResourceId: !Ref AskResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Methods: "'POST,OPTIONS'"
              method.response.header.Access-Control-Allow-Origin: "'https://your-domain.com'"
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true
            method.response.header.Access-Control-Allow-Origin: true
```

Replace `'https://your-domain.com'` with your actual web application domain.

### 3. Lambda Function Best Practices

- **Minimize permissions**: Use least-privilege IAM policies
- **Encrypt sensitive data**: Use AWS Secrets Manager or Systems Manager Parameter Store
- **Enable logging**: Configure CloudWatch Logs for debugging
- **Set timeouts**: Prevent runaway executions (default: 3 seconds, max: 15 minutes)
- **Use VPC if needed**: Connect to private databases or resources

---

## Rollback Instructions

### Rollback via AWS Console

1. Open the [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation)
2. Find your stack (e.g., `dinolab-ask-service`)
3. Click the stack name
4. Click **Stack actions** → **Continue update rollback** or **Delete stack**
5. Confirm the action

### Rollback via AWS CLI

**To rollback to the previous version:**

```bash
aws cloudformation cancel-update-stack \
  --stack-name dinolab-ask-service \
  --region us-east-1
```

**To delete the entire stack (full rollback):**

```bash
aws cloudformation delete-stack \
  --stack-name dinolab-ask-service \
  --region us-east-1
```

**To verify stack deletion:**

```bash
aws cloudformation describe-stacks \
  --stack-name dinolab-ask-service \
  --region us-east-1
```

You should see an error indicating the stack no longer exists.

### Rollback via SAM

SAM does not provide a built-in rollback command. Use the AWS CloudFormation commands above.

---

## Decision: Go Live or Stay Local?

### Do you want to go live?

**If YES**, follow these steps:

1. **Complete Prerequisites** — Install AWS CLI, SAM CLI, and configure your AWS account
2. **Build and Deploy** — Run `sam build` and `sam deploy --guided`
3. **Configure Environment Variables** — Set API keys, log levels, and other settings
4. **Update Web Application** — Add the API endpoint to `dinolab/web/.env`
5. **Test and Monitor** — Verify the deployment works and monitor CloudWatch Logs

Your ask service will be live on AWS Lambda and accessible via API Gateway.

**If NO**, use the local server:

```bash
cd dinolab/ask-service
npm install
npm start
```

The local server runs on `http://localhost:3001` and does not require AWS credentials or deployment.

---

## Troubleshooting

### Common Issues

**Issue**: `sam: command not found`
- **Solution**: Reinstall SAM CLI or ensure it is in your PATH

**Issue**: `An error occurred (AccessDenied) when calling the CreateStack operation`
- **Solution**: Verify your AWS IAM permissions include Lambda, API Gateway, and CloudFormation

**Issue**: `Unable to find the referenced file in the SAM template`
- **Solution**: Ensure the `CodeUri` in `template.yaml` points to the correct directory

**Issue**: API returns 502 Bad Gateway
- **Solution**: Check CloudWatch Logs for Lambda errors: `aws logs tail /aws/lambda/dinolab-ask-service-AskFunction --follow`

**Issue**: CORS errors in browser console
- **Solution**: Verify CORS configuration in `template.yaml` allows your domain

---

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)

---

**Last Updated**: 2024
