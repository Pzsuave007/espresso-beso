#!/bin/bash
cd /root/espresso-beso
git checkout -- .
git pull origin main
chmod +x ./deploy/*.sh

echo "=== Copying code to production ==="
cp -r /root/espresso-beso/backend/* /opt/espresso-beso/backend/
cp -r /root/espresso-beso/frontend/* /opt/espresso-beso/frontend/

echo "=== Installing dependencies ==="
cd /opt/espresso-beso/backend
source venv/bin/activate
pip install stripe pywebpush
deactivate

echo "=== Restarting backend ==="
systemctl restart espresso-backend
sleep 3

if systemctl is-active --quiet espresso-backend; then
    echo "✓ Backend is running!"
else
    echo "✗ Backend failed"
    journalctl -u espresso-backend -n 10 --no-pager
fi

echo "=== Done ==="
