# GX26AI — GRACE-X AI™ ELIL SECURITY SUITE™

**Version:** 7.1.0-production-ready  
**© 2026 Zachary Charles Anthony Crockett. All rights reserved.**

---

## What is GX26AI?

GX26AI is a modular AI governance and security console built under the **GRACE-X AI™** brand. It provides a unified dashboard for AI-powered security operations, governance, threat intelligence, and modular vertical tooling — designed for enterprise, defence, and government-grade use cases.

The system integrates with multiple LLM providers (OpenAI, Anthropic Claude, OpenRouter, Ollama) and wraps them in a branded, role-controlled environment with audit logging, RBAC, and 2FA authentication.

## What Problem Does It Solve?

- **Centralised AI Operations:** Single interface for multiple AI-powered security, governance, and business modules.
- **Role-Based Access Control:** Master / Operator / Viewer roles with server-side enforcement.
- **Audit-Grade Logging:** All security-relevant actions are logged with tamper-evident SHA-256 hash chains.
- **Modular Architecture:** 18+ operational modules (SENTINEL, TITAN, Forge, OSINT, etc.) with consistent UI/UX.
- **Multi-Provider AI:** Swap between LLM providers without frontend changes.

## Who Is It For?

- Security operations teams
- Government & defence stakeholders
- Enterprise AI governance teams
- Investors evaluating AI security platforms
- Technical partners assessing integration readiness

---

## Quick Start

### Prerequisites

- **Node.js 18+** installed
- A supported LLM API key (OpenAI, Anthropic, or OpenRouter)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/ElDiablo7/GX26AI.git
cd GX26AI

# 2. Install server dependencies
cd server
npm install

# 3. Create your environment file
cp .env.example .env

# 4. Generate credential hashes
#    Edit generate-hashes.js with your chosen passwords first
node generate-hashes.js
#    Copy the output hashes into .env

# 5. Set your LLM API key in .env
#    Edit the API_KEY or provider-specific key

# 6. Start the server
npm start
```

### Access

Open **http://localhost:3000** in your browser.

You will be presented with the Security Wall. Authenticate with:
1. **Access Key** (your master password — verified server-side)
2. **2FA Token** (your 6-digit token — verified server-side)

---

## Environment Variables

All configuration is in `server/.env`. Copy from `server/.env.example`.

| Variable | Required | Description |
|----------|----------|-------------|
| `API_KEY` | Yes | Your LLM API key |
| `LLM_PROVIDER` | Yes | `openai`, `anthropic`, `openrouter`, or `ollama` |
| `JWT_SECRET` | Yes | Random string ≥64 chars for session signing |
| `AUTH_MASTER_HASH` | Yes | bcrypt hash of master password |
| `AUTH_TOKEN_HASH` | Yes | bcrypt hash of 2FA token |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `RATE_LIMIT_MAX` | No | Max requests per window (default: 30) |

See `server/.env.example` for the complete list.

---

## Running in Production

```bash
# Set environment
export NODE_ENV=production

# Use production CORS origins
# In .env: CORS_ORIGINS=https://your-domain.com

# Start
cd server
node server.js
```

**Production checklist:**
1. Set `NODE_ENV=production`
2. Use a strong, unique `JWT_SECRET`
3. Restrict `CORS_ORIGINS` to your domain
4. Use HTTPS (via reverse proxy: nginx, Caddy, etc.)
5. Rotate all credentials from development
6. Review `DEPLOYMENT_CHECKLIST.md`

---

## Demo Mode

The system includes a **READ-ONLY DEMO** toggle in the sidebar. When enabled:
- Tasking / targeting / export buttons are disabled
- All modules remain viewable
- No destructive actions are possible

> ⚠️ **Demo Warning:** Demo mode is for demonstrations only. Never expose demo credentials in a production environment. Always generate fresh bcrypt hashes for production use.

---

## Security Model

- **Authentication:** Server-side bcrypt password verification + JWT sessions + optional 2FA
- **RBAC:** Master / Dee / Operator roles with endpoint-level enforcement
- **Audit:** SHA-256 hash chain audit logging
- **Forge:** Path-validated file operations restricted to `~/Desktop/FORGE_PROJECTS`
- **Headers:** Helmet security headers on all responses
- **Rate Limiting:** Configurable per-IP rate limiting
- **CORS:** Whitelist-based origin control

See `SECURITY.md` for full details.

---

## Project Structure

```
GX26AI/
├── index.html              # Main SPA entry point
├── secure_warning_lock.html # Security Wall (auth gate)
├── server/
│   ├── server.js           # Express backend (all API routes)
│   ├── auth.js             # bcrypt + JWT auth module
│   ├── sports-api.js       # Sports data integration
│   ├── .env.example        # Environment template
│   └── generate-hashes.js  # Credential hash generator
├── assets/
│   ├── css/                # All stylesheets
│   ├── js/                 # All frontend JavaScript
│   └── img/                # Logos and module images
├── modules/                # HTML templates for each module
├── config/                 # Build manifest, voice, audio config
└── docs/                   # Additional documentation
```

---

## ⚠️ Security Warning

- **Never commit** `server/.env` to version control
- **Always rotate** credentials if you suspect exposure
- **Review** `SECURITY_ROTATION_REQUIRED.md` before first deployment
- **Run** `GIT_HISTORY_SCRUB_INSTRUCTIONS.md` if `.env` was ever committed

---

**Build:** GX26AI v7.1.0-production-ready  
**Last Updated:** May 2, 2026  
**© 2026 Zachary Charles Anthony Crockett / GRACE-X AI™**
