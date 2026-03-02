#!/bin/bash

#############################################
# Fix Espresso Beso to use ports 3001 and 8002
# (to avoid conflict with GradeProphet on 3000/8001)
#############################################

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PROD_DIR="/opt/espresso-beso"

echo "Updating services to use ports 3001 (frontend) and 8002 (backend)..."

# Backend service on port 8002
cat > /etc/systemd/system/espresso-backend.service << EOF
[Unit]
Description=Espresso Beso Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROD_DIR/backend
Environment="PATH=$PROD_DIR/backend/venv/bin:/usr/local/bin:/usr/bin"
ExecStart=$PROD_DIR/backend/venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8002
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Frontend service on port 3001
cat > /etc/systemd/system/espresso-frontend.service << EOF
[Unit]
Description=Espresso Beso Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROD_DIR/frontend
ExecStart=/usr/bin/npx serve -s build -l 3001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "Reloading and restarting services..."
systemctl daemon-reload
systemctl restart espresso-backend
systemctl restart espresso-frontend

sleep 3

echo ""
echo "Service Status:"
echo -n "Backend (8002): "
systemctl is-active espresso-backend && echo -e "${GREEN}✓ running${NC}" || echo -e "${RED}✗ failed${NC}"
echo -n "Frontend (3001): "
systemctl is-active espresso-frontend && echo -e "${GREEN}✓ running${NC}" || echo -e "${RED}✗ failed${NC}"

echo ""
echo "Checking ports..."
ss -tlnp | grep -E ":(3001|8002)"

echo ""
echo "=========================================="
echo "Now add this to your .htaccess file for espressobeso.com:"
echo "=========================================="
echo ""
cat << 'EOF'
RewriteEngine On

# Proxy to Frontend (Espresso Beso on port 3001)
RewriteCond %{REQUEST_URI} !^/api
RewriteRule ^(.*)$ http://127.0.0.1:3001/$1 [P,L]

# Proxy to Backend API (Espresso Beso on port 8002)
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^(.*)$ http://127.0.0.1:8002/$1 [P,L]
EOF
echo ""
echo "=========================================="
