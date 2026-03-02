#!/bin/bash

#############################################
# Fix espressobeso.com to point to Espresso Beso app
#############################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "============================================"
echo "   Fixing espressobeso.com"
echo "============================================"
echo -e "${NC}"

# Find the document root for espressobeso.com
echo "Searching for espressobeso.com document root..."

DOCROOT=""

# Check userdatadomains
if [ -f /etc/userdatadomains ]; then
    DOCROOT=$(grep "espressobeso.com" /etc/userdatadomains | cut -d'=' -f2 | cut -d':' -f5 2>/dev/null)
fi

# If not found, check common locations
if [ -z "$DOCROOT" ] || [ ! -d "$DOCROOT" ]; then
    for dir in /home/*/public_html /var/www/*/public_html /var/www/html; do
        if [ -d "$dir" ]; then
            # Check if this might be the espresso domain
            if echo "$dir" | grep -qi "espresso"; then
                DOCROOT="$dir"
                break
            fi
        fi
    done
fi

# Check the espressouni2 path we saw earlier
if [ -d "/home/espressouni2/public_html" ]; then
    DOCROOT="/home/espressouni2/public_html"
fi

# Also check for espressobeso specific paths
if [ -d "/home/espressobeso/public_html" ]; then
    DOCROOT="/home/espressobeso/public_html"
fi

if [ -z "$DOCROOT" ] || [ ! -d "$DOCROOT" ]; then
    echo -e "${YELLOW}Could not auto-detect document root.${NC}"
    echo ""
    echo "Available directories in /home/:"
    ls -d /home/*/public_html 2>/dev/null || echo "None found"
    echo ""
    read -p "Enter the document root for espressobeso.com: " DOCROOT
fi

echo -e "${GREEN}Using document root: $DOCROOT${NC}"

# Backup existing .htaccess
if [ -f "$DOCROOT/.htaccess" ]; then
    cp "$DOCROOT/.htaccess" "$DOCROOT/.htaccess.backup.$(date +%Y%m%d%H%M%S)"
    echo "Backed up existing .htaccess"
fi

# Create new .htaccess for Espresso Beso
echo "Creating .htaccess..."
cat > "$DOCROOT/.htaccess" << 'EOF'
RewriteEngine On

# Proxy API requests to backend (port 8001)
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://127.0.0.1:8001/api/$1 [P,L]

# Proxy all other requests to frontend (port 3000)
RewriteCond %{REQUEST_URI} !^/api
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
EOF

echo -e "${GREEN}✓ .htaccess created at $DOCROOT${NC}"

# Check if services are running
echo ""
echo "Checking services..."
echo -n "Backend: "
systemctl is-active espresso-backend && echo -e "${GREEN}running${NC}" || echo -e "${RED}not running${NC}"
echo -n "Frontend: "
systemctl is-active espresso-frontend && echo -e "${GREEN}running${NC}" || echo -e "${RED}not running${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Done! Visit https://espressobeso.com${NC}"
echo -e "${GREEN}============================================${NC}"
