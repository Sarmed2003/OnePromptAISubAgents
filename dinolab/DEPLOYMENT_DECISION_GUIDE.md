# Deployment Decision Guide

Welcome! This guide helps you decide how to run and share your dinolab project. We offer three workflows, each with different complexity and reach.

## Quick Decision Tree

```
Do you want to publish your site live on the internet?
├─ YES → See GOING_LIVE.md for production deployment steps
└─ NO  → Your local site is ready to explore!
         (You can always deploy later)
```

---

## Overview: Three Workflows

| Workflow | Purpose | Hosting | Time | Best For |
|----------|---------|---------|------|----------|
| **Local Testing** | Develop and explore locally | Your computer | 5 min | Learning, development, testing |
| **Staging** | Test in a cloud environment | Test cloud (optional) | 15–30 min | Validating before going live |
| **Production** | Publish live to the internet | Vercel (web) + AWS (infra) | 30–60 min | Sharing with others, going live |

---

## Workflow 1: Local Testing (Recommended Starting Point)

**Status:** ✅ **Required & Complete**  
**Time Estimate:** 5 minutes  
**Complexity:** Minimal

Local testing lets you run dinolab on your own computer. No internet required. Perfect for learning and development.

### What You Get
- Full dinolab experience on `http://localhost:3000`
- Hot reload (changes appear instantly)
- No deployment needed
- All features available

### Setup Commands

```bash
# 1. Navigate to the web directory
cd dinolab/web

# 2. Install dependencies (first time only)
npm install

# 3. Start the development server
npm run dev

# 4. Open your browser
# Visit http://localhost:3000
```

### Expected Output

You should see:
```
  ➜  Local:   http://localhost:3000/
  ➜  press h + enter to show help
```

### Stopping the Server

Press `Ctrl+C` in your terminal.

### Rollback

No rollback needed—just stop the server and start again with `npm run dev`.

### When to Ask for Help

- **"Port 3000 is already in use"** → Try `npm run dev -- --port 3001` or kill the process using that port
- **"npm: command not found"** → Install Node.js from https://nodejs.org/
- **"Module not found"** → Run `npm install` again
- **"Changes aren't showing up"** → Check that the file is saved; refresh your browser
- **Other issues** → Check the terminal for error messages and share them when asking for help

---

## Workflow 2: Staging (Optional)

**Status:** 🟡 **Optional**  
**Time Estimate:** 15–30 minutes  
**Complexity:** Moderate  
**Prerequisites:** Local testing working

Staging lets you test dinolab in a cloud environment before going fully live. Use this to validate that everything works in the cloud.

### When to Use Staging

- You want to test cloud deployment before going live
- You need to validate performance in a real cloud environment
- You want to share a temporary link with collaborators for feedback

### Setup: Deploy to a Staging Service

We recommend **Vercel** for staging (same service as production, but on a preview branch):

```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Navigate to the web directory
cd dinolab/web

# 3. Deploy to staging
vercel --prod=false

# 4. Follow the prompts and confirm the deployment
```

### Expected Output

Vercel will provide a preview URL:
```
✓ Preview: https://dinolab-staging-abc123.vercel.app
```

Visit this URL to test your site in the cloud.

### Rollback

To revert a staging deployment:

```bash
# 1. Navigate to the web directory
cd dinolab/web

# 2. Remove the staging deployment from Vercel dashboard
# (https://vercel.com/dashboard) or use CLI:
vercel remove
```

### When to Ask for Help

- **"Vercel CLI not found"** → Run `npm install -g vercel` first
- **"Deployment failed"** → Check Vercel logs in the dashboard
- **"Site is slow or broken"** → Compare with local testing; check for environment variable issues
- **Other issues** → Share the Vercel deployment URL and error message

---

## Workflow 3: Production (Going Live)

**Status:** 🔴 **Optional but Permanent**  
**Time Estimate:** 30–60 minutes  
**Complexity:** Advanced  
**Prerequisites:** Local testing + staging (optional but recommended)

Production deployment makes dinolab live on the internet for everyone to access.

### Components

- **dinolab/web** → Hosted on **Vercel** (frontend)
- **dinolab/infra** → Hosted on **AWS** (backend/infrastructure)

### ⚠️ Important Notes

- Production deployments are **permanent and public**
- Changes go live immediately
- Costs may apply (AWS, Vercel)
- Rollback requires manual steps

### Setup Commands

**For the web (Vercel):**

```bash
# 1. Navigate to the web directory
cd dinolab/web

# 2. Install Vercel CLI
npm install -g vercel

# 3. Deploy to production
vercel --prod

# 4. Confirm when prompted
```

**For infrastructure (AWS):**

```bash
# 1. Navigate to the infra directory
cd dinolab/infra

# 2. Install AWS CLI (if not already installed)
# See: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

# 3. Configure AWS credentials
aws configure

# 4. Deploy using your infrastructure tool (e.g., Terraform, CloudFormation)
# Example with Terraform:
terraform init
terraform plan
terraform apply
```

### Expected Output

**Vercel:**
```
✓ Production: https://dinolab.vercel.app
```

**AWS:**
```
Apply complete! Resources: X added, Y changed, Z destroyed.
```

### Rollback Steps

**For Vercel (web):**

```bash
# 1. Go to Vercel dashboard: https://vercel.com/dashboard
# 2. Select your project
# 3. Go to "Deployments"
# 4. Click the three dots on the previous deployment
# 5. Select "Promote to Production"
```

**For AWS (infrastructure):**

```bash
# 1. Navigate to the infra directory
cd dinolab/infra

# 2. Revert to the previous state (if using Terraform)
terraform destroy  # Carefully review what will be destroyed!

# 3. Or manually restore from backups in AWS Console
```

### When to Ask for Help

- **"I don't have AWS credentials"** → Contact your DevOps team or AWS administrator
- **"Vercel deployment failed"** → Check build logs in the Vercel dashboard
- **"AWS resources are failing"** → Check CloudWatch logs and AWS Console
- **"I need to rollback but I'm not sure how"** → Stop and ask before making changes
- **"Costs are higher than expected"** → Review AWS billing and optimize resources
- **Other issues** → Provide error messages, deployment URLs, and what you were trying to do

---

## Decision: What Should I Do?

### Scenario 1: "I just want to learn and explore"

✅ **Use Workflow 1: Local Testing**

- Run `npm run dev` in `dinolab/web`
- Visit `http://localhost:3000`
- Done! Everything is ready

### Scenario 2: "I want to test in the cloud first"

✅ **Use Workflows 1 + 2: Local Testing + Staging**

1. Test locally (Workflow 1)
2. Deploy to staging (Workflow 2)
3. Validate in the cloud
4. Decide if you want to go live (see Scenario 3)

### Scenario 3: "I'm ready to publish live"

✅ **Use Workflow 3: Production**

- **First:** Make sure local testing works (Workflow 1)
- **Optional:** Test in staging (Workflow 2)
- **Then:** See [GOING_LIVE.md](GOING_LIVE.md) for production deployment

---

## Summary

| Step | Required? | Time | Command |
|------|-----------|------|----------|
| Local Testing | ✅ Yes | 5 min | `npm run dev` |
| Staging | 🟡 Optional | 15–30 min | `vercel --prod=false` |
| Production | 🟡 Optional | 30–60 min | See [GOING_LIVE.md](GOING_LIVE.md) |

---

## Next Steps

1. **Start here:** Run local testing (Workflow 1)
2. **Then decide:** Do you want to publish live?
   - **No?** Your local site is ready to explore. You can always deploy later.
   - **Yes?** See [GOING_LIVE.md](GOING_LIVE.md) for production deployment.

---

## Troubleshooting

### General Tips

1. **Check your Node.js version:** `node --version` (should be v16+)
2. **Check npm:** `npm --version`
3. **Clear cache:** `npm cache clean --force`
4. **Reinstall dependencies:** `rm -rf node_modules && npm install`
5. **Check for port conflicts:** `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)

### Getting Help

- Check error messages in the terminal
- Search for the error message online
- Ask in your team Slack or discussion channel
- Include: error message, command you ran, and what you were trying to do

---

**Ready?** Start with [Workflow 1: Local Testing](#workflow-1-local-testing-recommended-starting-point).
