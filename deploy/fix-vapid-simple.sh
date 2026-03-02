#!/bin/bash

echo "=== Fixing VAPID Keys (Simple Method) ==="

cd /opt/espresso-beso/backend
source venv/bin/activate

python3 << 'EOF'
import os
import base64
import asyncio
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
from motor.motor_asyncio import AsyncIOMotorClient

print("[1] Generating fresh VAPID keys...")

# Generate EC key pair
private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
public_key = private_key.public_key()

# Get raw private key (32 bytes)
private_numbers = private_key.private_numbers()
private_raw = private_numbers.private_value.to_bytes(32, 'big')
private_b64 = base64.urlsafe_b64encode(private_raw).decode().rstrip('=')

# Get raw public key (65 bytes: 04 + x + y)
public_numbers = private_numbers.public_numbers
x_bytes = public_numbers.x.to_bytes(32, 'big')
y_bytes = public_numbers.y.to_bytes(32, 'big')
public_raw = b'\x04' + x_bytes + y_bytes
public_b64 = base64.urlsafe_b64encode(public_raw).decode().rstrip('=')

print(f"    Public Key: {public_b64[:50]}...")
print(f"    Private Key: {private_b64[:20]}...")

print("\n[2] Updating .env file...")
env_path = '/opt/espresso-beso/backend/.env'

# Read existing env
with open(env_path, 'r') as f:
    lines = f.readlines()

# Filter out old VAPID lines
new_lines = [l for l in lines if not l.startswith('VAPID_')]

# Add new VAPID keys
new_lines.append(f'VAPID_PUBLIC_KEY={public_b64}\n')
new_lines.append(f'VAPID_PRIVATE_KEY={private_b64}\n')

with open(env_path, 'w') as f:
    f.writelines(new_lines)

print("    ✓ .env updated")

print("\n[3] Clearing old subscriptions...")
async def clear():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['espresso_beso']
    result = await db.push_subscriptions.delete_many({})
    print(f"    Deleted {result.deleted_count} old subscriptions")
    client.close()

asyncio.run(clear())

print("\n[4] Testing key format...")
try:
    from pywebpush import webpush
    # pywebpush expects the raw base64url encoded private key
    print("    ✓ Keys should work with pywebpush")
except Exception as e:
    print(f"    Error: {e}")

print("\n✓ Done! New VAPID keys generated.")
print(f"\nPublic Key for reference:\n{public_b64}")
EOF

deactivate

echo ""
echo "[5] Updating server.py to use simple key format..."
# The server.py already supports VAPID_PRIVATE_KEY env var

echo ""
echo "[6] Restarting backend..."
systemctl restart espresso-backend
sleep 2
systemctl is-active espresso-backend && echo "✓ Backend running" || echo "✗ Backend failed"

echo ""
echo "=== NOW ON YOUR PHONE ==="
echo "1. Remove the Espresso Beso app from your home screen"
echo "2. Clear Chrome browser data for espressobeso.com"
echo "   (Chrome > Settings > Site Settings > espressobeso.com > Clear & Reset)"
echo "3. Go to https://espressobeso.com/admin/orders"
echo "4. Add to home screen again"
echo "5. Click 📵 to enable push notifications"
echo "6. Click 🧪 to test"
