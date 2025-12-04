#!/bin/bash
set -e

# Create output directory structure
echo "Pruning livekit..."
npx turbo prune --scope=livekit --docker

# Copy the Dockerfile to the pruned directory
echo "Copying Dockerfile..."
cp docker/livekit-pruned.Dockerfile out/full/Dockerfile

# Check if livekit.toml exists in apps/livekit and copy it if so
if [ -f "apps/livekit/livekit.toml" ]; then
  echo "Copying livekit.toml..."
  cp apps/livekit/livekit.toml out/full/livekit.toml
fi

# Check if .env exists in apps/livekit and copy it if so
if [ -f "apps/livekit/.env" ]; then
  echo "Copying .env..."
  cp apps/livekit/.env out/full/.env
fi

# Copy Google Credentials if it exists
GOOGLE_CREDS_PATH="/Users/adhityan/Code/data-pipeline/src/agents/agents/finai-adhi-dev.json"
if [ -f "$GOOGLE_CREDS_PATH" ]; then
  echo "Copying Google Credentials..."
  cp "$GOOGLE_CREDS_PATH" out/full/google-credentials.json
  
  # Update .env in out/full to point to the new location inside the container
  # We use sed to replace the line starting with GOOGLE_APPLICATION_CREDENTIALS
  if [ -f "out/full/.env" ]; then
    # Check if the variable exists in .env
    if grep -q "GOOGLE_APPLICATION_CREDENTIALS" out/full/.env; then
        # Replace existing line
        # Use a different delimiter for sed (e.g., |) to avoid conflict with paths
        sed -i '' 's|GOOGLE_APPLICATION_CREDENTIALS=.*|GOOGLE_APPLICATION_CREDENTIALS=/home/node/google-credentials.json|g' out/full/.env
    else
        # Append if not exists
        echo "GOOGLE_APPLICATION_CREDENTIALS=/home/node/google-credentials.json" >> out/full/.env
    fi
  fi
else
  echo "Warning: Google Credentials file not found at $GOOGLE_CREDS_PATH"
fi

# Update RESTO_API_URL in .env to point to production
if [ -f "out/full/.env" ]; then
  echo "Updating RESTO_API_URL..."
  if grep -q "RESTO_API_URL" out/full/.env; then
    # Replace existing line
    sed -i '' 's|RESTO_API_URL=.*|RESTO_API_URL=https://resto-ai.adhityan.com|g' out/full/.env
  else
    # Append if not exists
    echo "RESTO_API_URL=https://resto-ai.adhityan.com" >> out/full/.env
  fi
fi

# Hack: Add @livekit/agents dependency to the root package.json in out/full
# This is required because 'lk agent deploy' checks for this dependency in the current directory
echo "Patching root package.json..."
node -e "
  const fs = require('fs');
  const rootPkg = JSON.parse(fs.readFileSync('out/full/package.json', 'utf8'));
  const appPkg = JSON.parse(fs.readFileSync('apps/livekit/package.json', 'utf8'));
  
  if (!rootPkg.dependencies) rootPkg.dependencies = {};
  rootPkg.dependencies['@livekit/agents'] = appPkg.dependencies['@livekit/agents'];
  
  fs.writeFileSync('out/full/package.json', JSON.stringify(rootPkg, null, 2));
"

# Navigate to the pruned directory and deploy
echo "Deploying to LiveKit Cloud..."
cd out/full
lk agent deploy
