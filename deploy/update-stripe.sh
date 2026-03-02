#!/bin/bash

echo "=== Updating to Stripe Payment ==="

PROD_DIR="/opt/espresso-beso"

echo ""
echo "[1/5] Checking Stripe credentials..."
ENV_FILE="$PROD_DIR/backend/.env"

if grep -q "STRIPE_SECRET_KEY" "$ENV_FILE"; then
    echo "✓ Stripe credentials already configured"
else
    echo ""
    echo "⚠️  Stripe credentials not found!"
    echo ""
    echo "Please add your Stripe keys to $ENV_FILE:"
    echo "  STRIPE_SECRET_KEY=sk_live_your_key_here"
    echo "  STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here"
    echo ""
    read -p "Press Enter after adding the keys, or Ctrl+C to cancel..."
fi

echo ""
echo "[2/5] Copying updated code..."
cp -r /root/espresso-beso/backend/* $PROD_DIR/backend/
cp -r /root/espresso-beso/frontend/* $PROD_DIR/frontend/

echo ""
echo "[3/5] Installing Stripe SDK..."
cd $PROD_DIR/backend
source venv/bin/activate
pip install stripe --quiet
deactivate

echo ""
echo "[4/5] Rebuilding frontend..."
cd $PROD_DIR/frontend
yarn install --silent
yarn build

echo ""
echo "[5/5] Restarting services..."
systemctl restart espresso-backend
systemctl restart espresso-frontend
sleep 3

echo ""
echo "Service status:"
systemctl is-active espresso-backend && echo "✓ Backend running" || echo "✗ Backend failed"
systemctl is-active espresso-frontend && echo "✓ Frontend running" || echo "✗ Frontend failed"

echo ""
echo "=== Stripe Payment Ready! ==="
