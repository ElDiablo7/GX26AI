/**
 * GRX26AI — Permissions / visibility. Stub; extend from registry when needed.
 */
(function(global) {
  'use strict';

  function canAccess(agentId, resource) {
    var agent = global.GRX26 && global.GRX26.getAgent ? global.GRX26.getAgent(agentId) : null;
    if (!agent) return false;
    return (agent.permissions || []).indexOf(resource) !== -1 || agent.id === 'core';
  }

  global.GRX26 = global.GRX26 || {};
  global.GRX26.canAccess = canAccess;
})(typeof window !== 'undefined' ? window : this);
