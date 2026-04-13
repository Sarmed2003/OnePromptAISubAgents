# Going Live: Publishing dinolab/web

> **Note:** Deployment to a hosting service is **optional** and separate from local development and testing. You can develop and test dinolab/web entirely locally without deploying to the internet.

---

## Table of Contents

1. [Pre-flight Checks](#pre-flight-checks)
2. [Environment Variable Setup](#environment-variable-setup)
3. [Deployment Services](#deployment-services)
   - [Vercel](#vercel)
   - [Netlify](#netlify)
   - [GitHub Pages](#github-pages)
4. [Post-Deploy Verification](#post-deploy-verification)
5. [Troubleshooting](#troubleshooting)

---

## Pre-flight Checks

Before deploying to any hosting service, ensure your local build is working:

### Checklist

- [ ] Node.js version 18+ is installed: `node --version`
- [ ] Dependencies are installed: `npm install` (or `yarn install`)
- [ ] Local build succeeds without errors:
  ```bash
  npm run build
  ```
  The `dist/` folder should be created with no build errors.
- [ ] Local dev server runs: `npm run dev` and the app loads in your browser
- [ ] All tests pass (if applicable): `npm test`
- [ ] No console errors in the browser's developer tools
- [ ] You have access to your deployed Lambda function URL (for `VITE_RESEARCH_API_URL`)

---

## Environment Variable Setup

The dinolab/web application requires the `VITE_RESEARCH_API_URL` environment variable to communicate with your deployed Lambda backend.

### What You Need

1. **Lambda Deployment URL**: The HTTP endpoint of your deployed Lambda function (e.g., `https://your-lambda-id.lambda-url.us-east-1.on.aws/`)
2. **Environment Variable Name**: `VITE_RESEARCH_API_URL`
3. **Value**: The full URL to your Lambda function

### How to Find Your Lambda URL

1. Go to the AWS Lambda console
2. Select your deployed function
3. Click the **Function URL** tab
4. Copy the URL (it should look like `https://xxxxx.lambda-url.region.on.aws/`)

### Setting Environment Variables

Each hosting service has a different method for setting environment variables. See the service-specific instructions below.

---

## Deployment Services

### Vercel

Vercel is optimized for Vite and Next.js applications and offers seamless integration with Git.

#### Step 1: Connect Your Repository

1. Go to [vercel.com](https://vercel.com) and sign in (or create a free account)
2. Click **Add New Project**
3. Select **Import Git Repository**
4. Connect your GitHub/GitLab/Bitbucket account
5. Select the repository containing dinolab/web
6. Click **Import**

#### Step 2: Configure Project Settings

1. **Framework Preset**: Select "Vite"
2. **Root Directory**: Set to `dinolab/web` (if your monorepo structure requires it)
3. **Build Command**: Leave as default (Vercel auto-detects `npm run build`)
4. **Output Directory**: Leave as default (Vercel auto-detects `dist`)

#### Step 3: Add Environment Variables

1. In the project settings, go to **Settings → Environment Variables**
2. Add a new variable:
   - **Name**: `VITE_RESEARCH_API_URL`
   - **Value**: Your Lambda URL (e.g., `https://xxxxx.lambda-url.us-east-1.on.aws/`)
   - **Environments**: Select all (Production, Preview, Development)
3. Click **Save**

#### Step 4: Deploy

1. Click **Deploy**
2. Vercel will automatically build and deploy your application
3. Wait for the build to complete (usually 1-2 minutes)
4. You'll receive a deployment URL (e.g., `https://dinolab-web.vercel.app`)

#### Continuous Deployment

After the initial deployment, any push to your main branch will trigger an automatic deployment.

---

### Netlify

Netlify offers a simple drag-and-drop interface and powerful build controls.

#### Step 1: Connect Your Repository

1. Go to [netlify.com](https://netlify.com) and sign in (or create a free account)
2. Click **Add new site → Import an existing project**
3. Choose your Git provider (GitHub, GitLab, Bitbucket)
4. Authorize Netlify to access your repositories
5. Select the repository containing dinolab/web
6. Click **Deploy site**

#### Step 2: Configure Build Settings

Netlify should auto-detect your build settings. If not, configure manually:

1. Go to **Site settings → Build & deploy → Build command**
2. Set **Build command** to: `npm run build`
3. Set **Publish directory** to: `dist` (or `dinolab/web/dist` if in a monorepo)

#### Step 3: Add Environment Variables

1. Go to **Site settings → Build & deploy → Environment**
2. Click **Edit variables**
3. Add a new variable:
   - **Key**: `VITE_RESEARCH_API_URL`
   - **Value**: Your Lambda URL (e.g., `https://xxxxx.lambda-url.us-east-1.on.aws/`)
4. Click **Save**
5. **Important**: Trigger a redeploy for the environment variables to take effect
   - Go to **Deploys** and click **Trigger deploy → Deploy site**

#### Step 4: Deploy

1. Netlify will automatically build and deploy your site
2. Once complete, you'll receive a deployment URL (e.g., `https://dinolab-web.netlify.app`)

#### Continuous Deployment

Any push to your connected branch will trigger an automatic rebuild and deployment.

---

### GitHub Pages

GitHub Pages is free and works well for static sites. It requires a GitHub Actions workflow.

#### Step 1: Create a GitHub Actions Workflow

1. In your repository, create the directory: `.github/workflows/`
2. Create a file: `.github/workflows/deploy.yml`
3. Add the following content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main  # Change to your default branch if different

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          VITE_RESEARCH_API_URL: ${{ secrets.VITE_RESEARCH_API_URL }}

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

#### Step 2: Add Secrets to GitHub

1. Go to your repository **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Create a secret:
   - **Name**: `VITE_RESEARCH_API_URL`
   - **Value**: Your Lambda URL (e.g., `https://xxxxx.lambda-url.us-east-1.on.aws/`)
4. Click **Add secret**

#### Step 3: Configure GitHub Pages

1. Go to **Settings → Pages**
2. Under **Build and deployment**, select:
   - **Source**: GitHub Actions
3. Click **Save**

#### Step 4: Deploy

1. Commit and push the workflow file:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Pages deployment workflow"
   git push origin main
   ```
2. GitHub Actions will automatically run the workflow
3. Once complete, your site will be available at: `https://<username>.github.io/<repository>/`
   - Or if you're using a custom domain, it will be available at that domain

#### Continuous Deployment

Any push to your main branch will trigger the workflow and redeploy your site.

---

## Post-Deploy Verification

After deploying to any service, verify that your application is working correctly:

### Checklist

- [ ] **Site is accessible**: Visit your deployment URL in a browser
- [ ] **No 404 errors**: All pages load without 404 errors
- [ ] **API connectivity**: Test that the application can reach your Lambda backend
  - Open the browser's **Network** tab (F12 → Network)
  - Interact with features that call the Lambda API
  - Verify that API calls return 200 status codes (not 404, 500, etc.)
- [ ] **Environment variables are correct**: Check that `VITE_RESEARCH_API_URL` is set
  - In the browser console, you can sometimes inspect environment variables via the app's state
  - Or check the network requests to see if they're going to the correct Lambda URL
- [ ] **No console errors**: Open browser DevTools (F12) and check the Console tab for errors
- [ ] **CSS and images load**: Verify that styling and images are displayed correctly
- [ ] **Mobile responsiveness**: Test on a mobile device or use browser DevTools to simulate mobile

### Debugging Failed Deployments

If your deployment doesn't work:

1. **Check build logs**: Each service shows build logs. Look for errors during the build phase.
2. **Verify environment variables**: Ensure `VITE_RESEARCH_API_URL` is set correctly in your hosting service's settings.
3. **Test API connectivity**: Verify that your Lambda function is deployed and accessible from the internet.
4. **Check CORS settings**: If API calls are failing, ensure your Lambda function has CORS enabled.
5. **Review local build**: Run `npm run build` locally to ensure the build succeeds.

---

## Troubleshooting

### Common Issues

#### Build Fails: "VITE_RESEARCH_API_URL is not defined"

**Solution**: Ensure the environment variable is set in your hosting service before deploying. For GitHub Pages, make sure the secret is created and referenced in the workflow file.

#### API calls return 404 or CORS errors

**Solution**: 
1. Verify your Lambda URL is correct
2. Ensure your Lambda function has CORS enabled
3. Check that your Lambda function is actually deployed and accessible

#### Site shows blank page or 404

**Solution**:
1. Check the hosting service's build logs for errors
2. Verify the publish/output directory is set correctly (should be `dist`)
3. For GitHub Pages, ensure the workflow file is correct and the site is configured to use GitHub Actions as the source

#### Environment variables not taking effect

**Solution**:
1. For Vercel/Netlify: Redeploy the site after adding environment variables
2. For GitHub Pages: Ensure the secret is created and the workflow file references it correctly
3. Clear your browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)

---

## Need Help?

Refer to the service's documentation:
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
