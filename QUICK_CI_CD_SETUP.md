# 🚀 Quick CI/CD Setup Guide

## Automatic Deployment from GitHub to VPS

When you push to `main` branch, your changes will automatically deploy to `erp.euroasianngroup.com`

## ⚡ Quick Setup (5 minutes)

### Step 1: Generate SSH Key (Windows)

**Open PowerShell** and run:

```powershell
cd c:\dev\euroasiann\euroasainn-ERP
.\deploy\setup-ssh-key.ps1
```

This will show you:
- **Public Key** (add to server)
- **Private Key** (add to GitHub Secrets)

### Step 2: Add Public Key to Server

**SSH to your server:**

```bash
ssh root@147.93.102.82
```

**Add the public key:**

```bash
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_FROM_STEP_1" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**Test connection (from Windows PowerShell):**

```powershell
ssh -i $env:USERPROFILE\.ssh\github_actions_deploy root@147.93.102.82
```

If it connects without password, you're good! ✅

### Step 3: Add Private Key to GitHub

1. **Go to**: https://github.com/jayandra06/euroasainn-ERP/settings/secrets/actions
2. **Click**: "New repository secret"
3. **Add secret**:
   - **Name**: `SSH_PRIVATE_KEY`
   - **Value**: Paste the entire private key from Step 1
4. **Click**: "Add secret"

### Step 4: Push and Deploy!

```bash
git add .
git commit -m "Setup CI/CD"
git push origin main
```

**Watch the deployment:**
- Go to: https://github.com/jayandra06/euroasainn-ERP/actions
- Click on the running workflow
- See your app deploy automatically! 🎉

## ✅ What Happens on Push

1. ✅ Code is checked out
2. ✅ Dependencies installed
3. ✅ Application built
4. ✅ Files uploaded to server
5. ✅ Dependencies installed on server
6. ✅ Application restarted with PM2
7. ✅ Health check verified

## 🔍 Monitor Deployments

**GitHub Actions:**
- View: https://github.com/jayandra06/euroasainn-ERP/actions
- See deployment logs, status, and errors

**Server:**
```bash
ssh root@147.93.102.82
pm2 logs euroasiann-api
pm2 status
```

## 🆘 Troubleshooting

**Deployment fails?**
- Check GitHub Actions logs for errors
- Verify SSH key is correctly set up
- Ensure PM2 is installed on server

**Application not starting?**
```bash
ssh root@147.93.102.82
pm2 logs euroasiann-api --lines 50
```

## 📝 Full Documentation

See `CI_CD_SETUP.md` for detailed instructions.
