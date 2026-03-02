#!/bin/bash

echo "=== Adding PayPal Credentials ==="

ENV_FILE="/opt/espresso-beso/backend/.env"

if grep -q "PAYPAL_CLIENT_ID" "$ENV_FILE"; then
    echo "PayPal credentials already exist"
else
    echo ""
    echo "Please add your PayPal keys to $ENV_FILE:"
    echo "  PAYPAL_CLIENT_ID=your_client_id_here"
    echo "  PAYPAL_SECRET=your_secret_here"
    echo ""
fi

systemctl restart espresso-backend
