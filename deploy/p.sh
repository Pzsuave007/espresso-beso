#!/bin/bash
cd /root/espresso-beso
git checkout -- .
git pull origin main
chmod +x ./deploy/*.sh

echo "=== Copying code to production ==="
cp -r /root/espresso-beso/backend/* /opt/espresso-beso/backend/
cp -r /root/espresso-beso/frontend/* /opt/espresso-beso/frontend/

echo "=== Fixing frontend config ==="
echo 'REACT_APP_BACKEND_URL=https://espressobeso.com' > /opt/espresso-beso/frontend/.env

echo "=== Installing backend dependencies ==="
cd /opt/espresso-beso/backend
source venv/bin/activate
pip install stripe pywebpush
deactivate

echo "=== Rebuilding frontend ==="
cd /opt/espresso-beso/frontend
export REACT_APP_BACKEND_URL=https://espressobeso.com
yarn install 2>/dev/null
yarn build

echo "=== Restarting services ==="
systemctl restart espresso-backend
systemctl restart espresso-frontend
sleep 3

if systemctl is-active --quiet espresso-backend; then
    echo "✓ Backend running!"
else
    echo "✗ Backend failed"
fi

if systemctl is-active --quiet espresso-frontend; then
    echo "✓ Frontend running!"
else
    echo "✗ Frontend failed"
fi

echo "=== Done! Clear browser cache and refresh ==="
