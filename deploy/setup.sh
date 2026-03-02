#!/bin/bash

#############################################
# Espresso Beso - Initial Server Setup Script
# Works on: Ubuntu/Debian AND CentOS/RHEL/Fedora
# Usage: chmod +x setup.sh && sudo ./setup.sh
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "============================================"
echo "   Espresso Beso - Server Setup Script"
echo "============================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo ./setup.sh)${NC}"
  exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}App directory: $APP_DIR${NC}"

#############################################
# Detect Package Manager
#############################################
if command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
    PKG_INSTALL="dnf install -y"
    echo -e "${YELLOW}Detected: RHEL/CentOS/Fedora (dnf)${NC}"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
    PKG_INSTALL="yum install -y"
    echo -e "${YELLOW}Detected: CentOS/RHEL (yum)${NC}"
elif command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt"
    PKG_INSTALL="apt-get install -y"
    echo -e "${YELLOW}Detected: Ubuntu/Debian (apt)${NC}"
else
    echo -e "${RED}No supported package manager found!${NC}"
    exit 1
fi

#############################################
# 1. System Updates
#############################################
echo -e "\n${GREEN}[1/9] Updating system packages...${NC}"
if [ "$PKG_MANAGER" = "dnf" ]; then
    dnf update -y
elif [ "$PKG_MANAGER" = "yum" ]; then
    yum update -y
else
    apt-get update && apt-get upgrade -y
fi

#############################################
# 2. Install Node.js (v20 LTS)
#############################################
echo -e "\n${GREEN}[2/9] Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    if [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        $PKG_INSTALL nodejs
    else
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
else
    echo "Node.js already installed: $(node -v)"
fi

# Install Yarn
if ! command -v yarn &> /dev/null; then
    npm install -g yarn
else
    echo "Yarn already installed: $(yarn -v)"
fi

#############################################
# 3. Install Python 3.11+
#############################################
echo -e "\n${GREEN}[3/9] Installing Python...${NC}"
if [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    $PKG_INSTALL python3 python3-pip python3-devel gcc
else
    apt-get install -y python3 python3-pip python3-venv
fi

#############################################
# 4. Install MongoDB
#############################################
echo -e "\n${GREEN}[4/9] Installing MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    if [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
        # Add MongoDB repo for RHEL/CentOS/Fedora
        cat > /etc/yum.repos.d/mongodb-org-7.0.repo << 'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
EOF
        $PKG_INSTALL mongodb-org
    else
        curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
        echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        apt-get update
        apt-get install -y mongodb-org
    fi
    
    # Start and enable MongoDB
    systemctl start mongod
    systemctl enable mongod
else
    echo "MongoDB already installed"
    systemctl start mongod 2>/dev/null || true
    systemctl enable mongod 2>/dev/null || true
fi

#############################################
# 5. Install Nginx
#############################################
echo -e "\n${GREEN}[5/9] Installing Nginx...${NC}"
if [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    $PKG_INSTALL nginx
else
    apt-get install -y nginx
fi

#############################################
# 6. Setup Backend
#############################################
echo -e "\n${GREEN}[6/9] Setting up Backend...${NC}"
cd "$APP_DIR/backend"

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
# Use production requirements (compatible with Python 3.9+)
if [ -f requirements-prod.txt ]; then
    pip install -r requirements-prod.txt
else
    pip install -r requirements.txt
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=espresso_beso
JWT_SECRET=$(openssl rand -hex 32)
EOF
    echo -e "${YELLOW}Please update backend/.env with your settings${NC}"
fi

deactivate

#############################################
# 7. Setup Frontend
#############################################
echo -e "\n${GREEN}[7/9] Setting up Frontend...${NC}"
cd "$APP_DIR/frontend"

# Install dependencies
yarn install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost
REACT_APP_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
EOF
    echo -e "${YELLOW}Please update frontend/.env with your domain and PayPal client ID${NC}"
fi

# Build frontend for production
yarn build

#############################################
# 8. Create Systemd Services
#############################################
echo -e "\n${GREEN}[8/9] Creating systemd services...${NC}"

# Backend service
cat > /etc/systemd/system/espresso-backend.service << EOF
[Unit]
Description=Espresso Beso Backend API
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
ExecStart=$APP_DIR/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start backend
systemctl enable espresso-backend
systemctl start espresso-backend

#############################################
# 9. Configure Nginx
#############################################
echo -e "\n${GREEN}[9/9] Configuring Nginx...${NC}"

# Determine Nginx config path
if [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    NGINX_CONF_DIR="/etc/nginx/conf.d"
    NGINX_CONF_FILE="$NGINX_CONF_DIR/espresso-beso.conf"
else
    NGINX_CONF_DIR="/etc/nginx/sites-available"
    NGINX_CONF_FILE="$NGINX_CONF_DIR/espresso-beso"
fi

cat > "$NGINX_CONF_FILE" << EOF
server {
    listen 80;
    server_name _;  # Replace with your domain

    # Frontend (React build)
    location / {
        root $APP_DIR/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# For Ubuntu/Debian, create symlink
if [ "$PKG_MANAGER" = "apt" ]; then
    ln -sf /etc/nginx/sites-available/espresso-beso /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
fi

# For RHEL/CentOS, disable default welcome page
if [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
    # SELinux: Allow Nginx to connect to backend
    setsebool -P httpd_can_network_connect 1 2>/dev/null || true
fi

# Test and start Nginx
nginx -t
systemctl enable nginx
systemctl restart nginx

#############################################
# Open Firewall Ports (for RHEL/CentOS)
#############################################
if command -v firewall-cmd &> /dev/null; then
    echo -e "\n${GREEN}Opening firewall ports...${NC}"
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
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
echo "1. Update backend/.env with your MongoDB URL and JWT secret"
echo "2. Update frontend/.env with your domain and PayPal client ID"
echo "3. Update Nginx config: $NGINX_CONF_FILE"
echo "4. Run: sudo ./deploy/update.sh to apply changes"
echo ""
echo "Services:"
echo "  - Backend: sudo systemctl status espresso-backend"
echo "  - Nginx:   sudo systemctl status nginx"
echo "  - MongoDB: sudo systemctl status mongod"
echo ""
echo "Logs:"
echo "  - Backend: sudo journalctl -u espresso-backend -f"
echo "  - Nginx:   sudo tail -f /var/log/nginx/error.log"
echo ""
echo -e "${GREEN}Your app should be accessible at http://your-server-ip${NC}"
