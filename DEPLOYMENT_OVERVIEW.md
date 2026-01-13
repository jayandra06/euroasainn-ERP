# Deployment Overview

This document provides a high-level overview of how to deploy the Euroasiann ERP platform.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    DEPLOYMENT SETUP                     │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   API Backend    │         │  Frontend Apps   │
│  (Express.js)    │         │   (React/Vite)   │
│                  │         │                  │
│  Deploy via:     │         │  Deploy via:     │
│  SSH to VPS      │         │  Vercel          │
│                  │         │                  │
│  Port: 3000      │         │  Port: Auto      │
│  Process: PM2    │         │  CDN: Global     │
└──────────────────┘         └──────────────────┘
         │                            │
         └────────────┬───────────────┘
                      │
              ┌───────▼────────┐
              │   MongoDB      │
              │   Redis        │
              └────────────────┘
```

## 📦 What Gets Deployed Where?

### Backend (API)
- **Location:** VPS/Server (DigitalOcean, AWS, Linode, etc.)
- **Technology:** Node.js + Express.js
- **Process Manager:** PM2
- **Database:** MongoDB (can be cloud or local)
- **Cache:** Redis (can be cloud or local)
- **Port:** 3000 (or configured port)

### Frontend Portals
- **Location:** Vercel (Free hosting with CDN)
- **Technology:** React + Vite
- **Portals:**
  1. Vendor Portal
  2. Customer Portal
  3. Admin Portal
  4. Tech Portal
- **SSL:** Automatic (provided by Vercel)

## 🚀 Deployment Methods

### Method 1: Manual Deployment (Simple)

#### API Deployment
```bash
# On your server
cd /var/www/euroasiann-erp/api
git clone your-repo-url .
npm install --production
npm run build
pm2 start dist/main.js --name euroasiann-api
pm2 save
```

#### Frontend Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy each portal
cd apps/vendor-portal && vercel --prod
cd ../customer-portal && vercel --prod
cd ../admin-portal && vercel --prod
cd ../tech-portal && vercel --prod
```

### Method 2: Automated Deployment (Recommended)

#### Using GitHub Actions
1. Push code to GitHub
2. GitHub Actions automatically:
   - Builds the API
   - Deploys to server via SSH
   - Deploys frontends to Vercel

#### Using Vercel Dashboard
1. Connect GitHub repo to Vercel
2. Configure each portal project
3. Auto-deploys on every push

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Server/VPS ready
- [ ] MongoDB database ready (local or cloud)
- [ ] Redis instance ready (local or cloud)
- [ ] Domain names configured (optional)
- [ ] Environment variables prepared

### API Deployment
- [ ] Node.js 20.x installed on server
- [ ] PM2 installed globally
- [ ] MongoDB connection string ready
- [ ] Redis connection details ready
- [ ] JWT secrets generated
- [ ] `.env` file created on server
- [ ] Firewall configured (port 3000)
- [ ] SSL certificate installed (for HTTPS)

### Frontend Deployment
- [ ] Vercel account created
- [ ] 4 projects created in Vercel
- [ ] Environment variables set (`VITE_API_URL`)
- [ ] API URL configured correctly
- [ ] CORS configured on API

## 🔧 Required Environment Variables

### API (.env on server)
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://...
REDIS_HOST=...
REDIS_PORT=6379
JWT_SECRET=...
JWT_REFRESH_SECRET=...
API_URL=https://api.yourdomain.com
CUSTOMER_PORTAL_URL=https://customer.yourdomain.com
VENDOR_PORTAL_URL=https://vendor.yourdomain.com
ADMIN_PORTAL_URL=https://admin.yourdomain.com
TECH_PORTAL_URL=https://tech.yourdomain.com
```

### Frontend (Vercel Environment Variables)
```env
VITE_API_URL=https://api.yourdomain.com
```

## 🌐 Domain Configuration

### API Domain
- Point `api.yourdomain.com` → Your server IP
- Install SSL certificate (Let's Encrypt)
- Configure Nginx reverse proxy (optional)

### Frontend Domains
- Vendor: `vendor.yourdomain.com`
- Customer: `customer.yourdomain.com`
- Admin: `admin.yourdomain.com`
- Tech: `tech.yourdomain.com`
- Configure in Vercel → Settings → Domains

## 📊 Deployment Flow

```
1. Developer pushes code to GitHub
   ↓
2. GitHub Actions triggered
   ↓
3. Build API → Deploy to Server (SSH)
   ↓
4. Build Frontends → Deploy to Vercel
   ↓
5. Services restart automatically
   ↓
6. Application is live!
```

## 🔄 Update Process

### Update API
```bash
# On server
cd /var/www/euroasiann-erp/api
git pull origin main
npm install --production
npm run build
pm2 restart euroasiann-api
```

### Update Frontend
- Push to GitHub → Vercel auto-deploys
- Or manually: `vercel --prod` in each portal directory

## 🛠️ Server Requirements

### Minimum Requirements
- **CPU:** 1 core
- **RAM:** 1GB (2GB recommended)
- **Storage:** 10GB
- **OS:** Ubuntu 20.04/22.04 or similar

### Recommended Requirements
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 20GB SSD
- **OS:** Ubuntu 22.04 LTS

## 📱 Access Points

After deployment, your application will be accessible at:

- **API:** `https://api.yourdomain.com`
- **Vendor Portal:** `https://vendor.yourdomain.com`
- **Customer Portal:** `https://customer.yourdomain.com`
- **Admin Portal:** `https://admin.yourdomain.com`
- **Tech Portal:** `https://tech.yourdomain.com`

## 🔐 Security Considerations

1. **API Security:**
   - Use HTTPS (SSL certificate)
   - Strong JWT secrets
   - Firewall configured
   - Regular security updates

2. **Frontend Security:**
   - Vercel provides automatic HTTPS
   - Environment variables secured
   - CORS properly configured

3. **Database Security:**
   - MongoDB authentication enabled
   - Network access restricted
   - Regular backups

## 📈 Monitoring

### API Monitoring
- PM2 monitoring: `pm2 monit`
- Logs: `pm2 logs euroasiann-api`
- Status: `pm2 status`

### Frontend Monitoring
- Vercel dashboard
- Deployment logs
- Analytics (if enabled)

## 🆘 Troubleshooting

### API Issues
- Check PM2 logs: `pm2 logs`
- Verify MongoDB connection
- Check Redis connection
- Review environment variables

### Frontend Issues
- Check Vercel deployment logs
- Verify `VITE_API_URL` is correct
- Check browser console for errors
- Verify CORS settings on API

## 💰 Cost Estimate

### Free Tier
- **Vercel:** Free (for personal projects)
- **Server:** $5-10/month (DigitalOcean, Linode)
- **MongoDB:** Free (MongoDB Atlas free tier)
- **Redis:** Free (Upstash free tier)

### Production Tier
- **Vercel:** Free or Pro ($20/month)
- **Server:** $20-40/month
- **MongoDB:** $9-25/month
- **Redis:** $10-20/month
- **Total:** ~$60-100/month

## ✅ Quick Start Commands

```bash
# 1. Prepare server
ssh user@server
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 2. Clone and setup API
cd /var/www
sudo mkdir -p euroasiann-erp/api
sudo chown -R $USER:$USER euroasiann-erp
cd euroasiann-erp/api
git clone your-repo-url .
npm install --production
npm run build

# 3. Create .env file
nano .env  # Add your environment variables

# 4. Start API
pm2 start dist/main.js --name euroasiann-api
pm2 save
pm2 startup  # Auto-start on server reboot

# 5. Deploy frontends (on local machine)
npm install -g vercel
cd apps/vendor-portal && vercel --prod
cd ../customer-portal && vercel --prod
cd ../admin-portal && vercel --prod
cd ../tech-portal && vercel --prod
```

## 🎯 Next Steps

1. **Choose your deployment method** (Manual or Automated)
2. **Set up your server** (if deploying API)
3. **Create Vercel projects** (for frontends)
4. **Configure environment variables**
5. **Deploy and test**
6. **Set up monitoring**
7. **Configure domains** (optional)

---

**Need help?** Check the detailed guides or review the error logs.
