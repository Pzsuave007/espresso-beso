#!/bin/bash

#############################################
# Create Admin - Using Python on your server
#############################################

cd /opt/espresso-beso/backend
source venv/bin/activate

python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

async def create_admin():
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'espresso_beso')]
    
    # Hash password using server's bcrypt
    password = "MXmedia007"
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Delete existing and create new admin
    await db.admin_users.delete_many({})
    
    admin = {
        "id": "admin-001",
        "email": "pzsuave007@gmail.com",
        "password_hash": password_hash,
        "name": "Paul",
        "created_at": "2026-03-01T00:00:00Z"
    }
    
    await db.admin_users.insert_one(admin)
    
    # Verify it was created
    created = await db.admin_users.find_one({"email": "pzsuave007@gmail.com"})
    if created:
        print("✓ Admin created successfully!")
        print(f"Email: pzsuave007@gmail.com")
        print(f"Password: MXmedia007")
        print(f"Hash: {password_hash}")
    else:
        print("✗ Failed to create admin")
    
    client.close()

asyncio.run(create_admin())
EOF

deactivate

echo ""
echo "Now try logging in at: https://espressobeso.com/admin/login"
