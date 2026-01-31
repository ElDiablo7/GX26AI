/**
 * GRX26AI — Sidebar labels. Official roles; no marketing.
 */
(function(global) {
  'use strict';

  var OFFICIAL_LABELS = {
    core: 'Core',
    core2: 'Core 2.0',
    sentinel: 'Sentinel',
    titan: 'Titan',
    forge_map: 'Forge Map',
    system_status: 'System Status',
    audit_log: 'Audit Log',
    builder: 'Builder',
    siteops: 'SiteOps',
    sport: 'Sport',
    forge: 'Forge',
    osint: 'OSINT',
    guardian: 'Guardian',
    accounting: 'Accounting',
    uplift: 'Uplift',
    chef: 'Chef',
    fit: 'Fit',
    yoga: 'Yoga',
    beauty: 'Beauty',
    artist: 'Artist',
    gamer: 'Gamer',
    family: 'Family',
    tradelink: 'TradeLink'
  };

  function getLabel(moduleId) {
    return OFFICIAL_LABELS[moduleId] || moduleId;
  }

  function applyLabels() {
    document.querySelectorAll('.module-btn[data-module]').forEach(function(btn) {
      var id = btn.getAttribute('data-module');
      if (id && OFFICIAL_LABELS[id]) btn.textContent = OFFICIAL_LABELS[id];
    });
  }

  global.GRX26 = global.GRX26 || {};
  global.GRX26.Sidebar = { getLabel: getLabel, applyLabels: applyLabels };
})(typeof window !== 'undefined' ? window : this);
