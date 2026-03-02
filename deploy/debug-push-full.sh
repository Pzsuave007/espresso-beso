#!/bin/bash

echo "=== Full Push Notification Debug ==="

cd /opt/espresso-beso/backend
source venv/bin/activate

python3 << 'EOF'
import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

print("[1] Checking environment...")
print(f"    VAPID_PUBLIC_KEY: {os.environ.get('VAPID_PUBLIC_KEY', 'NOT SET')[:50]}...")
print(f"    VAPID_PRIVATE_KEY_FILE: {os.environ.get('VAPID_PRIVATE_KEY_FILE', 'NOT SET')}")

pem_file = os.environ.get('VAPID_PRIVATE_KEY_FILE', '')
if pem_file and os.path.exists(pem_file):
    print(f"    ✓ PEM file exists")
    with open(pem_file, 'r') as f:
        pem_content = f.read()
    print(f"    PEM starts with: {pem_content[:30]}...")
else:
    print(f"    ✗ PEM file NOT found")

print("\n[2] Checking subscriptions...")
async def check():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client['espresso_beso']
    
    subs = await db.push_subscriptions.find({}).to_list(10)
    print(f"    Found {len(subs)} subscription(s)")
    
    for sub in subs:
        print(f"    - Endpoint: {sub['endpoint'][:60]}...")
        print(f"      Keys: p256dh={sub['keys'].get('p256dh', 'MISSING')[:20]}...")
        print(f"      Keys: auth={sub['keys'].get('auth', 'MISSING')[:20]}...")
    
    if subs:
        print("\n[3] Testing push to first subscription...")
        try:
            from pywebpush import webpush, WebPushException
            
            sub = subs[0]
            
            # Load private key from PEM file
            with open(pem_file, 'r') as f:
                private_key_pem = f.read()
            
            payload = json.dumps({
                "title": "Test Notification",
                "body": "If you see this, push works!",
                "icon": "/logo192.png"
            })
            
            print(f"    Sending to: {sub['endpoint'][:50]}...")
            
            response = webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": sub["keys"]
                },
                data=payload,
                vapid_private_key=private_key_pem,
                vapid_claims={"sub": "mailto:admin@espressobeso.com"}
            )
            print(f"    ✓ SUCCESS! Status: {response.status_code if hasattr(response, 'status_code') else 'OK'}")
            
        except WebPushException as e:
            print(f"    ✗ WebPush Error: {e}")
            if e.response:
                print(f"      Status: {e.response.status_code}")
                print(f"      Body: {e.response.text[:200]}")
        except Exception as e:
            print(f"    ✗ Error: {type(e).__name__}: {e}")
    
    client.close()

asyncio.run(check())
EOF

deactivate
