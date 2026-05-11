/**
 * GRX26AI — Single source of truth: agents, modules, visibility, permissions.
 * ENLIL_GOV build. Do not bypass.
 */
(function(global) {
  'use strict';

  var SYSTEM_REGISTRY = {
    systemId: 'GRX26AI',
    buildFlavor: 'ENLIL_GOV',
    agents: [
      { id: 'core', name: 'CORE', role: 'orchestrator', visibleOnForge: true, invokePolicy: 'always_on', permissions: ['runSelfTest', 'getSystemStatus', 'listAgents', 'handleUserRequest'], status: 'active', lastActivity: null },
      { id: 'sentinel', name: 'ENLIL', role: 'oversight', visibleOnForge: true, invokePolicy: 'overlay', permissions: ['process', 'policyCheck', 'invokeTitan'], status: 'active', lastActivity: null },
      { id: 'titan', name: 'NINURTA', role: 'analysis', visibleOnForge: true, invokePolicy: 'on_demand', permissions: ['run'], status: 'active', lastActivity: null },
      { id: 'venus', name: 'ENKI', role: 'security', visibleOnForge: true, invokePolicy: 'overlay', permissions: ['theme', 'ux', 'userFacing'], status: 'active', lastActivity: null },
      { id: 'guardian', name: 'NANSHE', role: 'safeguarding', visibleOnForge: true, invokePolicy: 'overlay', permissions: ['protect', 'alert', 'intervene'], status: 'active', lastActivity: null },
      { id: 'forge', name: 'GIBIL', role: 'engineering', visibleOnForge: true, invokePolicy: 'on_demand', permissions: ['build', 'export', 'preview'], status: 'active', lastActivity: null },
      { id: 'audit', name: 'UTU LOG', role: 'oversight', visibleOnForge: true, invokePolicy: 'always_on', permissions: ['log', 'getRecent', 'export'], status: 'active', lastActivity: null },
      { id: 'system-status', name: 'NISABA', role: 'oversight', visibleOnForge: true, invokePolicy: 'always_on', permissions: ['status', 'selfTest'], status: 'active', lastActivity: null },
      { id: 'compliance', name: 'Compliance', role: 'oversight', visibleOnForge: true, invokePolicy: 'overlay', permissions: ['policyGate'], status: 'standby', lastActivity: null },
      { id: 'watchtower', name: 'Watchtower', role: 'oversight', visibleOnForge: true, invokePolicy: 'overlay', permissions: ['observe'], status: 'standby', lastActivity: null }
    ],
    modules: [
      { id: 'core', name: 'CORE', agentId: 'core', enlilLabel: 'CORE' },
      { id: 'core2', name: 'CORE 2.0', agentId: 'core', enlilLabel: 'CORE 2.0' },
      { id: 'sentinel', name: 'ENLIL', agentId: 'sentinel', enlilLabel: 'ENLIL' },
      { id: 'titan', name: 'NINURTA', agentId: 'titan', enlilLabel: 'NINURTA' },
      { id: 'venus', name: 'ENKI', agentId: 'venus', enlilLabel: 'ENKI' },
      { id: 'guardian', name: 'NANSHE', agentId: 'guardian', enlilLabel: 'NANSHE' },
      { id: 'forge', name: 'GIBIL', agentId: 'forge', enlilLabel: 'GIBIL' },
      { id: 'forge_map', name: 'GIBIL MAP', agentId: 'forge', enlilLabel: 'GIBIL MAP' },
      { id: 'system-status', name: 'NISABA', agentId: 'system-status', enlilLabel: 'NISABA' },
      { id: 'audit-log', name: 'UTU LOG', agentId: 'audit', enlilLabel: 'UTU LOG' },
      { id: 'builder', name: 'Builder', agentId: null, enlilLabel: 'AGENT-01' },
      { id: 'siteops', name: 'SiteOps', agentId: null, enlilLabel: 'AGENT-02' },
      { id: 'tradelink', name: 'TradeLink', agentId: null, enlilLabel: 'AGENT-03' },
      { id: 'beauty', name: 'Beauty', agentId: null, enlilLabel: 'AGENT-04' },
      { id: 'fit', name: 'Fit', agentId: null, enlilLabel: 'AGENT-05' },
      { id: 'yoga', name: 'Yoga', agentId: null, enlilLabel: 'AGENT-06' },
      { id: 'uplift', name: 'Uplift', agentId: null, enlilLabel: 'AGENT-07' },
      { id: 'chef', name: 'Chef', agentId: null, enlilLabel: 'AGENT-08' },
      { id: 'artist', name: 'Artist', agentId: null, enlilLabel: 'AGENT-09' },
      { id: 'family', name: 'Family', agentId: null, enlilLabel: 'AGENT-10' },
      { id: 'gamer', name: 'Gamer', agentId: null, enlilLabel: 'AGENT-11' },
      { id: 'accounting', name: 'Accounting', agentId: null, enlilLabel: 'AGENT-12' },
      { id: 'osint', name: 'OSINT', agentId: null, enlilLabel: 'AGENT-13' },
      { id: 'sport', name: 'Sport', agentId: null, enlilLabel: 'AGENT-14' }
    ]
  };

  function getAgent(id) {
    return SYSTEM_REGISTRY.agents.find(function(a) { return a.id === id; }) || null;
  }

  function getModule(id) {
    return SYSTEM_REGISTRY.modules.find(function(m) { return m.id === id; }) || null;
  }

  function getAgentsVisibleOnForge() {
    return SYSTEM_REGISTRY.agents.filter(function(a) { return a.visibleOnForge === true; });
  }

  function getAllModules() {
    return SYSTEM_REGISTRY.modules.slice();
  }

  function updateAgentActivity(id) {
    var a = getAgent(id);
    if (a) a.lastActivity = Date.now();
  }

  global.SYSTEM_REGISTRY = SYSTEM_REGISTRY;
  global.GRX26 = global.GRX26 || {};
  global.GRX26.getAgent = getAgent;
  global.GRX26.getModule = getModule;
  global.GRX26.getAgentsVisibleOnForge = getAgentsVisibleOnForge;
  global.GRX26.getAllModules = getAllModules;
  global.GRX26.updateAgentActivity = updateAgentActivity;
})(typeof window !== 'undefined' ? window : this);
