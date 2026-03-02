#!/bin/bash

#############################################
# Espresso Beso - Update Script
# Works on: Ubuntu/Debian AND CentOS/RHEL/Fedora
# Usage: sudo ./update.sh
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "============================================"
echo "   Espresso Beso - Update Script"
echo "============================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo ./update.sh)${NC}"
  exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}App directory: $APP_DIR${NC}"

#############################################
# 1. Pull latest code from GitHub
#############################################
echo -e "\n${GREEN}[1/5] Pulling latest code from GitHub...${NC}"
cd "$APP_DIR"

# Stash any local changes to .env files
git stash push -m "Auto-stash before update" -- backend/.env frontend/.env 2>/dev/null || true

# Pull latest changes
git pull origin main || git pull origin master

# Restore .env files
git stash pop 2>/dev/null || true

#############################################
# 2. Update Backend Dependencies
#############################################
echo -e "\n${GREEN}[2/5] Updating backend dependencies...${NC}"
cd "$APP_DIR/backend"

source venv/bin/activate
# Use production requirements (compatible with Python 3.9+)
if [ -f requirements-prod.txt ]; then
    pip install -r requirements-prod.txt --quiet
else
    pip install -r requirements.txt --quiet
fi
deactivate

#############################################
# 3. Update Frontend Dependencies & Build
#############################################
echo -e "\n${GREEN}[3/5] Updating frontend dependencies...${NC}"
cd "$APP_DIR/frontend"

yarn install --silent

echo -e "${GREEN}[4/5] Building frontend for production...${NC}"
yarn build

#############################################
# 5. Restart Services
#############################################
echo -e "\n${GREEN}[5/5] Restarting services...${NC}"

# Restart backend
systemctl restart espresso-backend
echo -e "${GREEN}✓ Backend restarted${NC}"

# Reload Nginx (in case config changed)
nginx -t && systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

#############################################
# Done!
#############################################
echo -e "\n${GREEN}"
echo "============================================"
echo "   Update Complete!"
echo "============================================"
echo -e "${NC}"

# Show service status
echo -e "\n${BLUE}Service Status:${NC}"
systemctl is-active espresso-backend && echo -e "${GREEN}✓ Backend is running${NC}" || echo -e "${RED}✗ Backend is not running${NC}"
systemctl is-active nginx && echo -e "${GREEN}✓ Nginx is running${NC}" || echo -e "${RED}✗ Nginx is not running${NC}"
systemctl is-active mongod && echo -e "${GREEN}✓ MongoDB is running${NC}" || echo -e "${RED}✗ MongoDB is not running${NC}"

echo -e "\n${GREEN}Update completed successfully!${NC}"
