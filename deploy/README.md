# Espresso Beso - Deployment Scripts

## Quick Start

### Initial Setup (Run Once)
```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/espresso-beso.git
cd espresso-beso

# Run setup script
chmod +x deploy/setup.sh
sudo ./deploy/setup.sh
```

### Updates (Run Anytime)
```bash
cd /path/to/espresso-beso
sudo ./deploy/update.sh
```

---

## What the Scripts Do

### `setup.sh` - Initial Setup
Installs and configures everything on a fresh Ubuntu/Debian server:
- Node.js 20 LTS + Yarn
- Python 3 + pip + venv
- MongoDB 7.0
- Nginx (reverse proxy)
- Creates systemd service for backend
- Configures Nginx to serve frontend + proxy API
- Creates template .env files

### `update.sh` - Updates
One command to update your server:
- Pulls latest code from GitHub
- Updates backend Python dependencies
- Updates frontend Node dependencies
- Rebuilds frontend for production
- Restarts all services

---

## Configuration Files

After running `setup.sh`, update these files:

### Backend: `/backend/.env`
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=espresso_beso
JWT_SECRET=your-secret-key-here
```

### Frontend: `/frontend/.env`
```env
REACT_APP_BACKEND_URL=https://yourdomain.com
REACT_APP_PAYPAL_CLIENT_ID=your-paypal-client-id
```

### Nginx: `/etc/nginx/sites-available/espresso-beso`
Update `server_name` with your domain.

---

## Useful Commands

### Service Management
```bash
# Backend
sudo systemctl status espresso-backend
sudo systemctl restart espresso-backend
sudo journalctl -u espresso-backend -f  # View logs

# Nginx
sudo systemctl status nginx
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log

# MongoDB
sudo systemctl status mongod
```

### Manual Operations
```bash
# Rebuild frontend only
cd frontend && yarn build

# Restart backend only
sudo systemctl restart espresso-backend
```

---

## SSL/HTTPS Setup (Optional)

After setup, add SSL with Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u espresso-backend -n 50

# Test manually
cd /path/to/espresso-beso/backend
source venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8001
```

### Frontend not updating
```bash
# Clear browser cache or try incognito
# Rebuild frontend
cd frontend && yarn build
sudo systemctl reload nginx
```

### MongoDB connection issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check connection
mongosh
```
