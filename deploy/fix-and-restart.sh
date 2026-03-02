#!/bin/bash

#############################################
# Fix and restart Espresso Beso after code update
#############################################

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Copying updated code to production..."
cp -r /root/espresso-beso/backend/* /opt/espresso-beso/backend/
cp -r /root/espresso-beso/frontend/* /opt/espresso-beso/frontend/

echo "Reinstalling backend dependencies..."
cd /opt/espresso-beso/backend
source venv/bin/activate
pip install -r requirements-prod.txt --quiet
deactivate

echo "Rebuilding frontend..."
cd /opt/espresso-beso/frontend
yarn build

echo "Restarting services..."
systemctl daemon-reload
systemctl restart espresso-backend
systemctl restart espresso-frontend

sleep 3

echo ""
echo "Service Status:"
echo -n "Backend: "
systemctl is-active espresso-backend && echo -e "${GREEN}✓ running${NC}" || echo -e "${RED}✗ failed${NC}"
echo -n "Frontend: "
systemctl is-active espresso-frontend && echo -e "${GREEN}✓ running${NC}" || echo -e "${RED}✗ failed${NC}"

echo ""
echo "Ports:"
ss -tlnp | grep -E ":(3000|8001)" || echo "No services found"

echo ""
echo "Done! Test: https://espressobeso.com"
