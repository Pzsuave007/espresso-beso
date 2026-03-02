#!/bin/bash

#############################################
# Update with Push Notifications
#############################################

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PROD_DIR="/opt/espresso-beso"

echo "=== Updating Espresso Beso with Push Notifications ==="

echo ""
echo "[1/5] Copying updated code..."
cp -r /root/espresso-beso/backend/* $PROD_DIR/backend/
cp -r /root/espresso-beso/frontend/* $PROD_DIR/frontend/

echo ""
echo "[2/5] Installing pywebpush for push notifications..."
cd $PROD_DIR/backend
source venv/bin/activate
pip install pywebpush==1.14.0 --quiet
pip install -r requirements-prod.txt --quiet
deactivate

echo ""
echo "[3/5] Building frontend..."
cd $PROD_DIR/frontend
yarn install --silent
yarn build

echo ""
echo "[4/5] Restarting services..."
systemctl restart espresso-backend
systemctl restart espresso-frontend

sleep 3

echo ""
echo "[5/5] Checking services..."
echo -n "Backend: "
systemctl is-active espresso-backend && echo -e "${GREEN}✓ running${NC}" || echo -e "${RED}✗ failed${NC}"
echo -n "Frontend: "
systemctl is-active espresso-frontend && echo -e "${GREEN}✓ running${NC}" || echo -e "${RED}✗ failed${NC}"

echo ""
echo "=== Push Notifications Setup Complete! ==="
echo ""
echo "How to enable push notifications:"
echo "1. Open https://espressobeso.com/admin/orders"
echo "2. Look for the 📵 button next to the sound toggle"
echo "3. Click it to enable push notifications (it will show 📲 when enabled)"
echo "4. Click 🧪 to send a test notification"
echo ""
