@echo off
REM Windows Batch deployment script for Euroasiann ERP
REM Requires: Git Bash, WSL, or SSH client

echo ========================================
echo Euroasiann ERP Deployment Script
echo ========================================
echo.

set SERVER_HOST=147.93.102.82
set SERVER_USER=root
set APP_DIR=/var/www/euroasiann-erp

echo [1/5] Building application...
cd apps\api
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
cd ..\..

echo.
echo [2/5] Build completed!
echo.
echo [3/5] Next steps:
echo.
echo     Option 1: Use WinSCP or FileZilla to upload:
echo     - Source: apps\api\dist\*
echo     - Destination: %SERVER_USER%@%SERVER_HOST%:%APP_DIR%/apps/api/dist/
echo.
echo     Option 2: Use Git Bash or WSL:
echo     - Run: bash deploy/deploy.sh
echo.
echo [4/5] After uploading, SSH to server:
echo     ssh %SERVER_USER%@%SERVER_HOST%
echo.
echo [5/5] On server, run:
echo     cd %APP_DIR%/apps/api
echo     npm install --production
echo     cd %APP_DIR%
echo     pm2 restart euroasiann-api
echo.
echo ========================================
echo Deployment package ready!
echo ========================================
pause
