# Quick Deployment Guide

## 🚀 Deploy to VPS: erp.euroasianngroup.com

### Step 1: Initial Server Setup (One-time only)

**Connect to server:**
```bash
ssh root@147.93.102.82
# Password: Euroasiann@1234
```

**Run setup script:**
```bash
# On the server, download and run:
curl -o /tmp/server-setup.sh https://raw.githubusercontent.com/your-repo/deploy/server-setup.sh
# OR upload the file manually using WinSCP/SFTP

chmod +x /tmp/server-setup.sh
/tmp/server-setup.sh
```

This will install:
- Node.js 18
- PM2 (process manager)
- Nginx (web server)
- MongoDB & Redis
- SSL certificate (Let's Encrypt)

### Step 2: Configure Environment Variables

On the server:
```bash
nano /var/www/euroasiann-erp/.env
```

Add your configuration (see `.env.example` for reference).

### Step 3: Deploy Application

**Option A: Using deployment script (Linux/Mac)**

```bash
# Make script executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh
```

**Option B: Manual deployment**

1. **Build locally:**
   ```bash
   cd apps/api
   npm run build
   cd ../..
   ```

2. **Upload to server** (using WinSCP, FileZilla, or SCP):
   - Upload `apps/api/dist/*` → `/var/www/euroasiann-erp/apps/api/dist/`
   - Upload `apps/api/package.json` → `/var/www/euroasiann-erp/apps/api/`

3. **On server, install dependencies:**
   ```bash
   ssh root@147.93.102.82
   cd /var/www/euroasiann-erp/apps/api
   npm install --production
   ```

4. **Start application:**
   ```bash
   cd /var/www/euroasiann-erp
   pm2 start deploy/pm2.config.js
   pm2 save
   ```

### Step 4: Verify Deployment

```bash
# Check if app is running
pm2 status

# Check logs
pm2 logs euroasiann-api

# Test API
curl https://erp.euroasianngroup.com/api/v1/health
```

## 🔄 Updating Application

After making changes:

```bash
# Build
cd apps/api
npm run build

# Upload dist folder to server
# Then on server:
pm2 restart euroasiann-api
```

## 📝 Important Files

- **Deployment script**: `deploy/deploy.sh`
- **Server setup**: `deploy/server-setup.sh`
- **PM2 config**: `deploy/pm2.config.js`
- **Nginx config**: `deploy/nginx.conf`
- **Full guide**: `DEPLOYMENT.md`

## 🆘 Troubleshooting

**Application not starting?**
```bash
pm2 logs euroasiann-api --lines 50
```

**Nginx issues?**
```bash
nginx -t
systemctl reload nginx
```

**Check if port is in use:**
```bash
netstat -tulpn | grep 3000
```

## 🔐 Security Note

⚠️ **Important**: After first deployment, consider:
1. Setting up SSH keys (instead of password)
2. Changing default passwords
3. Configuring firewall rules
4. Setting up automated backups
