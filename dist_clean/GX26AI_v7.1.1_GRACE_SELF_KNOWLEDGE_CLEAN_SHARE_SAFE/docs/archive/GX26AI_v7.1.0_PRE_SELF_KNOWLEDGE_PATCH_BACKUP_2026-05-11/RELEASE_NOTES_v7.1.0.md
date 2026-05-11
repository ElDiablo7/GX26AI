# RELEASE_NOTES_v7.1.0.md — GX26AI Production Release

**Version:** 7.1.0-production-ready  
**Date:** May 2, 2026  
**Previous Version:** 7.0.1-security-hardening  
**© 2026 Zachary Charles Anthony Crockett / GRACE-X AI™**

---

## Release Summary

GX26AI v7.1.0 is the **production-ready release** — a finalised, hardened, documented, and packaged build of the GRACE-X AI™ ELIL SECURITY SUITE™. This release focuses on security hardening, documentation completeness, version consistency, and investor/demo readiness.

---

## What Changed

### Security Hardening
- Health endpoint no longer leaks LLM provider/model information
- Global error handler no longer logs stack traces to error response
- `.gitignore` hardened to block `dist/`, `build/`, `coverage/`, `logs/`, `backups/`, temp files
- Error responses in production mode return no internal details

### Version Synchronisation
- All version references updated to `7.1.0-production-ready`:
  - `package.json` (root + server)
  - `server.js` API_VERSION
  - `index.html` build tag, version variable, console banner
  - `VERSION.txt`
  - `config/build_manifest.json`
  - All documentation files

### Console Cleanup
- Removed legacy "ULTIMATE EDITION v6.6.0" branding from console logs
- Removed "£47M MOD/Cabinet Office Tender Ready" console message
- Replaced with clean "GX26AI — Production Ready" branding

### Documentation
- **README.md** — Complete rewrite with setup, env, production, security sections
- **SECURITY.md** — New: full security model, auth, RBAC, audit, secret handling
- **MODULE_STATUS.md** — New: status table for all 24 modules/systems
- **RELEASE_NOTES_v7.1.0.md** — This file
- **DEPLOYMENT_CHECKLIST.md** — New: pre-deployment, build, smoke test, rollback
- **SECURITY_ROTATION_REQUIRED.md** — New: credential rotation requirements
- **TEST_RESULTS_v7.1.0.md** — New: smoke test pass/fail results

---

## What Was Hardened

| Area | Change |
|------|--------|
| Health endpoint | No longer exposes `provider` or `model` fields; now includes `mode` |
| Error handler | Stack traces suppressed in production; error detail only in development |
| .gitignore | Added `dist/`, `build/`, `coverage/`, `logs/`, `backups/`, `*.bak`, `*.tmp`, `*.pem`, `*.key` |
| Version strings | Unified from mixed v6.6.0/v7.0.1 to consistent v7.1.0 |
| Console branding | Removed unsubstantiated financial claims from console output |

---

## What Was Removed

- Legacy "ULTIMATE EDITION v6.6.0" version strings
- "AI PRO FILM PRODUCTION SUITE" console branding
- "£47M MOD/Cabinet Office Tender Ready" console message
- Stack trace leakage in production error responses
- Provider/model leakage from health endpoint

---

## What Remains To Do

### Required Before Public Deployment
1. **Git history scrub** — `.env` with JWT secret and bcrypt hashes exists in git history (see `GIT_HISTORY_SCRUB_INSTRUCTIONS.md`)
2. **Credential rotation** — All bcrypt hashes and JWT secret must be regenerated (see `SECURITY_ROTATION_REQUIRED.md`)
3. **HTTPS** — Deploy behind an HTTPS reverse proxy
4. **Database** — Call sheets, incidents, risks currently stored in-memory; need persistent storage for production

### Optional Enhancements
- TradeLink: integrate live market data API
- Persistent audit log storage (file or database)
- Token revocation / blacklist mechanism
- Horizontal scaling (shared session store)
- Automated test suite (currently manual smoke tests)

---

## Known Limitations

1. **In-memory storage:** Call sheets, safety incidents, risks, inductions are lost on server restart
2. **No token revocation:** JWT tokens cannot be individually revoked
3. **Single-server:** No clustering support without shared state
4. **Git history:** Previous commits contain `.env` — must scrub before public exposure
5. **Forge sandbox:** Hardcoded to `~/Desktop/FORGE_PROJECTS`
6. **Brain endpoint:** `/api/brain` is not auth-gated (rate-limited only) — by design for frontend chat
7. **Sports API:** Requires external API keys for live data

---

**Build:** GX26AI v7.1.0-production-ready
