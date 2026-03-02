#!/bin/bash

echo "=== Testing Push Notification Directly ==="

cd /opt/espresso-beso/backend
source venv/bin/activate

python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
from dotenv import load_dotenv

load_dotenv()

# VAPID keys
VAPID_PUBLIC_KEY = "BCMB613380xad8wNayco4hz9yiyTi_sbIsEWBQI1w8IA-kpRI9nM5PJdcfGmj_KA7C7c04Pfd0ORCzGdkYulrWw"
VAPID_PRIVATE_KEY = "dwMKc9TM0SQS1UpN6-v7a6SS9uO7QZyzQhnKLpzjIEQ"
VAPID_EMAIL = "mailto:admin@espressobeso.com"

async def test_push():
    try:
        from pywebpush import webpush, WebPushException
        print("✓ pywebpush imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import pywebpush: {e}")
        print("Installing pywebpush...")
        import subprocess
        subprocess.run(["pip", "install", "pywebpush"], check=True)
        from pywebpush import webpush, WebPushException
    
    # Get subscription from database
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'espresso_beso')]
    
    sub = await db.push_subscriptions.find_one({})
    if not sub:
        print("✗ No push subscription found in database")
        return
    
    print(f"✓ Found subscription for admin: {sub.get('admin_id')}")
    print(f"  Endpoint: {sub['endpoint'][:70]}...")
    
    # Prepare payload
    payload = json.dumps({
        "title": "🧪 Test from Server",
        "body": "Push notifications are working!",
        "icon": "/logo192.png",
        "url": "/admin/orders"
    })
    
    print("\nSending push notification...")
    
    try:
        response = webpush(
            subscription_info={
                "endpoint": sub["endpoint"],
                "keys": sub["keys"]
            },
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_EMAIL}
        )
        print(f"✓ Push sent successfully! Response: {response}")
    except WebPushException as e:
        print(f"✗ WebPush error: {e}")
        if e.response:
            print(f"  Status: {e.response.status_code}")
            print(f"  Body: {e.response.text}")
    except Exception as e:
        print(f"✗ Error: {type(e).__name__}: {e}")
    
    client.close()

asyncio.run(test_push())
EOF

deactivate
