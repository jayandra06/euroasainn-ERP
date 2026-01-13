# PowerShell deployment script for Windows
# Quick deployment to VPS

$SERVER_HOST = "147.93.102.82"
$SERVER_USER = "root"
$SERVER_PASSWORD = "Euroasiann@1234"
$DOMAIN = "erp.euroasianngroup.com"
$APP_DIR = "/var/www/euroasiann-erp"

Write-Host "🚀 Starting deployment to $DOMAIN" -ForegroundColor Green

# Install sshpass equivalent or use SSH key
# For Windows, you can use plink (PuTTY) or configure SSH keys

# Build application
Write-Host "📦 Building application..." -ForegroundColor Yellow
Set-Location apps/api
npm run build
Set-Location ../..

# Create deployment package
Write-Host "📤 Creating deployment package..." -ForegroundColor Yellow
$DEPLOY_DIR = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
New-Item -ItemType Directory -Path "$DEPLOY_DIR/apps/api" -Force | Out-Null

Copy-Item -Path "apps/api/dist/*" -Destination "$DEPLOY_DIR/apps/api/" -Recurse -Force
Copy-Item -Path "apps/api/package.json" -Destination "$DEPLOY_DIR/apps/api/"
Copy-Item -Path "apps/api/package-lock.json" -Destination "$DEPLOY_DIR/apps/api/" -ErrorAction SilentlyContinue

# Upload using SCP (requires SSH client)
Write-Host "📡 Uploading files to server..." -ForegroundColor Yellow
# Note: You'll need to configure SSH keys or use a tool like WinSCP
# For now, manual upload instructions:
Write-Host "Manual upload required:" -ForegroundColor Yellow
Write-Host "1. Use WinSCP or similar tool to connect to $SERVER_HOST" -ForegroundColor Cyan
Write-Host "2. Upload contents of: $DEPLOY_DIR" -ForegroundColor Cyan
Write-Host "3. To: $APP_DIR" -ForegroundColor Cyan

# Cleanup
Remove-Item -Path $DEPLOY_DIR -Recurse -Force

Write-Host "✅ Deployment package created!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload files to server using WinSCP or similar" -ForegroundColor Cyan
Write-Host "2. SSH to server: ssh $SERVER_USER@$SERVER_HOST" -ForegroundColor Cyan
Write-Host "3. Run: cd $APP_DIR/apps/api && npm install --production" -ForegroundColor Cyan
Write-Host "4. Run: pm2 restart euroasiann-api" -ForegroundColor Cyan
