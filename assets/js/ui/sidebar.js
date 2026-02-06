/**
 * GRX26AI — Sidebar labels. Official roles; no marketing.
 */
(function(global) {
  'use strict';

  var OFFICIAL_LABELS = {
    core: 'CORE',
    core2: 'CORE 2.0',
    sentinel: 'ENLIL',
    titan: 'NINURTA',
    venus: 'ENKI',
    guardian: 'NANSHE',
    forge: 'GIBIL',
    forge_map: 'GIBIL MAP',
    system_status: 'NISABA',
    audit_log: 'UTU LOG',
    builder: 'AGENT-01',
    siteops: 'AGENT-02',
    tradelink: 'AGENT-03',
    beauty: 'AGENT-04',
    fit: 'AGENT-05',
    yoga: 'AGENT-06',
    uplift: 'AGENT-07',
    chef: 'AGENT-08',
    artist: 'AGENT-09',
    family: 'AGENT-10',
    gamer: 'AGENT-11',
    accounting: 'AGENT-12',
    osint: 'AGENT-13',
    sport: 'AGENT-14'
  };

  function getLabel(moduleId) {
    return OFFICIAL_LABELS[moduleId] || moduleId;
  }

  function applyLabels() {
    document.querySelectorAll('.module-btn[data-module]').forEach(function(btn) {
      var id = btn.getAttribute('data-module');
      if (!id) return;
      var label = OFFICIAL_LABELS[id];
      if (!label) return;

      // Preserve icon + span structure where present
      var span = btn.querySelector('span');
      if (span) span.textContent = label;
      else btn.textContent = label;

      // Keep speciality as tooltip where helpful (agents + security crosswalk)
      var tooltip = '';
      if (id === 'sentinel') tooltip = 'ENLIL — Command & Governance (formerly Sentinel)';
      else if (id === 'titan') tooltip = 'NINURTA — Tactical Threat Analysis (TITAN nucleus)';
      else if (id === 'venus') tooltip = 'ENKI — Sandbox / Flytrap (formerly Venus)';
      else if (id === 'guardian') tooltip = 'NANSHE — Protection & Safeguarding (formerly Guardian)';
      else if (id === 'forge' || id === 'forge_map') tooltip = 'GIBIL — Forge / Systems Map';
      else if (id === 'audit_log') tooltip = 'UTU — Audit / Oversight Log';
      else if (id === 'system_status') tooltip = 'NISABA — System Status / Records';
      else if (label && label.indexOf('AGENT-') === 0) tooltip = label + ' — ' + (id.charAt(0).toUpperCase() + id.slice(1)) + ' (speciality preserved)';
      if (tooltip) btn.setAttribute('title', tooltip);
    });
  }

  global.GRX26 = global.GRX26 || {};
  global.GRX26.Sidebar = { getLabel: getLabel, applyLabels: applyLabels };
})(typeof window !== 'undefined' ? window : this);
