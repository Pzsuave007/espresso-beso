#!/bin/bash

# Fix Nginx config for espressobeso.com

cat > /etc/nginx/conf.d/espresso-beso.conf << 'EOF'
server {
    listen 80;
    server_name espressobeso.com www.espressobeso.com;

    # Frontend (React build)
    location / {
        root /root/espresso-beso/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

echo "Testing nginx config..."
nginx -t && systemctl restart nginx

echo "Done! Nginx status:"
systemctl is-active nginx && echo "✓ Nginx is running" || echo "✗ Nginx failed"
