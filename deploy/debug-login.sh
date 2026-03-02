#!/bin/bash

cd /opt/espresso-beso/backend
source venv/bin/activate

python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

async def debug_and_fix():
    print("=== DEBUGGING LOGIN ISSUE ===\n")
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'espresso_beso')
    
    print(f"MongoDB URL: {mongo_url}")
    print(f"Database: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Step 1: Create admin with fresh hash
    print("\n[1] Creating admin...")
    password = "MXmedia007"
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    await db.admin_users.delete_many({})
    
    admin = {
        "id": "admin-001",
        "email": "pzsuave007@gmail.com",
        "password_hash": password_hash,
        "name": "Paul",
        "created_at": "2026-03-01T00:00:00Z"
    }
    
    result = await db.admin_users.insert_one(admin)
    print(f"Admin inserted with _id: {result.inserted_id}")
    
    # Step 2: Read it back
    print("\n[2] Reading admin from database...")
    stored_admin = await db.admin_users.find_one({"email": "pzsuave007@gmail.com"})
    if stored_admin:
        print(f"Found admin: {stored_admin['email']}")
        print(f"Stored hash: {stored_admin['password_hash']}")
    else:
        print("ERROR: Admin not found in database!")
        return
    
    # Step 3: Test password verification
    print("\n[3] Testing password verification...")
    stored_hash = stored_admin['password_hash']
    test_password = "MXmedia007"
    
    try:
        is_valid = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
        print(f"Password verification result: {is_valid}")
        
        if is_valid:
            print("\n✓ SUCCESS! Password verification works!")
            print("\nCredentials:")
            print("  Email: pzsuave007@gmail.com")
            print("  Password: MXmedia007")
        else:
            print("\n✗ FAILED: Password doesn't match")
    except Exception as e:
        print(f"ERROR during verification: {e}")
    
    # Step 4: List all collections
    print("\n[4] All collections in database:")
    collections = await db.list_collection_names()
    for col in collections:
        count = await db[col].count_documents({})
        print(f"  - {col}: {count} documents")
    
    client.close()

asyncio.run(debug_and_fix())
EOF

deactivate
