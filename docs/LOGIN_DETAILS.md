# GRACE-X AI™ ELIL SECURITY SUITE — Login Details

**© Zac Crockett 2026**

Use these credentials to pass the Security Wall. Verification is required on **every new session** (every login).

---

## Security Wall (secure_warning_lock.html)

| Field | Value |
|-------|--------|
| **OPERATOR ID** | Any (field is optional; not validated) |
| **ACCESS KEY** | `BIG_ZAC A0251AH` |
| **2FA TOKEN** (6 digits) | `025126` |

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

- `AUTHORISED_PASSWORD` — ACCESS KEY
- `AUTHORISED_TOKEN` — 2FA token

Edit those constants to change the accepted values. For production, consider moving credentials to environment variables or a server-side check.

---

## Keeping this file private

If you do not want this file in version control, add to `.gitignore`:

```
docs/LOGIN_DETAILS.md
```

Then keep a local copy for your reference.
