/**
 * GRX26AI — Sentinel policy rules. Police/MOD-safe. Hard-coded minimums.
 */
(function(global) {
  'use strict';

  function runPolicyRules(input, context) {
    var warnings = [];
    var allowed = true;
    var requiresHuman = false;
    var responseFrame = 'informational';

    var t = (input || '').toLowerCase();
    if (/\b(illegal|unlawful|how to (steal|hack|kill|hurt))\b/.test(t)) {
      allowed = false;
      warnings.push('Request touches illegal guidance — blocked.');
    }
    if (/\b(autonomous|give (me )?commands|you decide|execute)\b/.test(t)) {
      requiresHuman = true;
      responseFrame = 'advisory_only';
      warnings.push('Autonomy requested — advisory only; no commands.');
    }
    if (/\b(certain|100%|definitely|guarantee)\b/.test(t) && !/\b(uncertainty|confidence)\b/.test(t)) {
      warnings.push('Certainty claimed without evidence — confidence will be labeled.');
    }
    if (t.length < 3 && t.length > 0) {
      warnings.push('Unclear request — safe partial support; request missing info if needed.');
    }

    return { allowed: allowed, requiresHuman: requiresHuman, responseFrame: responseFrame, warnings: warnings };
  }

  global.SentinelRules = { run: runPolicyRules };
})(typeof window !== 'undefined' ? window : this);
