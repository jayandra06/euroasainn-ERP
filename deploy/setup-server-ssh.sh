#!/bin/bash

# Run this script ON THE SERVER to set up SSH key for GitHub Actions
# This allows GitHub Actions to connect without password

echo "🔑 Setting up SSH access for GitHub Actions..."

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Create authorized_keys if it doesn't exist
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

echo ""
echo "📋 Next steps:"
echo "1. Generate SSH key on your local machine (see CI_CD_SETUP.md)"
echo "2. Copy the PUBLIC key"
echo "3. Run this command on the server:"
echo "   echo 'YOUR_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys"
echo ""
echo "4. Test connection from local machine:"
echo "   ssh -i ~/.ssh/github_actions_deploy root@147.93.102.82"
echo ""
