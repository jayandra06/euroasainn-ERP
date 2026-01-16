# Deployment Guide - Euroasiann ERP Platform

## 🚀 Server Information

- **VPS IP**: 147.93.102.82
- **Domain**: erp.euroasianngroup.com
- **SSH User**: root
- **SSH Password**: Euroasiann@1234

## 📋 Prerequisites

1. **Local Machine Requirements**:
   - Node.js 18+
   - npm
   - sshpass (for password-based SSH)
   - Git

2. **Install sshpass** (if not installed):
   ```bash
   # Windows (using WSL or Git Bash)
   # Download from: https://sourceforge.net/projects/sshpass/
   
   # Linux/Mac
   sudo apt-get install sshpass  # Ubuntu/Debian
   brew install sshpass          # Mac
   ```

## 🔧 Initial Server Setup (One-time)

### Step 1: Connect to Server

```bash
ssh root@147.93.102.82
# Password: Euroasiann@1234
```

### Step 2: Run Server Setup Script

On the server, run:

```bash
cd /tmp
wget https://raw.githubusercontent.com/your-repo/deploy/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

Or manually upload and run:

```bash
# From local machine
scp deploy/server-setup.sh root@147.93.102.82:/tmp/
ssh root@147.93.102.82 "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"
```

### Step 3: Configure Environment Variables

On the server, create `.env` file:

```bash
nano /var/www/euroasiann-erp/.env
```

Add your environment variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# Database
MONGODB_URI=your-mongodb-connection-string

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-production-secret-key-change-this
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Jira Integration
JIRA_ENABLED=true
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-token
JIRA_PROJECT_KEY=TEST

# CORS
FRONTEND_URL=https://erp.euroasianngroup.com

# Email (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

## 📦 Deployment Process

### Option 1: Automated Deployment (Recommended)

From your local machine:

```bash
# Make deploy script executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh
```

### Option 2: Manual Deployment

#### Step 1: Build Application Locally

```bash
# Build API
cd apps/api
npm run build

# Build Frontend Apps (if needed)
cd ../customer-portal
npm run build
cd ../vendor-portal
npm run build
cd ../admin-portal
npm run build
cd ../tech-portal
npm run build
```

#### Step 2: Upload Files to Server

```bash
# Upload API
scp -r apps/api/dist root@147.93.102.82:/var/www/euroasiann-erp/apps/api/
scp apps/api/package.json root@147.93.102.82:/var/www/euroasiann-erp/apps/api/

# Upload frontend builds
scp -r apps/customer-portal/dist root@147.93.102.82:/var/www/euroasiann-erp/frontend/customer-portal/
scp -r apps/vendor-portal/dist root@147.93.102.82:/var/www/euroasiann-erp/frontend/vendor-portal/
scp -r apps/admin-portal/dist root@147.93.102.82:/var/www/euroasiann-erp/frontend/admin-portal/
scp -r apps/tech-portal/dist root@147.93.102.82:/var/www/euroasiann-erp/frontend/tech-portal/

# Upload PM2 config
scp deploy/pm2.config.js root@147.93.102.82:/var/www/euroasiann-erp/deploy/
```

#### Step 3: Install Dependencies on Server

```bash
ssh root@147.93.102.82
cd /var/www/euroasiann-erp/apps/api
npm install --production
```

#### Step 4: Start/Restart Application

```bash
# On server
cd /var/www/euroasiann-erp
pm2 restart euroasiann-api
# Or if first time:
pm2 start deploy/pm2.config.js
pm2 save
```

## 🔄 Post-Deployment Steps

### 1. Verify Application is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs euroasiann-api

# Check API health
curl http://localhost:3000/health
```

### 2. Verify Nginx Configuration

```bash
# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 3. Test Domain Access

```bash
# Test API
curl https://erp.euroasianngroup.com/api/v1/health

# Test in browser
# https://erp.euroasianngroup.com/customer
# https://erp.euroasianngroup.com/vendor
# https://erp.euroasianngroup.com/admin
# https://erp.euroasianngroup.com/tech
```

## 🔒 SSL Certificate Setup

SSL certificate is automatically configured by the setup script using Let's Encrypt.

To renew manually:

```bash
certbot renew
systemctl reload nginx
```

## 📊 Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs euroasiann-api

# Monitor
pm2 monit

# View status
pm2 status

# Restart
pm2 restart euroasiann-api

# Stop
pm2 stop euroasiann-api
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory
free -h

# Check running processes
htop
```

## 🔧 Troubleshooting

### Application Not Starting

1. Check PM2 logs:
   ```bash
   pm2 logs euroasiann-api --lines 100
   ```

2. Check if port is in use:
   ```bash
   netstat -tulpn | grep 3000
   ```

3. Verify environment variables:
   ```bash
   cat /var/www/euroasiann-erp/.env
   ```

### Nginx Issues

1. Test configuration:
   ```bash
   nginx -t
   ```

2. Check error logs:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. Check access logs:
   ```bash
   tail -f /var/log/nginx/access.log
   ```

### Database Connection Issues

1. Check MongoDB status:
   ```bash
   systemctl status mongod
   ```

2. Check Redis status:
   ```bash
   systemctl status redis-server
   ```

3. Test connections:
   ```bash
   mongo --eval "db.version()"
   redis-cli ping
   ```

## 🔄 Update Deployment

To update the application:

```bash
# From local machine
./deploy/deploy.sh
```

Or manually:

```bash
# 1. Build locally
npm run build --workspace=apps/api

# 2. Upload to server
scp -r apps/api/dist root@147.93.102.82:/var/www/euroasiann-erp/apps/api/

# 3. Restart on server
ssh root@147.93.102.82 "cd /var/www/euroasiann-erp && pm2 restart euroasiann-api"
```

## 📝 Environment Variables Reference

See `.env.example` for all available environment variables.

## 🔐 Security Best Practices

1. **Change default passwords** after first login
2. **Use SSH keys** instead of password authentication
3. **Keep system updated**: `apt-get update && apt-get upgrade`
4. **Configure firewall**: Only allow necessary ports
5. **Regular backups**: Set up automated backups
6. **Monitor logs**: Regularly check application and system logs

## 📞 Support

For deployment issues, check:
- PM2 logs: `/var/log/euroasiann-erp/`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -u nginx` or `journalctl -u mongod`

## 🎯 Quick Commands Reference

```bash
# Connect to server
ssh root@147.93.102.82

# View application logs
pm2 logs euroasiann-api

# Restart application
pm2 restart euroasiann-api

# Check application status
pm2 status

# Reload Nginx
systemctl reload nginx

# Check SSL certificate
certbot certificates

# Backup database
mongodump --out /var/backups/mongodb/$(date +%Y%m%d)
```
