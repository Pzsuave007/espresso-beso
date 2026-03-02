#!/bin/bash

#############################################
# Espresso Beso - Update Script (Apache/cPanel)
# Usage: sudo ./u.sh
#############################################

set -e

GIT_REPO="/root/espresso-beso"
PROD_DIR="/opt/espresso-beso"

echo "Pulling latest code..."
cd $GIT_REPO
git fetch origin
git pull origin main || git pull origin master

echo "Copying to production..."
cp -r backend/* $PROD_DIR/backend/
cp -r frontend/* $PROD_DIR/frontend/

echo "Updating backend dependencies..."
cd $PROD_DIR/backend
source venv/bin/activate
if [ -f requirements-prod.txt ]; then
    pip install -r requirements-prod.txt --quiet
else
    pip install -r requirements.txt --quiet
fi
deactivate

echo "Building frontend..."
cd $PROD_DIR/frontend
yarn install --silent
yarn build

echo "Restarting services..."
sudo systemctl restart espresso-backend
sudo systemctl restart espresso-frontend

echo ""
echo "✓ Backend: $(systemctl is-active espresso-backend)"
echo "✓ Frontend: $(systemctl is-active espresso-frontend)"
echo ""
echo "LISTO!"
