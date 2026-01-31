/**
 * GRX26AI — Sentinel overlay. Mandatory governance. All responses route through here.
 */
(function(global) {
  'use strict';

  function classifyRequestType(input) {
    var t = (input || '').toLowerCase();
    if (/\b(incident|analyse|analyze|risk|threat|uncertainty)\b/.test(t)) return 'high-risk';
    if (/\b(status|test|report|ecosystem|self)\b/.test(t)) return 'operational';
    return 'informational';
  }

  function process(input, context, traceId) {
    traceId = traceId || 'tr-' + Date.now();
    if (global.Audit) global.Audit.log('sentinel_input', { input: (input || '').substring(0, 200) }, traceId);

    var requestType = classifyRequestType(input);
    var rules = global.SentinelRules && global.SentinelRules.run ? global.SentinelRules.run(input, context || {}) : { allowed: true, requiresHuman: true, responseFrame: 'advisory_only', warnings: [] };
    var allowed = rules.allowed !== false;
    var requiresHuman = rules.requiresHuman || false;
    var warnings = rules.warnings || [];
    var invokeTitan = false;
    var titanReason = null;

    if (requestType === 'high-risk' || (input || '').toLowerCase().indexOf('uncertainty') !== -1) {
      invokeTitan = true;
      titanReason = requestType === 'high-risk' ? 'high-risk request' : 'uncertainty requested';
    }

    var responseFrame = rules.responseFrame || 'informational';
    if (requiresHuman) responseFrame = 'advisory_only';

    var riskFlags = [];
    if (requestType === 'high-risk') riskFlags.push('high-risk request');
    if (requiresHuman) riskFlags.push('human validation required');
    var constraints = ['Advisory only; no autonomous execution.', 'Outcomes require human approval.'];
    var uncertaintyLabel = requestType === 'high-risk' ? 'high' : (invokeTitan ? 'medium' : 'low');
    var recommendedNextSteps = [];
    if (requiresHuman || requestType === 'high-risk') recommendedNextSteps.push('Validate with human operator before action.');
    recommendedNextSteps.push('Confirm evidence and policy frame before acting.');

    var result = {
      allowed: allowed,
      requiresHuman: requiresHuman,
      invokeTitan: invokeTitan,
      titanReason: titanReason,
      responseFrame: responseFrame,
      warnings: warnings,
      riskFlags: riskFlags,
      constraints: constraints,
      uncertaintyLabel: uncertaintyLabel,
      recommendedNextSteps: recommendedNextSteps,
      requestType: requestType,
      traceId: traceId
    };

    if (global.Audit) global.Audit.log('sentinel_processed', result, traceId);
    if (global.GRX26 && global.GRX26.updateAgentActivity) global.GRX26.updateAgentActivity('sentinel');

    return result;
  }

  global.SentinelOverlay = { process: process };
})(typeof window !== 'undefined' ? window : this);
