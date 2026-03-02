#!/bin/bash

echo "=== Testing API Login ==="

# Test directly on localhost (bypass Apache)
echo ""
echo "[1] Testing backend directly on port 8002:"
curl -s -X POST http://127.0.0.1:8002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pzsuave007@gmail.com","password":"MXmedia007"}'

echo ""
echo ""
echo "[2] Testing via domain (through Apache):"
curl -s -X POST https://espressobeso.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pzsuave007@gmail.com","password":"MXmedia007"}'

echo ""
echo ""
echo "[3] Checking backend service status:"
systemctl is-active espresso-backend

echo ""
echo "[4] Checking what's on port 8002:"
ss -tlnp | grep 8002
