# GRACE-X AI™ ENLIL SECURITY SUITE — Login Details Template

**© Zac Crockett 2026**

> **⚠️ SECURITY:** This is a **TEMPLATE**. Real credentials are stored as bcrypt hashes in `server/.env` (never committed to git).

---

## Security Wall (secure_warning_lock.html)

| Field | Notes |
|-------|-------|
| **OPERATOR ID** | Any (field is optional; not validated) |
| **ACCESS KEY** | Set via `AUTH_MASTER_HASH` or `AUTH_GENERAL_HASH` in server `.env` |
| **2FA TOKEN** (6 digits) | Set via `AUTH_TOKEN_HASH` in server `.env` |

---

## Flow

1. Open the app — you are redirected to the Security Wall if not verified this session.
2. Click **AUTHORISE ACCESS**.
3. Enter OPERATOR ID (any) and **ACCESS KEY**, then **PROCEED**.
4. Credentials are verified server-side via `/api/auth/login`.
5. Enter **2FA TOKEN**, verified via `/api/auth/verify-2fa`.
6. JWT session token issued → redirected to main system.

---

## Setting Up Credentials

1. Copy `server/.env.example` → `server/.env`
2. Edit `server/generate-hashes.js` with your chosen passwords
3. Run: `node server/generate-hashes.js`
4. Paste the generated hashes into `server/.env`
5. Clear the plaintext from `generate-hashes.js`
6. Start: `npm start`

---

## Keeping This File Private

If you add real notes to this file, add to `.gitignore`:

```
docs/LOGIN_DETAILS.md
```

---

**Last Updated:** May 2, 2026  
**Build:** v7.0.1-security-hardening
