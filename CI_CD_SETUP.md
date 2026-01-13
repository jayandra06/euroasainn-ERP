# CI/CD Setup Guide - Automatic Deployment

This guide will help you set up automatic deployment from GitHub to your VPS server.

## 🎯 Overview

When you push changes to the `main` branch, GitHub Actions will:
1. Build your application
2. Upload it to your VPS
3. Install dependencies
4. Restart the application
5. Verify deployment

## 📋 Prerequisites

- ✅ GitHub repository: https://github.com/jayandra06/euroasainn-ERP
- ✅ VPS server: 147.93.102.82
- ✅ Server setup completed (Node.js, PM2, Nginx installed)

## 🔑 Step 1: Generate SSH Key for GitHub Actions

**On your local Windows machine**, open PowerShell and run:

```powershell
cd c:\dev\euroasiann\euroasainn-ERP
bash deploy/setup-ssh-key.sh
```

**Or manually generate the key:**

```powershell
# Generate SSH key
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\github_actions_deploy -N '""' -C "github-actions-deploy"

# Display public key (copy this)
Get-Content $env:USERPROFILE\.ssh\github_actions_deploy.pub
```

## 🔐 Step 2: Add Public Key to Server

**SSH to your server:**

```bash
ssh root@147.93.102.82
```

**Add the public key to authorized_keys:**

```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add the public key (paste the key from Step 1)
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

**Test SSH connection (from your local machine):**

```powershell
ssh -i $env:USERPROFILE\.ssh\github_actions_deploy root@147.93.102.82
```

If it connects without a password, you're good!

## 🔒 Step 3: Add Private Key to GitHub Secrets

1. **Go to your GitHub repository**: https://github.com/jayandra06/euroasainn-ERP
2. **Click**: Settings → Secrets and variables → Actions
3. **Click**: New repository secret
4. **Add the following secrets:**

### Required Secrets:

**SSH_PRIVATE_KEY**
- Name: `SSH_PRIVATE_KEY`
- Value: Copy the entire contents of `~/.ssh/github_actions_deploy` (the private key)
- To get it on Windows:
  ```powershell
  Get-Content $env:USERPROFILE\.ssh\github_actions_deploy
  ```

**Optional (if you want to use environment variables):**

- `SERVER_HOST`: `147.93.102.82`
- `SERVER_USER`: `root`
- `APP_DIR`: `/var/www/euroasiann-erp`

## ✅ Step 4: Verify Workflow File

The workflow file is already created at `.github/workflows/deploy.yml`

It will:
- Trigger on push to `main` or `master` branch
- Build the API
- Deploy to your server
- Restart PM2

## 🚀 Step 5: Test Deployment

**Push a test change:**

```bash
git add .
git commit -m "Test CI/CD deployment"
git push origin main
```

**Monitor the deployment:**

1. Go to: https://github.com/jayandra06/euroasainn-ERP/actions
2. Click on the running workflow
3. Watch the deployment progress

## 📊 Deployment Workflow Details

The workflow (`deploy.yml`) performs these steps:

1. **Checkout code** - Gets latest code from GitHub
2. **Setup Node.js** - Installs Node.js 18
3. **Install dependencies** - Runs `npm ci` in `apps/api`
4. **Build API** - Runs `npm run build`
5. **Setup SSH** - Configures SSH key for server access
6. **Create deployment package** - Packages built files
7. **Create backup** - Backs up existing deployment
8. **Upload files** - Uploads to `/var/www/euroasiann-erp/`
9. **Install dependencies** - Runs `npm install --production` on server
10. **Restart application** - Restarts PM2 process
11. **Verify deployment** - Checks health endpoint

## 🔍 Troubleshooting

### SSH Connection Fails

**Check:**
1. Public key is in `~/.ssh/authorized_keys` on server
2. Permissions are correct: `chmod 600 ~/.ssh/authorized_keys`
3. Private key is correctly added to GitHub Secrets

**Test manually:**
```bash
ssh -i ~/.ssh/github_actions_deploy root@147.93.102.82
```

### Deployment Fails

**Check GitHub Actions logs:**
- Go to: https://github.com/jayandra06/euroasainn-ERP/actions
- Click on failed workflow
- Check error messages

**Common issues:**
- Build errors: Check `apps/api` for TypeScript errors
- SSH connection: Verify SSH key setup
- PM2 not found: Ensure PM2 is installed on server
- Port in use: Check if application is already running

### Application Not Starting

**On server, check logs:**
```bash
pm2 logs euroasiann-api
```

**Check if port is available:**
```bash
netstat -tulpn | grep 3000
```

## 🔄 Manual Deployment

If you need to deploy manually:

```bash
# On your local machine
cd apps/api
npm run build

# Upload to server
scp -r dist root@147.93.102.82:/var/www/euroasiann-erp/apps/api/

# On server
ssh root@147.93.102.82
cd /var/www/euroasiann-erp/apps/api
npm install --production
cd /var/www/euroasiann-erp
pm2 restart euroasiann-api
```

## 📝 Environment Variables

Make sure your `.env` file on the server is configured:

```bash
ssh root@147.93.102.82
nano /var/www/euroasiann-erp/.env
```

## 🎉 Success Indicators

You'll know CI/CD is working when:
- ✅ GitHub Actions workflow completes successfully
- ✅ Application restarts automatically
- ✅ Health endpoint responds: `curl http://localhost:3000/health`
- ✅ Domain works: `https://erp.euroasianngroup.com/api/v1/health`

## 🔐 Security Notes

1. **Never commit SSH keys** to the repository
2. **Use GitHub Secrets** for sensitive data
3. **Rotate SSH keys** periodically
4. **Limit SSH access** to specific IPs if possible
5. **Monitor deployments** regularly

## 📞 Quick Reference

**GitHub Actions:**
- View workflows: https://github.com/jayandra06/euroasainn-ERP/actions
- Workflow file: `.github/workflows/deploy.yml`

**Server:**
- SSH: `ssh root@147.93.102.82`
- App directory: `/var/www/euroasiann-erp`
- PM2 logs: `pm2 logs euroasiann-api`

**Deployment triggers:**
- Push to `main` branch
- Manual trigger via GitHub Actions UI
