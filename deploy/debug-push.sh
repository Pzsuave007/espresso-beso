#!/bin/bash

echo "=== Debugging Push Notifications ==="

echo ""
echo "[1] Checking if pywebpush is installed..."
cd /opt/espresso-beso/backend
source venv/bin/activate
python3 -c "import pywebpush; print('✓ pywebpush installed:', pywebpush.__version__)" 2>&1 || echo "✗ pywebpush NOT installed"
deactivate

echo ""
echo "[2] Checking push subscriptions in database..."
mongosh espresso_beso --quiet --eval '
var count = db.push_subscriptions.countDocuments();
print("Push subscriptions: " + count);
if (count > 0) {
    db.push_subscriptions.find({}, {_id: 0, endpoint: 1, admin_id: 1}).forEach(function(s) {
        print("  - Admin: " + s.admin_id + " | Endpoint: " + s.endpoint.substring(0, 60) + "...");
    });
}
'

echo ""
echo "[3] Backend logs (last 30 lines)..."
journalctl -u espresso-backend -n 30 --no-pager | grep -i "push\|error\|notification" || echo "No push-related logs found"

echo ""
echo "[4] Testing push API endpoint..."
# Get auth token first
TOKEN=$(curl -s -X POST https://espressobeso.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pzsuave007@gmail.com","password":"MXmedia007"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

if [ -n "$TOKEN" ]; then
    echo "Got auth token, testing push..."
    curl -s -X POST https://espressobeso.com/api/push/test \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN"
    echo ""
else
    echo "Failed to get auth token"
fi

echo ""
echo "[5] Check VAPID key endpoint..."
curl -s https://espressobeso.com/api/push/vapid-key
echo ""
