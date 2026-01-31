/**
 * GRX26AI — Single source of truth: agents, modules, visibility, permissions.
 * police_mod build flavor. Do not bypass.
 */
(function(global) {
  'use strict';

  var SYSTEM_REGISTRY = {
    systemId: 'GRX26AI',
    buildFlavor: 'police_mod',
    agents: [
      { id: 'core', name: 'Core', role: 'orchestrator', visibleOnForge: true, invokePolicy: 'always_on', permissions: ['runSelfTest', 'getSystemStatus', 'listAgents', 'handleUserRequest'], status: 'active', lastActivity: null },
      { id: 'sentinel', name: 'Sentinel', role: 'oversight', visibleOnForge: true, invokePolicy: 'overlay', permissions: ['process', 'policyCheck', 'invokeTitan'], status: 'active', lastActivity: null },
      { id: 'titan', name: 'Titan', role: 'analysis', visibleOnForge: true, invokePolicy: 'on_demand', permissions: ['run'], status: 'active', lastActivity: null },
      { id: 'venus', name: 'Venus', role: 'security', visibleOnForge: true, invokePolicy: 'overlay', permissions: ['theme', 'ux', 'userFacing'], status: 'active', lastActivity: null },
      { id: 'watchtower', name: 'Watchtower', role: 'oversight', visibleOnForge: true, invokePolicy: 'overlay', permissions: ['observe'], status: 'standby', lastActivity: null },
      { id: 'compliance', name: 'Compliance', role: 'oversight', visibleOnForge: true, invokePolicy: 'overlay', permissions: ['policyGate'], status: 'standby', lastActivity: null },
      { id: 'audit', name: 'Audit', role: 'oversight', visibleOnForge: true, invokePolicy: 'always_on', permissions: ['log', 'getRecent'], status: 'active', lastActivity: null }
    ],
    modules: [
      { id: 'core', name: 'Core', agentId: 'core' },
      { id: 'core2', name: 'Core 2.0', agentId: 'core' },
      { id: 'builder', name: 'Builder', agentId: null },
      { id: 'siteops', name: 'SiteOps', agentId: null },
      { id: 'sport', name: 'Sport', agentId: null },
      { id: 'forge', name: 'Forge', agentId: null },
      { id: 'osint', name: 'OSINT', agentId: null },
      { id: 'guardian', name: 'Guardian', agentId: 'sentinel' },
      { id: 'venus', name: 'Venus', agentId: 'venus' },
      { id: 'accounting', name: 'Accounting', agentId: null },
      { id: 'uplift', name: 'Uplift', agentId: null },
      { id: 'chef', name: 'Chef', agentId: null },
      { id: 'fit', name: 'Fit', agentId: null },
      { id: 'yoga', name: 'Yoga', agentId: null },
      { id: 'beauty', name: 'Beauty', agentId: null },
      { id: 'artist', name: 'Artist', agentId: null },
      { id: 'gamer', name: 'Gamer', agentId: null },
      { id: 'family', name: 'Family', agentId: null },
      { id: 'tradelink', name: 'TradeLink', agentId: null }
    ]
  };

  function getAgent(id) {
    return SYSTEM_REGISTRY.agents.find(function(a) { return a.id === id; }) || null;
  }

  function getAgentsVisibleOnForge() {
    return SYSTEM_REGISTRY.agents.filter(function(a) { return a.visibleOnForge === true; });
  }

  function updateAgentActivity(id) {
    var a = getAgent(id);
    if (a) a.lastActivity = Date.now();
  }

  global.SYSTEM_REGISTRY = SYSTEM_REGISTRY;
  global.GRX26 = global.GRX26 || {};
  global.GRX26.getAgent = getAgent;
  global.GRX26.getAgentsVisibleOnForge = getAgentsVisibleOnForge;
  global.GRX26.updateAgentActivity = updateAgentActivity;
})(typeof window !== 'undefined' ? window : this);
