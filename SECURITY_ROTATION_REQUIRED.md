# SECURITY_ROTATION_REQUIRED.md — Credential Rotation Notice

**Version:** 7.1.0-production-ready  
**Date:** May 2, 2026  
**Severity:** HIGH

---

## ⚠️ Credential Rotation Required

The following categories of credentials were found committed in the git history of this repository. **All must be considered compromised** and must be rotated before any public or production deployment.

---

## Credentials Requiring Rotation

### 1. JWT Secret
- **Location:** `server/.env` (line 60 in git history)
- **Action:** Generate a new random secret (≥64 characters)
- **Command:** `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- **Impact if not rotated:** Any party with the old secret can forge session tokens

### 2. Authentication Password Hashes (bcrypt)
- **Location:** `server/.env` (lines 61-65 in git history)
- **Affected credentials:**
  - Master password hash
  - Dee password hash
  - General access password hash
  - 2FA token hash
  - PIN hashes
- **Action:** Choose new passwords/PINs/tokens, regenerate all hashes
- **Command:** `node server/generate-hashes.js`
- **Impact if not rotated:** Anyone with the old `.env` knows the credential hashes (though bcrypt hashes are computationally expensive to reverse)

### 3. LLM API Keys
- **Location:** `server/.env` (referenced but currently set to placeholder)
- **Action:** Verify no real API keys were committed. If they were, rotate at the provider:
  - OpenAI: https://platform.openai.com/api-keys
  - Anthropic: https://console.anthropic.com/
  - OpenRouter: https://openrouter.ai/keys
- **Impact if not rotated:** Unauthorized API usage billed to your account

---

## Rotation Procedure

1. **Stop the server**
2. **Edit `server/generate-hashes.js`** with new passwords/PINs/tokens
3. **Run:** `node server/generate-hashes.js`
4. **Copy output hashes** into `server/.env`
5. **Generate new JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
6. **Paste new JWT_SECRET** into `server/.env`
7. **Clear plaintext** from `generate-hashes.js`
8. **Rotate API keys** at respective provider dashboards
9. **Update API keys** in `server/.env`
10. **Restart the server**
11. **Verify login** works with new credentials

---

## Git History Scrubbing

The `.env` file with credentials exists in git history. To remove it permanently:

1. Follow instructions in `GIT_HISTORY_SCRUB_INSTRUCTIONS.md`
2. Force-push the cleaned history
3. All collaborators must re-clone
4. Contact GitHub support if cached commits persist

---

## ⚠️ Important Notes

- **Do NOT include actual credential values in this document**
- **Do NOT skip rotation** — assume all values in git history are compromised
- **Rotation does NOT require code changes** — only `.env` file updates
- **After rotation**, all existing sessions are invalidated (JWT_SECRET change)

---

**Build:** GX26AI v7.1.0-production-ready
