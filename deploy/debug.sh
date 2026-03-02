#!/bin/bash

echo "=== Checking Admin in Database ==="
mongosh espresso_beso --quiet --eval "db.admins.find().pretty()"

echo ""
echo "=== Checking Menu Items Count ==="
mongosh espresso_beso --quiet --eval "db.menu_items.countDocuments()"

echo ""
echo "=== Testing Login API ==="
curl -s -X POST https://espressobeso.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pzsuave007@gmail.com","password":"MXmedia007"}'

echo ""
echo ""
echo "=== Backend Logs (last 20 lines) ==="
journalctl -u espresso-backend -n 20 --no-pager
