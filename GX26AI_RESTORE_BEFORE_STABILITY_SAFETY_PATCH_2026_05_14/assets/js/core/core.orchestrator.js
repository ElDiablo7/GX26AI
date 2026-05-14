/**
 * GRX26AI — Core orchestrator. Authoritative. User → Core → Sentinel → (optional Titan) → Sentinel → Core → User.
 */
(function(global) {
  'use strict';

  var lastSelfTest = null;

  function handleUserRequest(input, context) {
    if (global.Sentinel && global.Sentinel.lockdownActive) {
      return { traceId: null, result: { summary: 'Lockdown active. No actions allowed.' }, notices: ['LOCKDOWN / SAFE MODE'], confidence: 'advisory', auditRef: null };
    }
    var traceId = 'tr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    if (global.Audit) global.Audit.log('request_received', { input: (input || '').substring(0, 200) }, traceId);
    if (global.GRX26 && global.GRX26.updateAgentActivity) global.GRX26.updateAgentActivity('core');

    var sentinelResult = global.SentinelOverlay && global.SentinelOverlay.process ? global.SentinelOverlay.process(input, context || {}, traceId) : { allowed: true, invokeTitan: false, responseFrame: 'informational', warnings: [] };

    var titanOutput = null;
    if (sentinelResult.invokeTitan && global.TitanInvoke && global.TitanInvoke.run) {
      titanOutput = global.TitanInvoke.run(input, context, traceId, sentinelResult.titanReason);
      if (global.Audit) global.Audit.log('titan_invoked', { traceId: traceId, reason: sentinelResult.titanReason }, traceId);
    }

    var notices = (sentinelResult.warnings || []).slice();
    var confidence = sentinelResult.responseFrame === 'advisory_only' ? 'advisory' : 'informational';
    var result = { traceId: traceId, result: null, notices: notices, confidence: confidence, auditRef: traceId };

    var lower = (input || '').toLowerCase();
    var wantsEcosystem = /\b(self[- ]?system|report ecosystem|system status|get status)\b/.test(lower);
    if (wantsEcosystem && global.CoreOrchestrator && typeof global.CoreOrchestrator.getSystemStatus === 'function') {
      result.result = { summary: 'Ecosystem status.', status: global.CoreOrchestrator.getSystemStatus(), traceId: traceId };
    } else if (titanOutput) {
      result.titanOutput = titanOutput;
      result.result = { summary: 'Titan analysis (advisory only).', assumptions: titanOutput.assumptions, recommendedQuestions: titanOutput.recommendedQuestions, titanReason: sentinelResult.titanReason };
    } else if (sentinelResult.allowed === false) {
      result.result = { summary: 'Request not allowed.', reason: notices.join(' ') };
    } else {
      result.result = { summary: 'Processed via Sentinel.', responseFrame: sentinelResult.responseFrame, requiresHuman: sentinelResult.requiresHuman };
    }

    if (global.Audit) global.Audit.log('response_sent', { traceId: traceId }, traceId);
    return result;
  }

  function getSystemStatus() {
    var registry = global.SYSTEM_REGISTRY || {};
    var agents = (registry.agents || []).map(function(a) { return { id: a.id, name: a.name, status: a.status }; });
    var nodes = global.GRX26 && global.GRX26.buildForgeNodesFromRegistry ? global.GRX26.buildForgeNodesFromRegistry(registry) : {};
    var missing = [];
    if (!global.SentinelOverlay) missing.push('SentinelOverlay');
    if (!global.TitanInvoke) missing.push('TitanInvoke');
    if (!global.GRX26 || !global.GRX26.buildForgeNodesFromRegistry) missing.push('forge.model');
    return {
      activeAgents: agents,
      missingModules: missing,
      lastSelfTest: lastSelfTest,
      buildFlavor: registry.buildFlavor || 'police_mod',
      forgeNodes: { governance: (nodes.governance || []).length, analysis: (nodes.analysis || []).length, ops: (nodes.ops || []).length }
    };
  }

  function listAgents() {
    var registry = global.SYSTEM_REGISTRY || {};
    return (registry.agents || []).map(function(a) { return { id: a.id, name: a.name, role: a.role, status: a.status, invokePolicy: a.invokePolicy }; });
  }

  function runSelfTest() {
    var fn = global.GRX26 && global.GRX26.runSelfTest ? global.GRX26.runSelfTest : function() { return { pass: false, checks: [], timestamp: Date.now() }; };
    lastSelfTest = fn();
    return lastSelfTest;
  }

  global.CoreOrchestrator = {
    handleUserRequest: handleUserRequest,
    getSystemStatus: getSystemStatus,
    listAgents: listAgents,
    runSelfTest: runSelfTest
  };
})(typeof window !== 'undefined' ? window : this);
