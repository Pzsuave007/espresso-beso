#!/bin/bash

#############################################
# Add API Keys to Espresso Beso
# 
# INSTRUCTIONS:
# 1. Create a file called "my_keys.txt" in /root/espresso-beso/
# 2. Paste your keys in this format (one per line):
#    STRIPE_SECRET_KEY=sk_live_xxxxx
#    STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
# 3. Run this script: sudo ./deploy/add-keys.sh
#############################################

KEYS_FILE="/root/espresso-beso/my_keys.txt"
ENV_FILE="/opt/espresso-beso/backend/.env"

echo "=== Adding API Keys ==="

if [ ! -f "$KEYS_FILE" ]; then
    echo ""
    echo "ERROR: Keys file not found!"
    echo ""
    echo "Please create the file: $KEYS_FILE"
    echo ""
    echo "With this content (paste your actual keys):"
    echo "---"
    echo "STRIPE_SECRET_KEY=sk_live_your_key_here"
    echo "STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here"
    echo "---"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "Found keys file: $KEYS_FILE"

# Read keys from file and add to .env
while IFS= read -r line; do
    # Skip empty lines and comments
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    
    KEY_NAME=$(echo "$line" | cut -d'=' -f1)
    
    # Remove old key if exists
    grep -v "^$KEY_NAME=" "$ENV_FILE" > /tmp/env_temp
    
    # Add new key
    echo "$line" >> /tmp/env_temp
    mv /tmp/env_temp "$ENV_FILE"
    
    echo "  ✓ Added $KEY_NAME"
done < "$KEYS_FILE"

echo ""
echo "Current .env contents:"
cat "$ENV_FILE"

echo ""
echo "Restarting backend..."
systemctl restart espresso-backend
sleep 2

if systemctl is-active --quiet espresso-backend; then
    echo "✓ Backend is running"
else
    echo "✗ Backend failed to start"
    journalctl -u espresso-backend -n 10 --no-pager
fi

echo ""
echo "=== Done! ==="
echo ""
echo "You can now delete the keys file for security:"
echo "  rm $KEYS_FILE"
