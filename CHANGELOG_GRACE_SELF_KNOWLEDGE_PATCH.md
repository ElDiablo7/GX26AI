# CHANGELOG — GRACE-X Self-Knowledge Patch

## GX26AI v7.1.1 — Grace Self-Knowledge Patch

**Date:** 2026-05-11  
**Previous Version:** GX26AI v7.1.0-production-ready  
**New Version:** GX26AI v7.1.1  
**Purpose:** Give Grace a canonical self-knowledge layer so she can explain herself truthfully and consistently.  
**Author:** Zachary Charles Anthony Crockett (Zac Crockett)

---

## Summary

This patch adds a central system knowledge layer to GRACE-X AI™ so that Grace can reliably answer questions about her identity, capabilities, modules, readiness states, known limits, and what needs to be fixed next. It also hardens several previously unprotected backend write routes.

---

## Files Created

| File | Purpose |
|------|---------|
| `server/system_knowledge/gracex_self_knowledge.json` | Canonical self-knowledge JSON — Grace's identity, modules, capabilities, limits, truth rules |
| `server/system_knowledge/gracex_truth_rules.json` | Supplementary truth rules file reinforcing honest self-reporting |
| `server/system_knowledge/gracex_self_test_questions.json` | Manual self-awareness test questions for QA |
| `modules/grace-self-knowledge.html` | Self-Knowledge UI module — shows system identity, modules, capabilities and lets users ask Grace questions |
| `CHANGELOG_GRACE_SELF_KNOWLEDGE_PATCH.md` | This changelog |
| `docs/archive/GX26AI_v7.1.0_PRE_SELF_KNOWLEDGE_PATCH_BACKUP_2026-05-11/` | Full backup of modified files before patch |

## Files Modified

| File | Change |
|------|--------|
| `server/server.js` | Version bump to 7.1.1; added self-knowledge loader/summarizer; added `/api/system/capabilities` endpoint; injected self-knowledge context into `/api/brain` system prompt; hardened 7 write routes with `auth.requireAuth` |
| `package.json` | Version bump to 7.1.1 |
| `server/package.json` | Version bump to 7.1.1 |
| `index.html` | Version bump to 7.1.1 in build tag, console log, JS variable; added Self-Knowledge navigation button |
| `.gitignore` | Updated version comment |

---

## Routes Added

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/system/capabilities` | Public | Returns canonical system self-knowledge JSON (no secrets) |

## Routes Hardened (Added `auth.requireAuth`)

| Method | Path | Previously | Now |
|--------|------|-----------|-----|
| `PUT` | `/api/callsheets/:id` | Open | Auth required |
| `POST` | `/api/callsheets/crew/clockin` | Open | Auth required |
| `POST` | `/api/callsheets/sync` | Open | Auth required |
| `PUT` | `/api/safety/incident/:id` | Open | Auth required |
| `POST` | `/api/safety/checklist` | Open | Auth required |
| `POST` | `/api/safety/checklist/complete` | Open | Auth required |
| `POST` | `/api/safety/risk` | Open | Auth required |
| `POST` | `/api/safety/induction` | Open | Auth required |

### Routes Already Protected (No Change Needed)

| Method | Path | Status |
|--------|------|--------|
| `POST` | `/api/forge/save-file` | ✅ Already has `auth.requireAuth` |
| `POST` | `/api/forge/read-file` | ✅ Already has `auth.requireAuth` |
| `POST` | `/api/forge/list-directory` | ✅ Already has `auth.requireAuth` |
| `POST` | `/api/forge/delete-file` | ✅ Already has `auth.requireAuth` |
| `POST` | `/api/callsheets/create` | ✅ Already has `auth.requireAuth` |
| `POST` | `/api/safety/incident` | ✅ Already has `auth.requireAuth` |
| `POST` | `/api/sports/cache/clear` | ✅ Already has `auth.requireAuth` |

### Routes Left Public (Intentionally)

| Method | Path | Reason |
|--------|------|--------|
| `GET` | `/health`, `/healthz` | Health checks must be public for monitoring |
| `GET` | `/api/system/capabilities` | Contains no secrets — safe public exposure |
| `GET` | `/api/system/status` | System info only — no secrets |
| `GET` | `/api/info` | API documentation — no secrets |
| `GET` | `/api/providers` | Provider availability — no keys exposed |
| `GET` | `/api/callsheets/daily/:date` | Read-only call sheet listing |
| `GET` | `/api/callsheets/:id` | Read-only call sheet detail |
| `GET` | `/api/safety/incidents/:siteId?` | Read-only incident listing |
| `GET` | `/api/safety/risks/matrix` | Read-only risk matrix |
| `GET` | `/api/safety/compliance/:siteId?` | Read-only compliance status |
| `GET` | `/api/sports/*` | Read-only sports data |
| `POST` | `/api/brain` | Uses rate limiting; no auth to allow unauthenticated brain queries |

---

## Version Changes

| Location | Before | After |
|----------|--------|-------|
| `server/server.js` (`API_VERSION`) | `7.1.0` | `7.1.1` |
| `package.json` | `7.1.0-production-ready` | `7.1.1` |
| `server/package.json` | `7.1.0-production-ready` | `7.1.1` |
| `index.html` build tag | `v7.1.0` | `v7.1.1` |
| `index.html` `GRACEX_VERSION` | `GX26AI_v7.1.0` | `GX26AI_v7.1.1` |
| `index.html` console log | `v7.1.0` | `v7.1.1` |

---

## Security Notes

1. **No secrets exposed** — `/api/system/capabilities` returns only the self-knowledge JSON, never .env values.
2. **7 write routes hardened** — Previously open POST/PUT routes for callsheets and safety data now require JWT auth.
3. **Self-knowledge injected into LLM prompts** — No sensitive data is included; only identity, modules, limits, and truth rules.
4. **Self-knowledge is cached** — Loaded from disk with 60s TTL to avoid I/O on every brain request.
5. **.env file not modified** — Developer's local .env remains untouched.
6. **.gitignore verified** — All secret file patterns are covered.
7. **Forge routes** — Already protected with `auth.requireAuth` (no change needed).

---

## Known Remaining Issues

1. Call sheet and safety data is still **in-memory** — will reset on server restart. Needs persistent database.
2. Some GET routes for call sheets and safety data are still public — may want auth in future.
3. `/api/brain` is rate-limited but not auth-protected — by design for current build but may need auth for production.
4. Full RBAC (role-based access control) is not yet implemented across all routes.
5. No automated test suite exists yet — testing is manual.
6. HTTPS/TLS termination not configured for production deployment.
7. Session revocation / token blacklisting not implemented.

---

## Status

> **GX26AI v7.1.1 is now stronger as a local/demo and investor-safe prototype because Grace has a canonical self-knowledge layer, a capabilities endpoint, and reinforced truth rules. Further production hardening is still required for persistent storage, full RBAC verification, route protection, deployment security and live data integrations.**

---

## Next Recommended Patch

- **v7.1.2 — Persistent Storage Patch**: Replace in-memory `callSheets`, `incidents`, `risks`, `inductions` arrays with SQLite or similar persistent database.
- Add auth to remaining sensitive GET endpoints if needed.
- Add automated API tests.
- Implement full RBAC across all routes.
