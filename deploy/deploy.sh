#!/bin/bash

# Deployment script for Euroasiann ERP Platform
# VPS: 147.93.102.82
# Domain: erp.euroasianngroup.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server configuration
SERVER_HOST="147.93.102.82"
SERVER_USER="root"
SERVER_PASSWORD="Euroasiann@1234"
DOMAIN="erp.euroasianngroup.com"
APP_DIR="/var/www/euroasiann-erp"
BACKUP_DIR="/var/backups/euroasiann-erp"

echo -e "${GREEN}🚀 Starting deployment to ${DOMAIN}${NC}"

# Function to execute remote commands
ssh_exec() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "$1"
}

# Function to copy files
scp_copy() {
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_HOST:$2"
}

echo -e "${YELLOW}📦 Step 1: Building application...${NC}"
npm run build --workspace=apps/api

echo -e "${YELLOW}📤 Step 2: Creating deployment package...${NC}"
# Create temporary deployment directory
DEPLOY_DIR=$(mktemp -d)
mkdir -p "$DEPLOY_DIR/apps/api/dist"
mkdir -p "$DEPLOY_DIR/apps/api/src"
mkdir -p "$DEPLOY_DIR/apps/api/package.json"
mkdir -p "$DEPLOY_DIR/deploy"

# Copy necessary files
cp -r apps/api/dist/* "$DEPLOY_DIR/apps/api/dist/" 2>/dev/null || true
cp apps/api/package.json "$DEPLOY_DIR/apps/api/"
cp apps/api/package-lock.json "$DEPLOY_DIR/apps/api/" 2>/dev/null || true
cp -r deploy/* "$DEPLOY_DIR/deploy/" 2>/dev/null || true
cp .env.example "$DEPLOY_DIR/" 2>/dev/null || true

echo -e "${YELLOW}📡 Step 3: Uploading files to server...${NC}"
# Create app directory on server
ssh_exec "mkdir -p $APP_DIR"
ssh_exec "mkdir -p $BACKUP_DIR"

# Backup existing deployment
echo -e "${YELLOW}💾 Step 4: Creating backup...${NC}"
ssh_exec "if [ -d $APP_DIR/apps ]; then tar -czf $BACKUP_DIR/backup-\$(date +%Y%m%d-%H%M%S).tar.gz -C $APP_DIR .; fi"

# Upload files
scp_copy "$DEPLOY_DIR/*" "$APP_DIR/"

# Cleanup
rm -rf "$DEPLOY_DIR"

echo -e "${YELLOW}⚙️  Step 5: Installing dependencies on server...${NC}"
ssh_exec "cd $APP_DIR/apps/api && npm install --production"

echo -e "${YELLOW}🔄 Step 6: Restarting services...${NC}"
ssh_exec "cd $APP_DIR && pm2 restart euroasiann-api || pm2 start deploy/pm2.config.js"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application should be available at https://${DOMAIN}${NC}"
