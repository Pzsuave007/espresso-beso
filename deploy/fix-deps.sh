#!/bin/bash

#############################################
# Fix Dependencies for Espresso Beso
# Run: sudo ./deploy/fix-deps.sh
#############################################

echo "=== Copying latest code to production ==="
cp -r /root/espresso-beso/backend/* /opt/espresso-beso/backend/
cp -r /root/espresso-beso/frontend/* /opt/espresso-beso/frontend/

echo "=== Installing missing dependencies ==="
cd /opt/espresso-beso/backend
source venv/bin/activate
pip install stripe pywebpush
deactivate

echo ""
echo "=== Restarting backend ==="
systemctl restart espresso-backend
sleep 3

if systemctl is-active --quiet espresso-backend; then
    echo "✓ Backend is running!"
else
    echo "✗ Backend failed - checking logs..."
    journalctl -u espresso-backend -n 15 --no-pager
fi

echo ""
echo "=== Done ==="
