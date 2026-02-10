# GRACE-X AI™ ELIL SECURITY SUITE — Login Details

**© Zac Crockett 2026**

Use these credentials to pass the Security Wall. Verification is required on **every new session** (every login).

---

## Security Wall (secure_warning_lock.html)

| Field | Value |
|-------|--------|
| **OPERATOR ID** | Any (field is optional; not validated) |
| **ACCESS KEY** | `ENLIL_COMMAND` |
| **2FA TOKEN** (6 digits) | `361126` |

---

## Flow

1. Open the app — you are redirected to the Security Wall if not verified this session.
2. Click **AUTHORISE ACCESS**.
3. Enter OPERATOR ID (any) and **ACCESS KEY** above, then **PROCEED**.
4. Enter **2FA TOKEN** (6 digits), then **VERIFY TOKEN**.
5. After Level 3 clearance, you are redirected to the main system.

---

## Changing credentials

Credentials are defined in **secure_warning_lock.html**:

- `AUTHORISED_PASSWORD` — ACCESS KEY (`ENLIL_COMMAND`)
- `AUTHORISED_TOKEN` — 2FA token (`361126`)

Edit those constants to change the accepted values. For production, consider moving credentials to environment variables or a server-side check.

---

## ENLIL logo

Place your ENLIL logo image at **`assets/img/enlil-logo.png`** so it appears on the splash screen, security wall, and main app sidebar. If the file is missing, the app falls back to the GRACE-X logo.

---

## Keeping this file private

If you do not want this file in version control, add to `.gitignore`:

```
docs/LOGIN_DETAILS.md
```

Then keep a local copy for your reference.
