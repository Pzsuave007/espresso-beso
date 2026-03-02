#!/bin/bash

echo "=== Fixing Push Notifications ==="

cd /opt/espresso-beso/backend
source venv/bin/activate

python3 << 'EOF'
import subprocess
import sys

# Install/upgrade required packages
print("[1] Installing required packages...")
subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pywebpush", "py-vapid", "cryptography"], 
               capture_output=True)

from py_vapid import Vapid
import json
import base64
import os

print("[2] Generating new VAPID keys...")
vapid = Vapid()
vapid.generate_keys()

# Get keys in the format pywebpush expects
private_key = vapid.private_key
public_key = vapid.public_key

# Export as PEM for private key (what pywebpush needs)
from cryptography.hazmat.primitives import serialization

private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
).decode()

# For public key, get the raw bytes and base64url encode
public_raw = public_key.public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint
)
public_b64 = base64.urlsafe_b64encode(public_raw).rstrip(b'=').decode()

print(f"Public Key (for frontend): {public_b64}")
print(f"Private Key saved to: /opt/espresso-beso/backend/vapid_private.pem")

# Save private key PEM
with open('/opt/espresso-beso/backend/vapid_private.pem', 'w') as f:
    f.write(private_pem)

# Update .env file
env_path = '/opt/espresso-beso/backend/.env'
with open(env_path, 'r') as f:
    env_content = f.read()

# Remove old VAPID keys if present
new_lines = []
for line in env_content.split('\n'):
    if not line.startswith('VAPID_'):
        new_lines.append(line)

# Add new keys
new_lines.append(f'VAPID_PUBLIC_KEY={public_b64}')
new_lines.append('VAPID_PRIVATE_KEY_FILE=/opt/espresso-beso/backend/vapid_private.pem')

with open(env_path, 'w') as f:
    f.write('\n'.join(new_lines))

print("[3] Updated .env with new VAPID keys")

# Clear old subscriptions (they won't work with new keys)
print("[4] Clearing old push subscriptions...")
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clear_subs():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client['espresso_beso']
    result = await db.push_subscriptions.delete_many({})
    print(f"    Deleted {result.deleted_count} old subscriptions")
    client.close()

asyncio.run(clear_subs())

print("\n✓ VAPID keys regenerated!")
print("✓ Old subscriptions cleared")
print("\nNext: Restart backend and re-subscribe on your phone")
EOF

deactivate

echo ""
echo "[5] Restarting backend..."
systemctl restart espresso-backend
sleep 2

echo ""
systemctl is-active espresso-backend && echo "✓ Backend running" || echo "✗ Backend failed"

echo ""
echo "=== DONE ==="
echo ""
echo "Now on your phone:"
echo "1. Open https://espressobeso.com/admin/orders"
echo "2. Click the 📵 button to re-enable push notifications"
echo "3. Click 🧪 to test"
