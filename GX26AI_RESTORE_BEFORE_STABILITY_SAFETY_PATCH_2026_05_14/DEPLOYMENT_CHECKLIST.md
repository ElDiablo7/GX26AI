# DEPLOYMENT_CHECKLIST.md — GX26AI Production Deployment

**Version:** 7.1.0-production-ready  
**© 2026 Zachary Charles Anthony Crockett / GRACE-X AI™**

---

## Pre-Deployment Checks

- [ ] All code changes reviewed and committed
- [ ] Version strings consistent (v7.1.0) across all files
- [ ] No `.env` files in the deployment package
- [ ] No `node_modules/` in the deployment package
- [ ] No `.git/` directory in the deployment package
- [ ] `server/.env.example` included as reference
- [ ] All documentation files included

---

## Environment Setup

### 1. Server Requirements

- **Node.js 18+** (LTS recommended)
- **npm 9+**
- **HTTPS reverse proxy** (nginx, Caddy, Apache, or cloud load balancer)
- **Sufficient RAM** (minimum 512MB, recommended 1GB+)

### 2. Environment File

```bash
cd server
cp .env.example .env
```

### 3. Generate Credentials

```bash
# Edit generate-hashes.js with your chosen passwords
nano generate-hashes.js

# Generate hashes
node generate-hashes.js

# Copy output into .env
# IMPORTANT: Clear plaintext from generate-hashes.js after use
```

### 4. Required Environment Variables

```env
NODE_ENV=production
JWT_SECRET=<64+ random characters>
AUTH_MASTER_HASH=<bcrypt hash>
AUTH_TOKEN_HASH=<bcrypt hash>
API_KEY=<your LLM API key>
LLM_PROVIDER=openai|anthropic|openrouter|ollama
CORS_ORIGINS=https://your-production-domain.com
```

---

## Secret Rotation

Before first deployment, you MUST:

1. **Generate a new JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

2. **Generate new password hashes:**
   ```bash
   node server/generate-hashes.js
   ```

3. **Set fresh API keys** — do not reuse development keys

4. **Review** `SECURITY_ROTATION_REQUIRED.md` for full rotation list

---

## Build / Run Commands

### Install

```bash
# From project root
cd server
npm install --production
```

### Start (Production)

```bash
cd server
NODE_ENV=production node server.js
```

### Start (With Process Manager)

```bash
# Using PM2 (recommended for production)
npm install -g pm2
cd server
NODE_ENV=production pm2 start server.js --name gx26ai
pm2 save
pm2 startup
```

### Verify

```bash
curl -s http://localhost:3000/health | python -m json.tool
```

Expected response:
```json
{
  "status": "ok",
  "service": "GRACE-X AI™ ENLIL SECURITY SUITE™ Brain API",
  "version": "7.1.0",
  "mode": "production",
  "timestamp": "...",
  "uptime": 5
}
```

---

## Smoke Test Checklist

### Backend

- [ ] `npm install` completes without errors
- [ ] Server starts without crashing
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `POST /api/auth/login` with valid password returns JWT
- [ ] `POST /api/auth/login` with invalid password returns 401
- [ ] `GET /api/auth/verify` without token returns 401
- [ ] `GET /api/auth/verify` with valid token returns 200
- [ ] `POST /api/forge/save-file` without auth returns 401
- [ ] Rate limiting triggers after configured threshold

### Frontend

- [ ] `http://localhost:3000/` loads Security Wall
- [ ] Security Wall accepts valid credentials
- [ ] Main dashboard loads after authentication
- [ ] Sidebar module buttons navigate correctly
- [ ] No fatal JavaScript errors in browser console
- [ ] GRACE-X branding visible in footer and sidebar
- [ ] Version shows v7.1.0

### Security

- [ ] `NODE_ENV=production` is set
- [ ] `CORS_ORIGINS` is restricted to production domain
- [ ] JWT_SECRET is unique and ≥64 characters
- [ ] No `.env` files in public-facing directories
- [ ] Error responses do not contain stack traces
- [ ] Health endpoint does not leak provider/model info

---

## Reverse Proxy Setup (nginx example)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Rollback Notes

### If Deployment Fails

1. Stop the new server: `pm2 stop gx26ai` or `Ctrl+C`
2. Restore previous version from backup
3. Restart: `cd server && node server.js`
4. Verify: `curl http://localhost:3000/health`

### Creating a Backup Before Deployment

```bash
# Before deploying new version
cp -r /path/to/gx26ai /path/to/gx26ai-backup-$(date +%Y%m%d)
```

### Database Considerations

Currently using in-memory storage — no database migration needed. If migrated to persistent storage in future, maintain migration scripts.

---

**Build:** GX26AI v7.1.0-production-ready  
**Last Updated:** May 2, 2026
