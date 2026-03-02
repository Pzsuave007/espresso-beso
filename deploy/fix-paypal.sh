#!/bin/bash

echo "=== Fixing Frontend Environment ==="

PROD_DIR="/opt/espresso-beso"

echo "[1] Checking current frontend .env..."
cat $PROD_DIR/frontend/.env

echo ""
echo "[2] Updating frontend .env..."
cat > $PROD_DIR/frontend/.env << 'EOF'
REACT_APP_BACKEND_URL=https://espressobeso.com
REACT_APP_PAYPAL_CLIENT_ID=AcaBRmsr1jOEo5Ew2drmpT0yIU4zlP_IiR1JaNJMkS-Oi2UQoQwc0oj5XAy4gYlMeggahmATsQ5IKHX3
EOF

echo "New .env:"
cat $PROD_DIR/frontend/.env

echo ""
echo "[3] Rebuilding frontend..."
cd $PROD_DIR/frontend
yarn build

echo ""
echo "[4] Restarting frontend service..."
systemctl restart espresso-frontend
sleep 2

echo ""
systemctl is-active espresso-frontend && echo "✓ Frontend running" || echo "✗ Frontend failed"

echo ""
echo "=== Done! Try the checkout again ==="
