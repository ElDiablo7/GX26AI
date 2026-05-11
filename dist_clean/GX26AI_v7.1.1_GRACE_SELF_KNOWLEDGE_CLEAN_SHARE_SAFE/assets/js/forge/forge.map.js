/**
 * GRX26AI — Forge map. Renders nodes from registry. Core, Sentinel, Titan, Compliance, Audit visible.
 */
(function(global) {
  'use strict';

  function getNodes() {
    var registry = global.SYSTEM_REGISTRY || {};
    var build = global.GRX26 && global.GRX26.buildForgeNodesFromRegistry ? global.GRX26.buildForgeNodesFromRegistry(registry) : { governance: [], analysis: [], ops: [] };
    var list = [];
    (build.governance || []).forEach(function(n) { list.push({ group: 'governance', name: n.name, id: n.id, status: n.status, invokePolicy: n.invokePolicy, lastActivity: n.lastActivity }); });
    (build.analysis || []).forEach(function(n) { list.push({ group: 'analysis', name: n.name, id: n.id, status: n.status, invokePolicy: n.invokePolicy, lastActivity: n.lastActivity }); });
    (build.ops || []).forEach(function(n) { list.push({ group: 'ops', name: n.name, id: n.id, status: n.status, invokePolicy: n.invokePolicy || 'always_on', lastActivity: n.lastActivity }); });
    return list;
  }

  function renderInto(containerEl) {
    if (!containerEl) return;
    var nodes = getNodes();
    var html = '<div class="grx26-forge-map">';
    html += '<div class="grx26-forge-group"><div class="grx26-forge-group-title">Governance</div><div class="grx26-forge-nodes">';
    nodes.filter(function(n) { return n.group === 'governance'; }).forEach(function(n) {
      html += '<div class="grx26-forge-node" data-id="' + (n.id || '') + '"><span class="grx26-node-name">' + (n.name || '') + '</span><span class="grx26-node-status">' + (n.status || '') + '</span><span class="grx26-node-policy">' + (n.invokePolicy || '') + '</span>' + (n.lastActivity ? '<span class="grx26-node-activity">' + new Date(n.lastActivity).toLocaleTimeString() + '</span>' : '') + '</div>';
    });
    html += '</div></div>';
    html += '<div class="grx26-forge-group"><div class="grx26-forge-group-title">Analysis</div><div class="grx26-forge-nodes">';
    nodes.filter(function(n) { return n.group === 'analysis'; }).forEach(function(n) {
      html += '<div class="grx26-forge-node" data-id="' + (n.id || '') + '"><span class="grx26-node-name">' + (n.name || '') + '</span><span class="grx26-node-status">' + (n.status || '') + '</span><span class="grx26-node-policy">' + (n.invokePolicy || '') + '</span>' + (n.lastActivity ? '<span class="grx26-node-activity">' + new Date(n.lastActivity).toLocaleTimeString() + '</span>' : '') + '</div>';
    });
    html += '</div></div>';
    html += '<div class="grx26-forge-group"><div class="grx26-forge-group-title">Ops</div><div class="grx26-forge-nodes">';
    nodes.filter(function(n) { return n.group === 'ops'; }).forEach(function(n) {
      html += '<div class="grx26-forge-node" data-id="' + (n.id || '') + '"><span class="grx26-node-name">' + (n.name || '') + '</span><span class="grx26-node-status">' + (n.status || '') + '</span><span class="grx26-node-policy">' + (n.invokePolicy || '') + '</span></div>';
    });
    html += '</div></div></div>';
    containerEl.innerHTML = html;
  }

  global.GRX26 = global.GRX26 || {};
  global.GRX26.ForgeMap = { getNodes: getNodes, renderInto: renderInto };
})(typeof window !== 'undefined' ? window : this);
