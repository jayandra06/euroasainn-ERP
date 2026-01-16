#!/bin/bash

# Script to generate SSH key for GitHub Actions deployment
# Run this on your local machine or server

echo "🔑 Setting up SSH key for GitHub Actions deployment..."

# Generate SSH key (if it doesn't exist)
if [ ! -f ~/.ssh/github_actions_deploy ]; then
    ssh-keygen -t ed25519 -f ~/.ssh/github_actions_deploy -N "" -C "github-actions-deploy"
    echo "✅ SSH key generated at ~/.ssh/github_actions_deploy"
else
    echo "⚠️  SSH key already exists at ~/.ssh/github_actions_deploy"
fi

# Display public key
echo ""
echo "📋 Copy this public key and add it to your server:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat ~/.ssh/github_actions_deploy.pub
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next steps:"
echo "1. Copy the public key above"
echo "2. SSH to your server: ssh root@147.93.102.82"
echo "3. Run: mkdir -p ~/.ssh && echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys"
echo "4. Run: chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
echo ""
echo "5. Copy the private key below and add it to GitHub Secrets as 'SSH_PRIVATE_KEY':"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat ~/.ssh/github_actions_deploy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
