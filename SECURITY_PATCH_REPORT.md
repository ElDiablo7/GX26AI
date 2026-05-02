# 🛡️ SECURITY PATCH REPORT — v7.0.1-security-hardening

**Date:** 2 May 2026  
**Previous Version:** v7.0.0 / v6.6.0 ULTIMATE  
**New Version:** v7.0.1-security-hardening  
**Author:** Security hardening pass  
**Scope:** P0 critical security fixes + P1 cleanup

---

## Summary

This patch converts GX26AI from a client-side-locked prototype into a backend-authenticated, credential-hardened pre-production build.

---

## Critical Changes (P0)

### 1. Server-Side Authentication

- **NEW:** `server/auth.js` — bcrypt password hashing + JWT session tokens
- **NEW:** `server/generate-hashes.js` — utility to generate bcrypt hashes
- **NEW:** `POST /api/auth/login` — password verification endpoint
- **NEW:** `POST /api/auth/verify-2fa` — 2FA token verification endpoint
- **NEW:** `GET /api/auth/verify` — session validation endpoint
- **NEW:** `POST /api/auth/logout` — session termination endpoint
- All authentication now happens server-side
- Frontend submits credentials to backend; backend returns JWT
- JWT required for all protected endpoints

### 2. Client-Side Credentials Removed

| File | Change |
|------|--------|
| `secure_warning_lock.html` | All hardcoded passwords, PINs, and tokens removed |
| `assets/js/governance/titan-sentinel-core.js` | Both `validPins` arrays replaced with server API calls |
| `assets/js/governance/sentinel-ui.js` | Hardcoded PIN fallback removed |
| `CREDENTIALS_REFERENCE.md` | Replaced with safe template (no real values) |
| `docs/LOGIN_DETAILS.md` | Replaced with safe template (no real values) |
| `SECURITY_WALL_DOCUMENTATION.md` | All credential examples sanitized |

### 3. Protected Endpoints

All sensitive write/read endpoints now require `Authorization: Bearer <token>`:

- `POST /api/forge/save-file`
- `POST /api/forge/read-file`
- `POST /api/forge/list-directory`
- `POST /api/forge/delete-file`
- `POST /api/sports/cache/clear`
- `POST /api/callsheets/create`
- `POST /api/safety/incident`

### 4. Forge Path Validation Hardened

- Rejects `..` traversal sequences
- Rejects URL-encoded traversal (`%2e`, `%2f`, `%5c`)
- Rejects absolute paths from client
- Blocks `.env`, `.key`, `.pem`, `.cert`, `.secret` extensions
- 10MB file size limit constant added
- Path containment uses separator-aware check

### 5. CORS Restricted

- Changed from `CORS_ORIGINS=*` to `CORS_ORIGINS=http://localhost:8080,http://localhost:3000,http://127.0.0.1:8080`
- Production deployment should set to the specific production URL

### 6. SHA-256 Audit Chain

- `assets/js/core/core.audit.js` — replaced fake `sha256ish()` (DJB2) with real SHA-256 via Web Crypto API
- Fallback to clearly-labeled DJB2 for environments without `crypto.subtle`
- Added `verifyChain()` function for integrity checks

### 7. Environment Configuration

- **NEW:** `server/.env.example` — clean template with placeholders only
- `.env` CORS fixed to specific origins
- Auth hash fields added: `AUTH_MASTER_HASH`, `AUTH_DEE_HASH`, `AUTH_GENERAL_HASH`, `AUTH_TOKEN_HASH`, `AUTH_PIN_HASHES`, `JWT_SECRET`

---

## Cleanup Changes (P1)

### 8. Version Synchronised

All references now read `7.0.1-security-hardening`:
- `package.json` (root)
- `server/package.json`
- `VERSION.txt`
- `config/build_manifest.json`
- `index.html` build tag

### 9. License Corrected

- Changed from `MIT` to `UNLICENSED` in both `package.json` files
- Added `"private": true` to prevent accidental publishing
- README updated to state proprietary status

### 10. .gitignore Hardened

Now excludes: `.env`, `.env.*`, `CREDENTIALS_REFERENCE.md`, `docs/LOGIN_DETAILS.md`, `*.secret`, `credentials.json`, `tokens.json`

### 11. Old Files Archived

Moved to `docs/archive/legacy-index-files/`:
- `index_PATCHED.html`
- `index_clean.html`
- `index_old_backup.html`
- `index_v7.1_backup.html`

---

## Files Changed

| File | Action |
|------|--------|
| `server/auth.js` | **CREATED** — Auth module |
| `server/generate-hashes.js` | **CREATED** — Hash generator |
| `server/.env.example` | **CREATED** — Clean template |
| `server/server.js` | **MODIFIED** — Auth endpoints + middleware |
| `server/package.json` | **MODIFIED** — Version, license, deps |
| `server/.env` | **MODIFIED** — CORS restricted |
| `package.json` | **MODIFIED** — Version, license, private |
| `secure_warning_lock.html` | **MODIFIED** — Server-side auth |
| `index.html` | **MODIFIED** — Build tag version |
| `assets/js/governance/titan-sentinel-core.js` | **MODIFIED** — Server auth |
| `assets/js/governance/sentinel-ui.js` | **MODIFIED** — Removed PINs |
| `assets/js/core/core.audit.js` | **REWRITTEN** — Real SHA-256 |
| `CREDENTIALS_REFERENCE.md` | **REPLACED** — Safe template |
| `docs/LOGIN_DETAILS.md` | **REPLACED** — Safe template |
| `SECURITY_WALL_DOCUMENTATION.md` | **MODIFIED** — Sanitized |
| `VERSION.txt` | **REPLACED** — New version |
| `config/build_manifest.json` | **REPLACED** — New version |
| `README.md` | **MODIFIED** — Version + proprietary |
| `.gitignore` | **REPLACED** — Hardened |

---

## Remaining Known Risks

| Risk | Severity | Notes |
|------|----------|-------|
| `.env` still in git history (commits `f7c82db`, `e32aa89`) | HIGH | Requires `git filter-repo` or BFG — see `GIT_HISTORY_SCRUB_INSTRUCTIONS.md` |
| In-memory data storage (call sheets, incidents, risks) | MEDIUM | Data lost on restart; needs database for production |
| No RBAC — single role level | MEDIUM | All authenticated users have same access |
| `sanitizeInput()` only truncates | MEDIUM | No prompt injection mitigation |
| 1.4MB favicon.ico | LOW | Should be optimized |
| Some CSS files not linked in index.html | LOW | callsheets.css, risk-safety.css |

---

## How Auth Now Works

```
User opens app
  ↓
Security Wall loads (secure_warning_lock.html)
  ↓
User enters ACCESS KEY
  ↓
Browser sends POST /api/auth/login { password: "..." }
  ↓
Server verifies against bcrypt hash in .env
  ↓
If 2FA configured: returns preToken
  → User enters 2FA token
  → Browser sends POST /api/auth/verify-2fa { token, preToken }
  → Server verifies against AUTH_TOKEN_HASH
  ↓
Server returns signed JWT
  ↓
JWT stored in sessionStorage as 'gracex_auth_token'
  ↓
All protected API calls include: Authorization: Bearer <jwt>
```

---

## How to Set Up (New Deployment)

1. `cd server && npm install`
2. `cp .env.example .env`
3. Edit `generate-hashes.js` with your chosen passwords
4. `node generate-hashes.js` — copy output to `.env`
5. Clear passwords from `generate-hashes.js`
6. Set your LLM API keys in `.env`
7. `npm start`

---

## How to Rotate Credentials

1. Choose new passwords/PINs/tokens
2. Update `generate-hashes.js` with new values
3. Run `node generate-hashes.js`
4. Paste new hashes into `.env`
5. Clear plaintext from `generate-hashes.js`
6. Restart server

---

**Build:** v7.0.1-security-hardening  
**Status:** Pre-Production Hardened  
**© 2026 Zachary Charles Anthony Crockett / GRACE-X AI™**
