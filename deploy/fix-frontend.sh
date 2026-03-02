#!/bin/bash

echo "=== Checking Frontend Config ==="

echo ""
echo "[1] Frontend .env:"
cat /opt/espresso-beso/frontend/.env

echo ""
echo "[2] Rebuilding frontend with correct URL..."
cd /opt/espresso-beso/frontend

# Update .env with correct URL
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://espressobeso.com
EOF

echo "Updated .env:"
cat .env

echo ""
echo "[3] Rebuilding..."
yarn build

echo ""
echo "[4] Restarting frontend service..."
systemctl restart espresso-frontend

sleep 2
echo ""
echo "Frontend status: $(systemctl is-active espresso-frontend)"

echo ""
echo "=== DONE! Clear your browser cache and try again ==="
echo "Or use incognito mode: https://espressobeso.com/admin/login"
