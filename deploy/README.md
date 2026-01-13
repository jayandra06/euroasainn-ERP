# Deployment Files

This directory contains all deployment-related files for the Euroasiann ERP Platform.

## Files

- **deploy.sh** - Automated deployment script (Linux/Mac)
- **server-setup.sh** - Initial server setup script (run once on VPS)
- **pm2.config.js** - PM2 process manager configuration
- **nginx.conf** - Nginx reverse proxy configuration
- **quick-deploy.ps1** - PowerShell deployment script (Windows)

## Quick Start

### First Time Setup

1. **Connect to server and run setup**:
   ```bash
   ssh root@147.93.102.82
   # Upload server-setup.sh and run it
   ```

2. **Configure environment variables** on server:
   ```bash
   nano /var/www/euroasiann-erp/.env
   ```

### Deploy Application

**Linux/Mac**:
```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

**Windows**:
```powershell
.\deploy\quick-deploy.ps1
```

Or follow manual steps in `DEPLOYMENT.md`

## Server Details

- **IP**: 147.93.102.82
- **Domain**: erp.euroasianngroup.com
- **User**: root
- **App Directory**: /var/www/euroasiann-erp
