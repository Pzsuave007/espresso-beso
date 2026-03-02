#!/bin/bash

echo "=== Full Update with Logo & Push Fix ==="

PROD_DIR="/opt/espresso-beso"

echo ""
echo "[1/6] Copying latest code..."
cp -r /root/espresso-beso/backend/* $PROD_DIR/backend/
cp -r /root/espresso-beso/frontend/* $PROD_DIR/frontend/

echo ""
echo "[2/6] Generating new VAPID keys..."
cd $PROD_DIR/backend
source venv/bin/activate

python3 << 'EOF'
import base64
import asyncio
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
from motor.motor_asyncio import AsyncIOMotorClient

# Generate EC key pair
private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
public_key = private_key.public_key()

# Get raw private key (32 bytes)
private_numbers = private_key.private_numbers()
private_raw = private_numbers.private_value.to_bytes(32, 'big')
private_b64 = base64.urlsafe_b64encode(private_raw).decode().rstrip('=')

# Get raw public key (65 bytes)
public_numbers = private_numbers.public_numbers
x_bytes = public_numbers.x.to_bytes(32, 'big')
y_bytes = public_numbers.y.to_bytes(32, 'big')
public_raw = b'\x04' + x_bytes + y_bytes
public_b64 = base64.urlsafe_b64encode(public_raw).decode().rstrip('=')

print(f"Public Key: {public_b64[:40]}...")

# Update .env
env_path = '/opt/espresso-beso/backend/.env'
with open(env_path, 'r') as f:
    lines = f.readlines()

new_lines = [l for l in lines if not l.startswith('VAPID_')]
new_lines.append(f'VAPID_PUBLIC_KEY={public_b64}\n')
new_lines.append(f'VAPID_PRIVATE_KEY={private_b64}\n')

with open(env_path, 'w') as f:
    f.writelines(new_lines)

print("✓ Backend .env updated")

# Clear old subscriptions
async def clear():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['espresso_beso']
    await db.push_subscriptions.delete_many({})
    client.close()

asyncio.run(clear())
print("✓ Old subscriptions cleared")
EOF

deactivate

echo ""
echo "[3/6] Installing backend dependencies..."
cd $PROD_DIR/backend
source venv/bin/activate
pip install pywebpush --quiet
deactivate

echo ""
echo "[4/6] Building frontend..."
cd $PROD_DIR/frontend
yarn install --silent
yarn build

echo ""
echo "[5/6] Verifying manifest..."
cat $PROD_DIR/frontend/build/manifest.json | head -20

echo ""
echo "[6/6] Restarting services..."
systemctl restart espresso-backend
systemctl restart espresso-frontend
sleep 3

echo ""
echo "Service status:"
systemctl is-active espresso-backend && echo "✓ Backend running" || echo "✗ Backend failed"
systemctl is-active espresso-frontend && echo "✓ Frontend running" || echo "✗ Frontend failed"

echo ""
echo "=== DONE ==="
echo ""
echo "On your phone:"
echo "1. Delete the old Espresso Beso app from home screen"
echo "2. In Chrome: Settings > Privacy > Clear browsing data > Clear"
echo "3. Go to https://espressobeso.com/admin/orders"
echo "4. Tap the 3 dots menu > Add to Home screen"
echo "5. Open the app and tap 📵 to enable notifications"
echo "6. Tap 🧪 to test"
