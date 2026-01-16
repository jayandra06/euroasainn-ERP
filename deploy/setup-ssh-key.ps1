# PowerShell script to generate SSH key for GitHub Actions
# Run this on Windows

Write-Host "Setting up SSH key for GitHub Actions deployment..." -ForegroundColor Green
Write-Host ""

$sshDir = "$env:USERPROFILE\.ssh"
$keyPath = "$sshDir\github_actions_deploy"

# Create .ssh directory if it doesn't exist
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "Created .ssh directory" -ForegroundColor Green
}

# Generate SSH key if it doesn't exist
if (-not (Test-Path $keyPath)) {
    Write-Host "Generating SSH key..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -f $keyPath -N '""' -C "github-actions-deploy"
    Write-Host "SSH key generated at $keyPath" -ForegroundColor Green
} else {
    Write-Host "SSH key already exists at $keyPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "PUBLIC KEY (Add this to your server):" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Get-Content "$keyPath.pub"
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "PRIVATE KEY (Add this to GitHub Secrets as 'SSH_PRIVATE_KEY'):" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Get-Content $keyPath
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Copy the PUBLIC KEY above" -ForegroundColor White
Write-Host "2. SSH to server: ssh root@147.93.102.82" -ForegroundColor White
Write-Host "3. Run: mkdir -p ~/.ssh && echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "4. Run: chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh" -ForegroundColor White
Write-Host ""
Write-Host "5. Copy the PRIVATE KEY above and add to GitHub:" -ForegroundColor White
Write-Host "   - Go to: https://github.com/jayandra06/euroasainn-ERP/settings/secrets/actions" -ForegroundColor White
Write-Host "   - Click 'New repository secret'" -ForegroundColor White
Write-Host "   - Name: SSH_PRIVATE_KEY" -ForegroundColor White
Write-Host "   - Value: Paste the entire private key" -ForegroundColor White
Write-Host ""
