# 🚀 Next Steps - Deploy to Production

## Step-by-Step Deployment Guide

### ✅ Step 1: Initial Server Setup (One-time only)

**1.1 Connect to your VPS:**
```bash
ssh root@147.93.102.82
# Password: Euroasiann@1234
```

**1.2 Upload and run the server setup script:**

**Option A: Using SCP (from your local machine):**
```bash
# Upload the setup script
scp deploy/server-setup.sh root@147.93.102.82:/tmp/

# Connect and run it
ssh root@147.93.102.82
chmod +x /tmp/server-setup.sh
/tmp/server-setup.sh
```

**Option B: Manual upload using WinSCP:**
1. Download WinSCP: https://winscp.net/
2. Connect to: `147.93.102.82` (user: root, password: Euroasiann@1234)
3. Upload `deploy/server-setup.sh` to `/tmp/` on the server
4. SSH to server and run: `chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh`

**This will install:**
- ✅ Node.js 18
- ✅ PM2 (process manager)
- ✅ Nginx (web server)
- ✅ MongoDB & Redis
- ✅ SSL certificate (Let's Encrypt)

**⏱️ Estimated time: 10-15 minutes**

---

### ✅ Step 2: Configure Environment Variables

**2.1 On the server, create `.env` file:**
```bash
ssh root@147.93.102.82
nano /var/www/euroasiann-erp/.env
```

**2.2 Add your production environment variables:**
```env
# Server Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# Database (use your MongoDB Atlas connection string)
MONGODB_URI=mongodb+srv://your-connection-string

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (CHANGE THIS TO A SECURE RANDOM STRING!)
JWT_SECRET=your-super-secret-production-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Jira Integration (if enabled)
JIRA_ENABLED=true
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-token
JIRA_PROJECT_KEY=TEST

# CORS
FRONTEND_URL=https://erp.euroasianngroup.com

# Email Configuration (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**2.3 Save and exit:**
- Press `Ctrl+X`, then `Y`, then `Enter`

**⏱️ Estimated time: 5 minutes**

---

### ✅ Step 3: Deploy Your Application

**Option A: Automated Deployment (Linux/Mac/Git Bash)**

```bash
# From your local project directory
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

**Option B: Manual Deployment (Windows/Any OS)**

**3.1 Build the application locally:**
```bash
cd apps/api
npm run build
cd ../..
```

**3.2 Upload files to server:**

**Using WinSCP:**
1. Connect to `147.93.102.82` (root/Euroasiann@1234)
2. Navigate to `/var/www/euroasiann-erp/` on server
3. Create directories if needed: `apps/api/dist/`
4. Upload:
   - `apps/api/dist/*` → `/var/www/euroasiann-erp/apps/api/dist/`
   - `apps/api/package.json` → `/var/www/euroasiann-erp/apps/api/`
   - `deploy/pm2.config.js` → `/var/www/euroasiann-erp/deploy/`

**Using SCP (command line):**
```bash
# Upload API build
scp -r apps/api/dist root@147.93.102.82:/var/www/euroasiann-erp/apps/api/
scp apps/api/package.json root@147.93.102.82:/var/www/euroasiann-erp/apps/api/

# Upload PM2 config
scp deploy/pm2.config.js root@147.93.102.82:/var/www/euroasiann-erp/deploy/
```

**3.3 On the server, install dependencies:**
```bash
ssh root@147.93.102.82
cd /var/www/euroasiann-erp/apps/api
npm install --production
```

**3.4 Start the application:**
```bash
cd /var/www/euroasiann-erp
pm2 start deploy/pm2.config.js
pm2 save
```

**⏱️ Estimated time: 5-10 minutes**

---

### ✅ Step 4: Verify Deployment

**4.1 Check if application is running:**
```bash
# On server
pm2 status
# Should show "euroasiann-api" as "online"
```

**4.2 Check logs:**
```bash
pm2 logs euroasiann-api
# Look for "Server running on port 3000" or any errors
```

**4.3 Test API health endpoint:**
```bash
# On server
curl http://localhost:3000/health
# Should return: {"status":"ok",...}
```

**4.4 Test from browser:**
- Open: `https://erp.euroasianngroup.com/api/v1/health`
- Should see JSON response with status

**⏱️ Estimated time: 2 minutes**

---

### ✅ Step 5: Configure Nginx (if not done automatically)

**5.1 Copy Nginx configuration:**
```bash
# On server
cp /var/www/euroasiann-erp/deploy/nginx.conf /etc/nginx/sites-available/erp.euroasianngroup.com
ln -sf /etc/nginx/sites-available/erp.euroasianngroup.com /etc/nginx/sites-enabled/
```

**5.2 Test and reload Nginx:**
```bash
nginx -t
systemctl reload nginx
```

**⏱️ Estimated time: 2 minutes**

---

## 🎯 Quick Checklist

- [ ] Step 1: Run server setup script on VPS
- [ ] Step 2: Create `.env` file with production values
- [ ] Step 3: Build and upload application files
- [ ] Step 4: Install dependencies on server
- [ ] Step 5: Start application with PM2
- [ ] Step 6: Verify application is running
- [ ] Step 7: Test domain access

## 🔍 Troubleshooting

**If application doesn't start:**

1. **Check PM2 logs:**
   ```bash
   pm2 logs euroasiann-api --lines 50
   ```

2. **Check if port 3000 is available:**
   ```bash
   netstat -tulpn | grep 3000
   ```

3. **Verify environment variables:**
   ```bash
   cat /var/www/euroasiann-erp/.env
   ```

4. **Check MongoDB connection:**
   - Ensure MongoDB URI is correct
   - Test connection from server

**If domain doesn't work:**

1. **Check Nginx status:**
   ```bash
   systemctl status nginx
   ```

2. **Check Nginx logs:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Verify DNS:**
   - Ensure `erp.euroasianngroup.com` points to `147.93.102.82`
   - Check with: `nslookup erp.euroasianngroup.com`

## 📞 Common Issues

**Issue: "Cannot connect to MongoDB"**
- Solution: Check `MONGODB_URI` in `.env` file
- Ensure MongoDB Atlas allows connections from your server IP

**Issue: "Port 3000 already in use"**
- Solution: `lsof -i :3000` to find process, then kill it or change PORT in `.env`

**Issue: "PM2 command not found"**
- Solution: Run server setup script again or install PM2: `npm install -g pm2`

## 🎉 Success Indicators

You'll know deployment is successful when:
- ✅ `pm2 status` shows application as "online"
- ✅ `curl http://localhost:3000/health` returns success
- ✅ `https://erp.euroasianngroup.com/api/v1/health` works in browser
- ✅ No errors in `pm2 logs euroasiann-api`

## 🔄 Future Updates

To update the application after changes:

```bash
# 1. Build locally
cd apps/api && npm run build

# 2. Upload dist folder
scp -r dist root@147.93.102.82:/var/www/euroasiann-erp/apps/api/

# 3. Restart on server
ssh root@147.93.102.82 "pm2 restart euroasiann-api"
```

---

**Ready to start? Begin with Step 1!** 🚀
