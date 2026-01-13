# CI/CD Workflows

This directory contains GitHub Actions workflows for automated testing, building, and deployment.

## 📋 Available Workflows

### 1. `ci.yml` - Continuous Integration
**Triggers:** Push/PR to main, master, develop

**What it does:**
- ✅ Lints all code
- ✅ Type checks TypeScript
- ✅ Runs API tests
- ✅ Builds all applications
- ✅ Uploads build artifacts

**Use this for:** Validating code quality before merging

---

### 2. `deploy-api.yml` - Deploy API to Server
**Triggers:** 
- Push to main/master (when API code changes)
- Manual trigger (workflow_dispatch)

**What it does:**
- ✅ Builds API
- ✅ Deploys to server via SSH
- ✅ Installs dependencies on server
- ✅ Restarts PM2 process
- ✅ Verifies deployment

**Requirements:**
- GitHub Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PORT`

**Use this for:** Deploying API backend to production server

---

### 3. `deploy-frontend.yml` - Deploy Frontends to Vercel
**Triggers:**
- Push to main/master (when frontend code changes)
- Manual trigger (workflow_dispatch)

**What it does:**
- ✅ Deploys Vendor Portal to Vercel
- ✅ Deploys Customer Portal to Vercel
- ✅ Deploys Admin Portal to Vercel
- ✅ Deploys Tech Portal to Vercel

**Requirements:**
- GitHub Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_VENDOR_PROJECT_ID`, `VERCEL_CUSTOMER_PROJECT_ID`, `VERCEL_ADMIN_PROJECT_ID`, `VERCEL_TECH_PROJECT_ID`

**Use this for:** Deploying all frontend portals to Vercel

---

### 4. `deploy.yml` - Full Deployment Pipeline
**Triggers:**
- Push to main/master
- Manual trigger (workflow_dispatch)

**What it does:**
- ✅ Runs CI checks
- ✅ Deploys API to server
- ✅ Deploys all frontends to Vercel
- ✅ All in one workflow!

**Use this for:** Complete deployment of everything at once

---

## 🚀 Quick Start

### Step 1: Add GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions**

#### For API Deployment (SSH):
```
DEPLOY_HOST=your-server-ip
DEPLOY_USER=ubuntu
DEPLOY_SSH_KEY=your-private-ssh-key
DEPLOY_PORT=22
```

#### For Frontend Deployment (Vercel):
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_VENDOR_PROJECT_ID=prj_xxxxx
VERCEL_CUSTOMER_PROJECT_ID=prj_xxxxx
VERCEL_ADMIN_PROJECT_ID=prj_xxxxx
VERCEL_TECH_PROJECT_ID=prj_xxxxx
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 3: Watch the Magic! ✨

- Go to **Actions** tab
- Watch workflows run automatically
- See deployments happen!

---

## 📊 Workflow Flow

```
Push to GitHub
     ↓
┌─────────────────┐
│   CI Pipeline   │  (Lint, Test, Build)
└────────┬────────┘
         ↓
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────────┐
│ Deploy │ │   Deploy     │
│  API   │ │  Frontends   │
└────────┘ └──────────────┘
    ↓              ↓
  Server        Vercel
```

---

## 🔧 Manual Deployment

You can manually trigger any workflow:

1. Go to **Actions** tab
2. Select the workflow
3. Click **Run workflow**
4. Choose branch
5. Click **Run workflow** button

---

## 🎯 Which Workflow to Use?

| Scenario | Use This Workflow |
|----------|------------------|
| Just testing code | `ci.yml` |
| Deploy only API | `deploy-api.yml` |
| Deploy only frontends | `deploy-frontend.yml` |
| Deploy everything | `deploy.yml` |

---

## 📝 Notes

- **CI runs on:** Every push/PR
- **Deployments run on:** Push to main/master only
- **Manual trigger:** Available for all workflows
- **Path-based triggers:** Only deploy when relevant files change

---

## 🆘 Troubleshooting

### API Deployment Fails
- Check SSH key is correct
- Verify server is accessible
- Check PM2 is installed on server
- Review deployment logs

### Frontend Deployment Fails
- Verify Vercel token is valid
- Check project IDs are correct
- Ensure projects exist in Vercel
- Review Vercel deployment logs

### CI Fails
- Check for linting errors
- Verify TypeScript types
- Review test failures
- Check build errors

---

## ✅ Success Indicators

- ✅ Green checkmark on workflow
- ✅ API running on server (check PM2)
- ✅ Frontends live on Vercel
- ✅ All tests passing
- ✅ No errors in logs

---

**Happy Deploying! 🚀**
