# SECURITY.md — GX26AI Security Model

**Version:** 7.1.0-production-ready  
**© 2026 Zachary Charles Anthony Crockett / GRACE-X AI™**

---

## Security Architecture Overview

GX26AI implements a multi-layered security model designed for enterprise and government-grade deployments.

```
┌─────────────────────────────────────────────┐
│  CLIENT (Browser)                           │
│  - Session token (JWT) stored in session    │
│  - No credentials stored client-side        │
│  - Security Wall enforced per session       │
└──────────────────┬──────────────────────────┘
                   │ HTTPS / Bearer Token
┌──────────────────▼──────────────────────────┐
│  EXPRESS SERVER                              │
│  ├─ Helmet security headers                 │
│  ├─ CORS whitelist                          │
│  ├─ Rate limiting (per-IP)                  │
│  ├─ JSON body size limits                   │
│  ├─ Request ID tracking                     │
│  ├─ Request timeout enforcement             │
│  ├─ Auth middleware (JWT verification)       │
│  └─ Role-based endpoint access              │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  AUTHENTICATION MODULE (auth.js)            │
│  ├─ bcrypt password hashing (cost 12)       │
│  ├─ JWT session signing                     │
│  ├─ 2FA token verification                  │
│  ├─ Multi-role support                      │
│  └─ Configurable expiry                     │
└─────────────────────────────────────────────┘
```

---

## Authentication Approach

### Flow

1. **Security Wall** (`secure_warning_lock.html`) — presented on every new browser session
2. **Step 1:** Password submitted to `POST /api/auth/login` — verified server-side against bcrypt hash
3. **Step 2:** If 2FA configured, 6-digit token submitted to `POST /api/auth/verify-2fa`
4. **Step 3:** JWT session token issued — stored in `sessionStorage` (not `localStorage`)
5. **Subsequent requests:** Bearer token in `Authorization` header

### Credential Storage

- **Passwords:** Stored as bcrypt hashes (cost factor 12) in `server/.env`
- **JWT Secret:** Environment variable (`JWT_SECRET`), minimum 64 characters recommended
- **No plaintext credentials** exist in source code or client-side JavaScript
- **No credentials** are transmitted to the browser except the JWT session token

### Fallback Safety

- If `JWT_SECRET` is not set in `.env`, the server uses an insecure fallback and logs a warning
- This is acceptable ONLY for local development — never for production

---

## RBAC Model

| Role | Access Level | Description |
|------|-------------|-------------|
| **Master** | Full | All modules, all endpoints, admin functions |
| **Dee** | Full | Same as Master (named user account) |
| **Operator** | Standard | All modules, restricted admin/Forge functions |
| **Viewer** | Read-only | Read-only demo mode (sidebar toggle) |

### Endpoint Protection

| Endpoint Category | Auth Required | Min Role |
|-------------------|---------------|----------|
| `/health`, `/healthz` | No | — |
| `/api/info`, `/api/providers` | No | — |
| `/api/auth/login` | No | — |
| `/api/auth/verify-2fa` | No | — |
| `/api/brain` | No (rate-limited) | — |
| `/api/auth/verify` | Yes | Any |
| `/api/auth/logout` | Yes | Any |
| `/api/forge/*` | Yes | Operator+ |
| `/api/callsheets/create` | Yes | Operator+ |
| `/api/safety/incident` (POST) | Yes | Operator+ |
| `/api/sports/cache/clear` | Yes | Operator+ |

---

## Audit Logging Model

### What Is Logged

- Login attempts (success and failure)
- 2FA verification attempts
- Logout events
- All API requests (method, path, status, duration)
- Forge file operations
- Rate limit violations
- Server errors

### Log Format

```
[TIMESTAMP] [LEVEL] MESSAGE {requestId: "gx-..."}
```

### Frontend Audit Chain

The frontend SENTINEL/TITAN governance modules maintain a SHA-256 hash chain for tamper-evident audit logs. Each entry includes:
- Timestamp
- Action type
- Actor role
- Previous hash (chain integrity)
- Current hash (SHA-256 via Web Crypto API)

### What Is NOT Logged

- Passwords or credential values
- API keys
- JWT token contents
- Full request/response bodies

---

## Secret Handling Policy

1. **All secrets** must be stored in `server/.env` (never committed)
2. **Credential hashes** are generated via `node server/generate-hashes.js`
3. **The generator script** ships with placeholder values — never real passwords
4. **`.gitignore`** blocks all `.env` and `.env.*` files
5. **`server/.env.example`** contains only placeholder values
6. **No API keys, passwords, or tokens** exist in committed source code

---

## Production Deployment Checklist

### Before Deployment

- [ ] Set `NODE_ENV=production` in environment
- [ ] Generate a fresh `JWT_SECRET` (≥64 random characters)
- [ ] Generate fresh bcrypt hashes for all passwords
- [ ] Set real API keys in environment (not in committed files)
- [ ] Restrict `CORS_ORIGINS` to production domain only
- [ ] Deploy behind HTTPS reverse proxy (nginx, Caddy, etc.)
- [ ] Remove or restrict `/api/brain/test` endpoint
- [ ] Verify rate limiting is active
- [ ] Review Forge base directory configuration
- [ ] Run git history scrub if `.env` was ever committed (see `GIT_HISTORY_SCRUB_INSTRUCTIONS.md`)

### Ongoing

- [ ] Rotate JWT_SECRET periodically (invalidates all sessions)
- [ ] Monitor audit logs for failed login patterns
- [ ] Review rate limit settings based on usage
- [ ] Keep Node.js and npm dependencies updated

---

## Known Limitations

1. **Session storage:** JWT tokens are stored in `sessionStorage` — not persistent across tabs in some browsers
2. **No token revocation:** JWTs cannot be individually revoked; rotating `JWT_SECRET` revokes all
3. **In-memory data:** Call sheets, incidents, risks, inductions are stored in-memory and lost on restart
4. **Single-server:** No clustering or horizontal scaling without shared session store
5. **Forge path:** File operations are sandboxed to `~/Desktop/FORGE_PROJECTS` — configurable but hardcoded at startup
6. **Brain endpoint:** `/api/brain` is rate-limited but not auth-gated (by design, for frontend chat)
7. **Git history:** Previous commits may contain `.env` — run history scrub before public exposure

---

**Build:** GX26AI v7.1.0-production-ready  
**Last Updated:** May 2, 2026
