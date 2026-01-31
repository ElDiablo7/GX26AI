/**
 * GRX26AI — Forge nodes from registry. Used by Forge map.
 */
(function(global) {
  'use strict';

  function buildForgeNodesFromRegistry(registry) {
    if (!registry || !registry.agents) return { governance: [], analysis: [], ops: [] };
    var governance = [];
    var analysis = [];
    var ops = [];
    var agentList = registry.agents.filter(function(a) { return a.visibleOnForge; });

    agentList.forEach(function(a) {
      var node = {
        id: a.id,
        name: a.name,
        role: a.role,
        status: a.status,
        invokePolicy: a.invokePolicy,
        lastActivity: a.lastActivity || null
      };
      if (a.role === 'orchestrator' || a.id === 'core' || a.id === 'sentinel' || a.id === 'compliance' || a.id === 'audit' || a.id === 'watchtower') {
        governance.push(node);
      } else if (a.role === 'analysis' || a.id === 'titan') {
        analysis.push(node);
      } else {
        ops.push(node);
      }
    });

    var opsModules = (registry.modules || []).filter(function(m) {
      return !registry.agents.some(function(a) { return a.id === m.id; });
    });
    opsModules.forEach(function(m) {
      ops.push({ id: m.id, name: m.name, role: 'module', status: 'active', invokePolicy: 'always_on', lastActivity: null });
    });

    return { governance: governance, analysis: analysis, ops: ops };
  }

  global.GRX26 = global.GRX26 || {};
  global.GRX26.buildForgeNodesFromRegistry = buildForgeNodesFromRegistry;
})(typeof window !== 'undefined' ? window : this);
