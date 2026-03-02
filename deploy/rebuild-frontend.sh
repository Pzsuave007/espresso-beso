#!/bin/bash
#############################################
# Rebuild Frontend for Espresso Beso
#############################################

echo "=== Rebuilding frontend ==="

cd /opt/espresso-beso/frontend

# Set the environment variable for the build
export REACT_APP_BACKEND_URL=https://espressobeso.com

# Install dependencies if needed
npm install --legacy-peer-deps 2>/dev/null || yarn install

# Build the frontend
npm run build || yarn build

echo "=== Restarting frontend ==="
systemctl restart espresso-frontend
sleep 2

if systemctl is-active --quiet espresso-frontend; then
    echo "✓ Frontend is running!"
else
    echo "✗ Frontend failed"
    journalctl -u espresso-frontend -n 10 --no-pager
fi

echo "=== Done ==="
echo "Clear your browser cache and refresh the page"
