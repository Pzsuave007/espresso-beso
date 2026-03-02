#!/bin/bash

#############################################
# Fix Dependencies for Espresso Beso
# Run: sudo ./deploy/fix-deps.sh
#############################################

echo "=== Installing missing dependencies ==="

cd /opt/espresso-beso/backend

# Install stripe and other requirements
/opt/espresso-beso/backend/venv/bin/pip install stripe pywebpush

echo ""
echo "=== Restarting backend ==="
systemctl restart espresso-backend
sleep 2

if systemctl is-active --quiet espresso-backend; then
    echo "✓ Backend is running!"
else
    echo "✗ Backend failed - checking logs..."
    journalctl -u espresso-backend -n 15 --no-pager
fi

echo ""
echo "=== Done ==="
