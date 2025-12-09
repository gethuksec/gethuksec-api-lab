# 🚀 Deployment Guide

OWASP API Security Lab deployment instructions for various environments.

---

## 📋 Table of Contents

- [Quick Start (Local)](#quick-start-local)
- [Docker Deployment](#docker-deployment)
- [VPS / Cloud Server](#vps--cloud-server)
- [Static Guide Hosting](#static-guide-hosting)
- [Production Considerations](#production-considerations)

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+ 
- npm 9+

### Steps

```bash
# 1. Clone repository
git clone https://github.com/gethuksec/gethuksec-api-lab.git
cd owasp-api-security-lab

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open guide.html in browser
# API runs at http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run seed` | Seed database with sample data |
| `npm run reset` | Reset database to fresh state |

---

## Docker Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Build and run
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 2: Docker Only

```bash
# Build image
docker build -t owasp-api-lab .

# Run container
docker run -d \
  --name owasp-api-lab \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  owasp-api-lab
```

### Access Points
- **API**: http://localhost:3000
- **Health**: http://localhost:3000/health
- **Swagger Docs**: http://localhost:3000/api/docs
- **Guide**: Open `guide.html` in browser

---

## VPS / Cloud Server

### Prerequisites
- Ubuntu 20.04+ / Debian 11+
- Docker & Docker Compose installed
- Domain name (optional)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Deploy Application

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/owasp-api-security-lab.git
cd owasp-api-security-lab

# Create data directory
mkdir -p data

# Start with Docker Compose
docker-compose up -d --build

# Verify running
docker-compose ps
curl http://localhost:3000/health
```

### Step 3: Nginx Reverse Proxy (Optional)

If you want to serve on port 80/443 with SSL:

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/owasp-lab
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
    }

    # Static guide (if hosting guide.html on same server)
    location / {
        root /var/www/owasp-lab;
        index guide.html;
        try_files $uri $uri/ /guide.html;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/owasp-lab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Copy guide.html to web root
sudo mkdir -p /var/www/owasp-lab
sudo cp guide.html /var/www/owasp-lab/
```

### Step 4: SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (already configured by certbot)
sudo systemctl status certbot.timer
```

---

## Static Guide Hosting

The `guide.html` is a standalone file that can be hosted separately from the API.

### Option 1: GitHub Pages

1. Create a new repository or use existing
2. Upload `guide.html` 
3. Enable GitHub Pages in Settings → Pages
4. Access at: `https://username.github.io/repo-name/guide.html`

### Option 2: Netlify / Vercel

```bash
# Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=. 

# Or drag & drop guide.html to Netlify dashboard
```

### Option 3: Any Static Host

Upload `guide.html` to:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Blob Storage
- Any web server (Apache, Nginx)

### Important: Update API URL

If hosting guide separately, update the API base URL in `guide.html`:

```javascript
// Find and replace localhost:3000 with your API server
const API_BASE = 'https://your-api-server.com';
```

---

## Production Considerations

### ⚠️ Security Warning

This is an **intentionally vulnerable** application for educational purposes.

**DO NOT:**
- ❌ Deploy on production networks
- ❌ Use real user data
- ❌ Expose to public internet without restrictions

**DO:**
- ✅ Use in isolated lab environments
- ✅ Restrict access with VPN or IP whitelist
- ✅ Use for training/CTF purposes only

### Recommended Setup for Training

```bash
# Run with restricted network access
docker run -d \
  --name owasp-api-lab \
  -p 127.0.0.1:3000:3000 \
  --network none \
  owasp-api-lab

# Or use Docker network isolation
docker network create --internal lab-network
docker run -d \
  --name owasp-api-lab \
  --network lab-network \
  owasp-api-lab
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `DATABASE_PATH` | ./data/lab.db | SQLite database path |
| `JWT_SECRET` | (hardcoded) | JWT signing secret |
| `ENABLE_VULNERABLE_ENDPOINTS` | true | Enable vuln endpoints |

---

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs api

# Rebuild
docker-compose down
docker-compose up -d --build --force-recreate
```

### Database issues
```bash
# Reset database
docker-compose exec api npm run reset

# Or delete and restart
rm -rf data/lab.db
docker-compose restart
```

### Port already in use
```bash
# Find process
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac

# Kill process or use different port
docker-compose down
# Edit docker-compose.yml: "3001:3000"
docker-compose up -d
```

---

## Support

- 📖 [OWASP API Security Project](https://owasp.org/API-Security/)
- 🐛 [Report Issues](https://github.com/YOUR_USERNAME/owasp-api-security-lab/issues)
- 💬 Questions? Open a discussion!

---

**Built with ❤️ by Gethuk Security**

