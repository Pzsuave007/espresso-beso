#!/bin/bash

#############################################
# Fix Espresso Beso Services
#############################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Fixing Espresso Beso Services${NC}"
echo -e "${GREEN}============================================${NC}"

PROD_DIR="/opt/espresso-beso"

#############################################
# 1. Check backend error
#############################################
echo -e "\n${YELLOW}[1/4] Checking backend error...${NC}"
journalctl -u espresso-backend -n 20 --no-pager

#############################################
# 2. Recreate backend service
#############################################
echo -e "\n${YELLOW}[2/4] Recreating backend service...${NC}"

cat > /etc/systemd/system/espresso-backend.service << EOF
[Unit]
Description=Espresso Beso Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROD_DIR/backend
Environment="PATH=$PROD_DIR/backend/venv/bin:/usr/local/bin:/usr/bin"
ExecStart=$PROD_DIR/backend/venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

#############################################
# 3. Recreate frontend service
#############################################
echo -e "\n${YELLOW}[3/4] Recreating frontend service...${NC}"

cat > /etc/systemd/system/espresso-frontend.service << EOF
[Unit]
Description=Espresso Beso Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROD_DIR/frontend
ExecStart=/usr/bin/npx serve -s build -l 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

#############################################
# 4. Restart services
#############################################
echo -e "\n${YELLOW}[4/4] Restarting services...${NC}"

systemctl daemon-reload
systemctl restart espresso-backend
systemctl restart espresso-frontend

sleep 3

echo ""
echo -e "${GREEN}Service Status:${NC}"
echo -n "Backend (port 8001): "
systemctl is-active espresso-backend && echo -e "${GREEN}✓ running${NC}" || echo -e "${RED}✗ failed${NC}"
echo -n "Frontend (port 3000): "
systemctl is-active espresso-frontend && echo -e "${GREEN}✓ running${NC}" || echo -e "${RED}✗ failed${NC}"

echo ""
echo "Checking ports..."
ss -tlnp | grep -E ":(3000|8001)" || echo "No services on ports 3000/8001"

echo ""
echo -e "${GREEN}Done! Test the site: https://espressobeso.com${NC}"
