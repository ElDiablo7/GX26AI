#!/usr/bin/env node
/**
 * GRACE-X Hash Generator
 * Run: node generate-hashes.js
 *
 * Generates bcrypt hashes for your credentials.
 * Copy the output hashes into your .env file.
 * NEVER commit this file with real passwords filled in.
 */

const bcrypt = require('bcryptjs');

// =============================================
// REPLACE THESE WITH YOUR NEW CREDENTIALS
// then run:  node generate-hashes.js
// =============================================
const credentials = {
  MASTER_PASSWORD: 'REPLACE_WITH_NEW_MASTER_PASSWORD',
  DEE_PASSWORD:    'REPLACE_WITH_NEW_DEE_PASSWORD',
  GENERAL_ACCESS:  'REPLACE_WITH_NEW_GENERAL_PASSWORD',
  SECURITY_TOKEN:  'REPLACE_WITH_NEW_6_DIGIT_TOKEN',
  PIN_1:           'REPLACE_WITH_PIN_1',
  PIN_2:           'REPLACE_WITH_PIN_2',
};

(async () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🔐  GRACE-X Credential Hash Generator                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Copy these into your server/.env file:');
  console.log('');

  const masterHash  = await bcrypt.hash(credentials.MASTER_PASSWORD, 12);
  const deeHash     = await bcrypt.hash(credentials.DEE_PASSWORD, 12);
  const generalHash = await bcrypt.hash(credentials.GENERAL_ACCESS, 12);
  const tokenHash   = await bcrypt.hash(credentials.SECURITY_TOKEN, 12);
  const pin1Hash    = await bcrypt.hash(credentials.PIN_1, 12);
  const pin2Hash    = await bcrypt.hash(credentials.PIN_2, 12);

  console.log(`AUTH_MASTER_HASH=${masterHash}`);
  console.log(`AUTH_DEE_HASH=${deeHash}`);
  console.log(`AUTH_GENERAL_HASH=${generalHash}`);
  console.log(`AUTH_TOKEN_HASH=${tokenHash}`);
  console.log(`AUTH_PIN_HASHES=${pin1Hash},${pin2Hash}`);
  console.log('');
  console.log('JWT_SECRET=' + require('crypto').randomBytes(48).toString('hex'));
  console.log('');
  console.log('⚠️  Now delete or clear the plaintext passwords from this file!');
  console.log('');
})();
