/**
 * GRX26AI — Self-test: registry, sentinel, titan, forge nodes, theme.
 */
(function(global) {
  'use strict';

  function runSelfTest() {
    var checks = [];
    var pass = true;

    function add(name, ok, detail) {
      checks.push({ name: name, pass: !!ok, detail: detail || null });
      if (!ok) pass = false;
    }

    add('registry_loads', !!global.SYSTEM_REGISTRY && !!global.SYSTEM_REGISTRY.agents, global.SYSTEM_REGISTRY ? 'systemId=' + global.SYSTEM_REGISTRY.systemId : 'missing');
    add('sentinel_loaded', typeof global.SentinelOverlay === 'object' && typeof global.SentinelOverlay.process === 'function', 'SentinelOverlay.process');
    add('titan_invoke_present', typeof global.TitanInvoke === 'object' && typeof global.TitanInvoke.run === 'function', 'TitanInvoke.run');
    var nodes = global.GRX26 && global.GRX26.buildForgeNodesFromRegistry ? global.GRX26.buildForgeNodesFromRegistry(global.SYSTEM_REGISTRY) : {};
    var gov = (nodes.governance || []).map(function(n) { return n.id; });
    add('forge_nodes_include_core_sentinel_titan', gov.indexOf('core') !== -1 && gov.indexOf('sentinel') !== -1 && (nodes.analysis || []).some(function(n) { return n.id === 'titan'; }), JSON.stringify({ governance: gov, analysis: (nodes.analysis || []).map(function(n) { return n.id; }) }));
    var themeLoaded = false;
    try {
      var links = document.querySelectorAll('link[rel="stylesheet"]');
      for (var i = 0; i < links.length; i++) {
        if (links[i].href && links[i].href.indexOf('grx26.theme.css') !== -1) { themeLoaded = true; break; }
      }
    } catch (e) {}
    add('css_theme_loaded', themeLoaded, themeLoaded ? 'grx26.theme.css' : 'not found');

    return { pass: pass, checks: checks, timestamp: Date.now() };
  }

  global.GRX26 = global.GRX26 || {};
  global.GRX26.runSelfTest = runSelfTest;
})(typeof window !== 'undefined' ? window : this);
