# CI/CD Setup Guide

## 🎯 What You Get

Complete automated CI/CD pipeline that:
- ✅ Tests your code automatically
- ✅ Builds all applications
- ✅ Deploys API to your server
- ✅ Deploys frontends to Vercel
- ✅ All on every push to main!

---

## 📋 Setup Checklist

### 1. GitHub Secrets (Required)

Go to: **Repository → Settings → Secrets and variables → Actions**

#### For API Deployment:
- [ ] `DEPLOY_HOST` - Your server IP address
- [ ] `DEPLOY_USER` - SSH username (e.g., `ubuntu`)
- [ ] `DEPLOY_SSH_KEY` - Your private SSH key
- [ ] `DEPLOY_PORT` - SSH port (default: `22`)

#### For Frontend Deployment:
- [ ] `VERCEL_TOKEN` - Get from Vercel → Settings → Tokens
- [ ] `VERCEL_ORG_ID` - Get from Vercel → Settings → General (Team ID)
- [ ] `VERCEL_VENDOR_PROJECT_ID` - Vendor portal project ID
- [ ] `VERCEL_CUSTOMER_PROJECT_ID` - Customer portal project ID
- [ ] `VERCEL_ADMIN_PROJECT_ID` - Admin portal project ID
- [ ] `VERCEL_TECH_PROJECT_ID` - Tech portal project ID

---

## 🔑 How to Get Secrets

### SSH Key for API Deployment

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -C "github-actions"

# Copy public key to server
ssh-copy-id user@your-server-ip

# Get private key for GitHub secret
cat ~/.ssh/id_rsa
# Copy the entire output (starts with -----BEGIN RSA PRIVATE KEY-----)
```

### Vercel Secrets

1. **VERCEL_TOKEN:**
   - Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Click "Create Token"
   - Name it: `github-actions`
   - Copy the token

2. **VERCEL_ORG_ID:**
   - Go to Vercel → Settings → General
   - Find "Team ID" (this is your Org ID)

3. **Project IDs:**
   - Create projects in Vercel (one per portal)
   - Go to each project → Settings → General
   - Copy "Project ID" (looks like: `prj_xxxxxxxxxxxxx`)

---

## 🚀 How It Works

### Automatic Deployment Flow

```
1. You push code to GitHub
   ↓
2. CI Pipeline runs (lint, test, build)
   ↓
3. If push to main/master:
   ↓
4. API deploys to server via SSH
   ↓
5. Frontends deploy to Vercel
   ↓
6. Everything is live! 🎉
```

### Workflow Files

1. **`ci.yml`** - Runs on every push/PR
   - Lints code
   - Runs tests
   - Builds applications

2. **`deploy-api.yml`** - Deploys API only
   - Triggers when API code changes
   - Deploys to server via SSH
   - Restarts PM2

3. **`deploy-frontend.yml`** - Deploys frontends only
   - Triggers when frontend code changes
   - Deploys all 4 portals to Vercel

4. **`deploy.yml`** - Full deployment
   - Runs CI checks
   - Deploys API
   - Deploys all frontends
   - One workflow for everything!

---

## 📝 First Time Setup

### Step 1: Prepare Server

```bash
# SSH to your server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create directory
sudo mkdir -p /var/www/euroasiann-erp/api
sudo chown -R $USER:$USER /var/www/euroasiann-erp
```

### Step 2: Create .env on Server

```bash
cd /var/www/euroasiann-erp/api
nano .env
```

Add:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://...
REDIS_HOST=...
REDIS_PORT=6379
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

### Step 3: Create Vercel Projects

1. Go to [vercel.com](https://vercel.com)
2. Create 4 projects (one per portal)
3. For each:
   - Root Directory: `apps/vendor-portal` (or respective)
   - Framework: Vite
   - Build: `npm run build`
   - Output: `dist`
4. Get Project IDs from Settings

### Step 4: Add GitHub Secrets

Add all secrets listed in the checklist above.

### Step 5: Push to GitHub!

```bash
git add .
git commit -m "Add CI/CD workflows"
git push origin main
```

---

## ✅ Verify Deployment

### Check API
```bash
ssh user@your-server-ip
pm2 status
pm2 logs euroasiann-api
```

### Check Frontends
- Go to Vercel dashboard
- Check deployment status
- Visit deployed URLs

---

## 🔄 Update Process

### To Update Code:

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. GitHub Actions automatically:
   - Runs CI checks
   - Deploys if on main branch
   - Updates live application

### Manual Deployment:

1. Go to **Actions** tab
2. Select workflow
3. Click **Run workflow**
4. Choose branch
5. Click **Run workflow**

---

## 🆘 Troubleshooting

### "Deployment failed - SSH connection error"
- Check `DEPLOY_HOST` is correct
- Verify SSH key is valid
- Test SSH connection manually
- Check firewall settings

### "Deployment failed - Vercel error"
- Verify `VERCEL_TOKEN` is valid
- Check project IDs are correct
- Ensure projects exist in Vercel
- Review Vercel dashboard for errors

### "Build failed"
- Check for TypeScript errors
- Verify all dependencies installed
- Review build logs in Actions tab

### "PM2 not found on server"
```bash
ssh user@your-server-ip
sudo npm install -g pm2
```

---

## 📊 Monitoring

### GitHub Actions
- Go to **Actions** tab
- See all workflow runs
- View logs and errors

### Server (API)
```bash
pm2 status
pm2 logs euroasiann-api
pm2 monit
```

### Vercel (Frontends)
- Go to Vercel dashboard
- View deployment history
- Check logs and analytics

---

## 🎉 You're All Set!

Once configured, every push to main will:
1. ✅ Test your code
2. ✅ Build applications
3. ✅ Deploy API to server
4. ✅ Deploy frontends to Vercel

**No manual steps needed!** 🚀

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
