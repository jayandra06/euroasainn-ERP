# Simple Deployment Guide

## 🎯 Quick Overview

**Backend (API)** → Deploy to your server via SSH  
**Frontend (4 Portals)** → Deploy to Vercel (free)

---

## Step 1: Deploy API to Your Server

### What You Need:
- A server/VPS (DigitalOcean, AWS, etc.)
- SSH access to the server

### Commands to Run:

```bash
# 1. Connect to your server
ssh user@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 (process manager)
sudo npm install -g pm2

# 4. Create project directory
sudo mkdir -p /var/www/euroasiann-erp/api
sudo chown -R $USER:$USER /var/www/euroasiann-erp
cd /var/www/euroasiann-erp/api

# 5. Clone your repository
git clone https://github.com/your-username/your-repo.git .

# 6. Install dependencies
npm install --production

# 7. Build the API
npm run build

# 8. Create .env file
nano .env
# Add your environment variables (see below)

# 9. Start the API
pm2 start dist/main.js --name euroasiann-api
pm2 save
pm2 startup  # Auto-start on reboot
```

### .env File Content:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-mongodb-connection-string
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
API_URL=https://api.yourdomain.com
```

---

## Step 2: Deploy Frontend to Vercel

### What You Need:
- Vercel account (free)
- GitHub account

### Steps:

1. **Go to [vercel.com](https://vercel.com)** and sign up with GitHub

2. **Create 4 Projects** (one for each portal):
   - Click "Add New Project"
   - Select your repository
   - For each portal, set:
     - **Root Directory:** `apps/vendor-portal` (or customer/admin/tech)
     - **Framework:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
   - Click "Deploy"

3. **Add Environment Variable** in each project:
   - Go to Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://api.yourdomain.com`
   - Save

4. **Redeploy** each project to apply changes

---

## Step 3: Configure Domain (Optional)

### For API:
```bash
# Point your domain to server IP
# Add A record: api.yourdomain.com → Your Server IP

# Install SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### For Frontend:
- Go to each project in Vercel
- Settings → Domains
- Add your domain
- Follow DNS instructions

---

## ✅ That's It!

Your application is now deployed:
- **API:** Running on your server
- **Frontends:** Live on Vercel

---

## 🔄 To Update:

### Update API:
```bash
ssh user@your-server-ip
cd /var/www/euroasiann-erp/api
git pull
npm install --production
npm run build
pm2 restart euroasiann-api
```

### Update Frontend:
- Just push to GitHub
- Vercel auto-deploys!

---

## 🆘 Common Issues:

**API not starting?**
```bash
pm2 logs euroasiann-api  # Check logs
```

**Frontend can't connect to API?**
- Check `VITE_API_URL` in Vercel
- Verify API is running: `curl https://api.yourdomain.com/health`

**Need help?**
- Check PM2: `pm2 status`
- Check Vercel deployment logs
- Review environment variables
