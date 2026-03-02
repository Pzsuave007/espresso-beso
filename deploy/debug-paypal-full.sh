#!/bin/bash

echo "=== Checking PayPal Error on Server ==="

echo ""
echo "[1] Backend logs (last 50 lines):"
journalctl -u espresso-backend -n 50 --no-pager | grep -v "INFO"

echo ""
echo "[2] Check frontend .env:"
cat /opt/espresso-beso/frontend/.env

echo ""
echo "[3] Check backend PayPal config:"
grep -i "paypal" /opt/espresso-beso/backend/.env 2>/dev/null || echo "No PayPal config in .env"

echo ""
echo "[4] Check backend server.py for PayPal endpoint:"
grep -A 5 "paypal/create-order" /opt/espresso-beso/backend/server.py | head -10

echo ""
echo "[5] Test PayPal create-order endpoint directly:"
# First create a test order
ORDER_RESP=$(curl -s -X POST https://espressobeso.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_info": {"name": "Test", "phone": "555-1234"},
    "items": [{"name": "Test Coffee", "quantity": 1, "item_total": 5.00}],
    "payment_status": "pending",
    "payment_method": "paypal"
  }')

echo "Order response: $ORDER_RESP"

ORDER_ID=$(echo $ORDER_RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

if [ -n "$ORDER_ID" ]; then
    echo ""
    echo "Created order: $ORDER_ID"
    echo ""
    echo "Testing PayPal create-order..."
    curl -s -X POST https://espressobeso.com/api/paypal/create-order \
      -H "Content-Type: application/json" \
      -d "{\"order_id\": \"$ORDER_ID\", \"return_url\": \"https://espressobeso.com/success\", \"cancel_url\": \"https://espressobeso.com/cart\"}"
fi

echo ""
