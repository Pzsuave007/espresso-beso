#!/bin/bash

echo "=== Checking PayPal Error ==="

echo ""
echo "[1] Backend logs (last 30 lines):"
journalctl -u espresso-backend -n 30 --no-pager

echo ""
echo "[2] Testing PayPal create endpoint:"
curl -s -X POST https://espressobeso.com/api/paypal/create-order \
  -H "Content-Type: application/json" \
  -d '{"order_id":"test123","return_url":"https://espressobeso.com/test","cancel_url":"https://espressobeso.com/cart"}' | head -200

echo ""
