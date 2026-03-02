#!/bin/bash

#############################################
# Espresso Beso - Setup for Apache/cPanel Server
# Run this ONCE on your GoDaddy VPS
# Usage: sudo ./setup-apache.sh
#############################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "============================================"
echo "   Espresso Beso - Apache/cPanel Setup"
echo "============================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo ./setup-apache.sh)${NC}"
  exit 1
fi

#############################################
# Variables - EDIT THESE IF NEEDED
#############################################
GIT_REPO="/root/espresso-beso"
PROD_DIR="/opt/espresso-beso"
DOMAIN_DOCROOT="/home/espressouni2/public_html"  # Change this to your domain's document root

#############################################
# 1. Remove conflicting nginx config
#############################################
echo -e "\n${GREEN}[1/7] Removing nginx config (using Apache instead)...${NC}"
rm -f /etc/nginx/conf.d/espresso-beso.conf
systemctl restart nginx 2>/dev/null || true

#############################################
# 2. Create production directory
#############################################
echo -e "\n${GREEN}[2/7] Creating production directory...${NC}"
mkdir -p $PROD_DIR
cp -r $GIT_REPO/backend $PROD_DIR/
cp -r $GIT_REPO/frontend $PROD_DIR/

#############################################
# 3. Setup Backend
#############################################
echo -e "\n${GREEN}[3/7] Setting up Backend...${NC}"
cd $PROD_DIR/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
if [ -f requirements-prod.txt ]; then
    pip install -r requirements-prod.txt
else
    pip install -r requirements.txt
fi
deactivate

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=espresso_beso
JWT_SECRET=$(openssl rand -hex 32)
EOF
fi

#############################################
# 4. Setup Frontend
#############################################
echo -e "\n${GREEN}[4/7] Setting up Frontend...${NC}"
cd $PROD_DIR/frontend

yarn install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    cat > .env << EOF
REACT_APP_BACKEND_URL=https://espressobeso.com
REACT_APP_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
EOF
fi

# Build frontend
yarn build

#############################################
# 5. Create Backend Service
#############################################
echo -e "\n${GREEN}[5/7] Creating backend systemd service...${NC}"

cat > /etc/systemd/system/espresso-backend.service << EOF
[Unit]
Description=Espresso Beso Backend
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROD_DIR/backend
ExecStart=$PROD_DIR/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
EnvironmentFile=$PROD_DIR/backend/.env

[Install]
WantedBy=multi-user.target
EOF

#############################################
# 6. Create Frontend Service
#############################################
echo -e "\n${GREEN}[6/7] Creating frontend systemd service...${NC}"

# Install serve globally if not exists
npm install -g serve 2>/dev/null || true

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

[Install]
WantedBy=multi-user.target
EOF

# Reload and start services
systemctl daemon-reload
systemctl enable espresso-backend espresso-frontend
systemctl restart espresso-backend espresso-frontend

#############################################
# 7. Create Apache .htaccess
#############################################
echo -e "\n${GREEN}[7/7] Creating Apache .htaccess...${NC}"

# Check if document root exists
if [ -d "$DOMAIN_DOCROOT" ]; then
    cat > $DOMAIN_DOCROOT/.htaccess << 'EOF'
RewriteEngine On

# Proxy API requests to backend (port 8001)
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://127.0.0.1:8001/api/$1 [P,L]

# Proxy all other requests to frontend (port 3000)
RewriteCond %{REQUEST_URI} !^/api
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
EOF
    echo -e "${GREEN}✓ .htaccess created at $DOMAIN_DOCROOT${NC}"
else
    echo -e "${YELLOW}WARNING: Document root $DOMAIN_DOCROOT not found${NC}"
    echo -e "${YELLOW}You need to manually create .htaccess at your domain's document root${NC}"
    echo ""
    echo "Contents for .htaccess:"
    echo "---"
    cat << 'EOF'
RewriteEngine On

# Proxy API requests to backend (port 8001)
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://127.0.0.1:8001/api/$1 [P,L]

# Proxy all other requests to frontend (port 3000)
RewriteCond %{REQUEST_URI} !^/api
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
EOF
    echo "---"
fi

#############################################
# Done!
#############################################
echo -e "\n${GREEN}"
echo "============================================"
echo "   Setup Complete!"
echo "============================================"
echo -e "${NC}"
echo ""
echo "Next steps:"
echo "1. Update $PROD_DIR/backend/.env with your settings"
echo "2. Update $PROD_DIR/frontend/.env with your PayPal client ID"
echo "3. Make sure .htaccess is in your domain's document root"
echo ""
echo "Services:"
echo "  sudo systemctl status espresso-backend"
echo "  sudo systemctl status espresso-frontend"
echo ""
echo "Logs:"
echo "  journalctl -u espresso-backend -f"
echo "  journalctl -u espresso-frontend -f"
echo ""
echo -e "${GREEN}Your app should be accessible at https://espressobeso.com${NC}"
