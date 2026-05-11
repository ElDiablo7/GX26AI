# 🔐 GRACE-X AI™ ENLIL SECURITY SUITE — Credentials Reference Template

**© Zac Crockett 2026**

> **⚠️ SECURITY:** This is a **TEMPLATE FILE**. Real credentials must NEVER be committed to version control.

---

## 🔒 Security Wall (Initial Login)

**File:** `secure_warning_lock.html`  
**Purpose:** Initial session verification (required on every new browser session)

| Field | Value | Notes |
|-------|-------|-------|
| **OPERATOR ID** | Any text | Field is optional; not validated |
| **ACCESS KEY** | *Set in `.env` as `AUTH_MASTER_HASH`* | Server-side verified |
| **2FA TOKEN** (6 digits) | *Set in `.env` as `AUTH_TOKEN_HASH`* | Server-side verified |

**Flow:**
1. Open app → redirected to Security Wall if not verified this session
2. Click **AUTHORISE ACCESS**
3. Enter OPERATOR ID (any) + **ACCESS KEY** → **PROCEED**
4. Enter **2FA TOKEN** → **VERIFY TOKEN**
5. Backend verifies credentials → JWT session token issued
6. Level 3 clearance → redirected to main system

---

## 🛡️ SENTINEL/ENLIL Authentication (Module Access)

Authentication now uses the same backend `/api/auth/login` endpoint.
PINs/passwords are verified server-side against bcrypt hashes in `.env`.

---

## 🌐 API Keys (Backend)

**File:** `server/.env` (copy from `server/.env.example`)

| Key | Format | Notes |
|-----|--------|-------|
| **OpenAI API Key** | `sk-...` | Obtain from OpenAI |
| **Anthropic API Key** | `sk-ant-...` | Obtain from Anthropic |
| **OpenRouter API Key** | `sk-or-...` | Obtain from OpenRouter |

---

## 🔄 How to Set Up Credentials

1. Copy `server/.env.example` to `server/.env`
2. Run `node server/generate-hashes.js` to generate bcrypt hashes
3. Paste the hashes into `server/.env`
4. Set your API keys in `server/.env`
5. Start the server: `npm start`

---

## 🔄 How to Rotate Credentials

1. Choose new passwords/PINs/tokens
2. Edit `server/generate-hashes.js` with the new values
3. Run `node server/generate-hashes.js`
4. Copy the output hashes into `server/.env`
5. Clear the plaintext from `generate-hashes.js`
6. Restart the server

---

## ⚠️ Security Rules

1. **NEVER** commit real credentials to git
2. **NEVER** put passwords in client-side JavaScript
3. **ALWAYS** use hashed credentials in `.env`
4. **ALWAYS** rotate credentials if you suspect exposure
5. **ALWAYS** keep this template — never the real values

---

**Last Updated:** May 2, 2026  
**Build:** v7.0.1-security-hardening
