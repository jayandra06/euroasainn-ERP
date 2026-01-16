#!/bin/bash

# Server setup script for Euroasiann ERP Platform
# Run this once on the VPS to set up the environment

set -e

DOMAIN="erp.euroasianngroup.com"
APP_DIR="/var/www/euroasiann-erp"
NGINX_DIR="/etc/nginx/sites-available"

echo "🚀 Setting up server for Euroasiann ERP Platform..."

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt-get install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# Install MongoDB (if not using Atlas)
echo "📦 Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl enable mongod
    systemctl start mongod
fi

# Install Redis
echo "📦 Installing Redis..."
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Create app directory
echo "📁 Creating application directory..."
mkdir -p $APP_DIR
mkdir -p /var/log/euroasiann-erp
chown -R $USER:$USER $APP_DIR

# Create Nginx configuration
echo "⚙️  Creating Nginx configuration..."
cat > $NGINX_DIR/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Frontend apps
    location / {
        root /var/www/euroasiann-erp/frontend;
        try_files \$uri \$uri/ /index.html;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Enable site
ln -sf $NGINX_DIR/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Setup SSL with Let's Encrypt
echo "🔒 Setting up SSL certificate..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@euroasianngroup.com --redirect

# Setup firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create PM2 startup script
echo "⚙️  Setting up PM2 startup..."
pm2 startup systemd -u $USER --hp /home/$USER

echo "✅ Server setup completed!"
echo "📝 Next steps:"
echo "   1. Upload your application files to $APP_DIR"
echo "   2. Create .env file with your configuration"
echo "   3. Run: cd $APP_DIR/apps/api && npm install"
echo "   4. Run: pm2 start deploy/pm2.config.js"
