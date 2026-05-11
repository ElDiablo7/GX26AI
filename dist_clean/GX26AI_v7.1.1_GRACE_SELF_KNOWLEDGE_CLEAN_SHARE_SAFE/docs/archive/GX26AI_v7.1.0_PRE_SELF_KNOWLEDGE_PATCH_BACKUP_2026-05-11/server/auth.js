/**
 * GRACE-X Auth Module — Server-side authentication
 * Passwords are hashed with bcrypt; sessions use signed JWT.
 * No credentials are ever sent to the browser.
 *
 * SETUP:
 *   1. Generate hashes:  node -e "require('bcryptjs').hash('YOUR_PASSWORD',12).then(h=>console.log(h))"
 *   2. Set in .env:      AUTH_MASTER_HASH=<hash>  AUTH_DEE_HASH=<hash>  AUTH_TOKEN_HASH=<hash>
 *   3. Set JWT_SECRET:    a long random string (>= 64 chars)
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET || 'CHANGE_ME_BEFORE_PRODUCTION_' + Date.now();
const JWT_EXPIRY  = process.env.JWT_EXPIRY || '8h';

// Warn if using fallback secret
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  [AUTH] JWT_SECRET not set in .env — using insecure fallback. Set a proper secret for production.');
}

// ---------------------------------------------------------------------------
// Password verification
// ---------------------------------------------------------------------------

/**
 * Verify a submitted password against all configured credential hashes.
 * Returns { valid: true, role: 'master'|'dee'|'operator' } or { valid: false }.
 */
async function verifyPassword(password) {
  if (!password || typeof password !== 'string') return { valid: false };

  // Master password
  if (process.env.AUTH_MASTER_HASH) {
    try {
      if (await bcrypt.compare(password, process.env.AUTH_MASTER_HASH)) {
        return { valid: true, role: 'master' };
      }
    } catch (_) {}
  }

  // Dee's password
  if (process.env.AUTH_DEE_HASH) {
    try {
      if (await bcrypt.compare(password, process.env.AUTH_DEE_HASH)) {
        return { valid: true, role: 'dee' };
      }
    } catch (_) {}
  }

  // General access password
  if (process.env.AUTH_GENERAL_HASH) {
    try {
      if (await bcrypt.compare(password, process.env.AUTH_GENERAL_HASH)) {
        return { valid: true, role: 'operator' };
      }
    } catch (_) {}
  }

  // PIN-based access (hashed PINs, comma-separated hashes)
  if (process.env.AUTH_PIN_HASHES) {
    const pinHashes = process.env.AUTH_PIN_HASHES.split(',').map(h => h.trim());
    for (const hash of pinHashes) {
      try {
        if (await bcrypt.compare(password, hash)) {
          return { valid: true, role: 'operator' };
        }
      } catch (_) {}
    }
  }

  return { valid: false };
}

/**
 * Verify 2FA token against the hashed token in env.
 */
async function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  if (!process.env.AUTH_TOKEN_HASH) return false;
  try {
    return await bcrypt.compare(token, process.env.AUTH_TOKEN_HASH);
  } catch (_) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function signSession(payload) {
  const opts = {};
  // If payload already has 'exp', don't set 'expiresIn' (jwt library conflict)
  if (payload.exp) {
    // Use the explicit exp from payload
  } else {
    opts.expiresIn = JWT_EXPIRY;
  }
  return jwt.sign(
    { ...payload, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    opts
  );
}

function verifySession(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Express middleware — protects routes
// ---------------------------------------------------------------------------

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
      requestId: req.requestId
    });
  }

  const token = authHeader.slice(7);
  const decoded = verifySession(token);
  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'AUTH_INVALID',
      requestId: req.requestId
    });
  }

  req.user = decoded;
  next();
}

// ---------------------------------------------------------------------------
// Hash generation utility (for setup)
// ---------------------------------------------------------------------------

async function generateHash(plaintext) {
  return bcrypt.hash(plaintext, 12);
}

module.exports = {
  verifyPassword,
  verifyToken,
  signSession,
  verifySession,
  requireAuth,
  generateHash
};
