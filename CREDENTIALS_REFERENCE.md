# 🔐 GRACE-X AI™ ELIL SECURITY SUITE — Access Keys & Credentials Reference

**© Zac Crockett 2026**

**⚠️ SECURITY NOTE:** Keep this file private. Do not commit to public repositories. For production, move credentials to environment variables or server-side authentication.

---

## 🔒 Security Wall (Initial Login)

**File:** `secure_warning_lock.html`  
**Purpose:** Initial session verification (required on every new browser session)

| Field | Value | Notes |
|-------|-------|-------|
| **OPERATOR ID** | Any text | Field is optional; not validated |
| **ACCESS KEY** | `BIG_ZAC A0251AH` | Master override (case-sensitive) |
| **ACCESS KEY** | `ENLIL_COMMAND` | Alternative (case-sensitive) |
| **2FA TOKEN** (6 digits) | `361126` | Must be exactly 6 digits |

**Flow:**
1. Open app → redirected to Security Wall if not verified this session
2. Click **AUTHORISE ACCESS**
3. Enter OPERATOR ID (any) + **ACCESS KEY** → **PROCEED**
4. Enter **2FA TOKEN** → **VERIFY TOKEN**
5. Level 3 clearance → redirected to main system

**Location in code:** `secure_warning_lock.html`
```javascript
const AUTHORISED_PASSWORD = 'ENLIL_COMMAND';
const AUTHORISED_TOKEN = '361126';
```

---

## 🛡️ Sentinel/ENLIL Authentication (Module Access)

**File:** `assets/js/governance/titan-sentinel-core.js`  
**Purpose:** Authenticate to ENLIL module for governance operations

| Credential | Value | Case Sensitive | Used For |
|------------|-------|----------------|----------|
| **MASTER** | `BIG_ZAC A0251AH` | Yes | Master override — works everywhere |
| **PASSWORD** | `ENLIL_COMMAND` | Yes | Authentication & Unlockdown |
| **PIN 1** | `ENLIL` | Yes | Authentication & Unlockdown |
| **PIN 2** | `enlil` | Yes | Authentication & Unlockdown |
| **PIN 3** | `3611` | No | Authentication & Unlockdown |

**Location in code:** `titan-sentinel-core.js`
```javascript
var validPins = ['BIG_ZAC A0251AH', 'ENLIL_COMMAND', 'ENLIL', 'enlil', '3611'];
```

**Usage:**
- Enter in ENLIL module authentication field
- Also used to unlock system from LOCKDOWN/SAFE MODE

---

## 🔐 ELIL-v1.0 Standalone (TITAN + SENTINEL)

**File:** `C:\Users\anyth\Documents\GitHub\ELIL-v1.0`  
**Purpose:** Standalone TITAN + SENTINEL security overlay

| Credential | Value | Notes |
|------------|-------|-------|
| **Default PIN** | `0000` | Standard authentication |
| **Override Code** | `SENTINEL_OVERRIDE` | Testing/development bypass |

**Location:** `assets/js/sentinel.js` and `assets/data/config.default.json`

---

## 🌐 API Keys (Backend)

**File:** `server/.env`  
**Purpose:** Backend API authentication

| Key | Format | Example |
|-----|--------|---------|
| **Anthropic API Key** | `sk-ant-...` | `sk-ant-api03-YOUR-KEY-HERE` |

**Location:** `server/.env`
```env
ANTHROPIC_API_KEY=sk-ant-YOUR-KEY-HERE
```

**Note:** Must be obtained from Anthropic. Placeholder keys will not work.

---

## 📋 Summary Quick Reference

### Initial Login (Security Wall)
- **MASTER:** `BIG_ZAC A0251AH` (overrides all)
- **ACCESS KEY:** `ENLIL_COMMAND`
- **2FA TOKEN:** `361126`

### ENLIL Module (Sentinel)
- **MASTER:** `BIG_ZAC A0251AH` (overrides all)
- **PASSWORD:** `ENLIL_COMMAND`
- **PIN:** `ENLIL`, `enlil`, or `3611`

### Standalone ELIL App
- **PIN:** `0000` or `SENTINEL_OVERRIDE`

### Backend API
- **Anthropic Key:** Set in `server/.env` (format: `sk-ant-...`)

---

## 🔄 Session Management

- **Security Wall:** Session-only (`sessionStorage`); must verify on every new browser session
- **ENLIL Auth:** Session-only; stored in `sessionStorage` as `sentinel_session`
- **ENLIL_GOV Build:** No persistent bypass; all authentication is session-only

---

## 🛠️ Changing Credentials

### Security Wall
Edit `secure_warning_lock.html`:
```javascript
const AUTHORISED_PASSWORD = 'YOUR_NEW_PASSWORD';
const AUTHORISED_TOKEN = 'YOUR_NEW_TOKEN';
```

### ENLIL PINs
Edit `assets/js/governance/titan-sentinel-core.js`:
```javascript
var validPins = ['YOUR_PIN_1', 'YOUR_PIN_2', 'YOUR_PIN_3'];
```

### Standalone ELIL
Edit `assets/data/config.default.json`:
```json
{
  "authentication": {
    "default_pin": "YOUR_PIN"
  }
}
```

---

## ⚠️ Security Recommendations

1. **Production:** Move all credentials to environment variables or server-side validation
2. **Git:** Add `CREDENTIALS_REFERENCE.md` and `docs/LOGIN_DETAILS.md` to `.gitignore` if containing sensitive info
3. **Rotation:** Regularly rotate credentials, especially in production
4. **Access Control:** Limit who has access to this file
5. **Audit:** All authentication attempts are logged in UTU LOG (Audit Log)

---

## 📝 Notes

- All PINs/passwords are case-sensitive unless noted otherwise
- Security Wall verification is required on every new browser session
- ENLIL authentication persists for the browser session only
- Failed authentication attempts are logged in the audit system
- LOCKDOWN mode requires ENLIL PIN to unlock

---

**Last Updated:** February 10, 2026  
**Build:** ENLIL_GOV v1.0
