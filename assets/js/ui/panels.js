/**
 * GRX26AI — Panels. System Status, Audit Log rendering.
 */
(function(global) {
  'use strict';

  function renderSystemStatus(el) {
    if (!el) return;
    var status = global.CoreOrchestrator && global.CoreOrchestrator.getSystemStatus ? global.CoreOrchestrator.getSystemStatus() : {};
    var html = '<div class="grx26-panel"><h2>System Status</h2>';
    html += '<p>Build: ' + (status.buildFlavor || '—') + '</p>';
    html += '<p>Missing: ' + (status.missingModules && status.missingModules.length ? status.missingModules.join(', ') : 'None') + '</p>';
    html += '<p>Forge nodes: Governance ' + (status.forgeNodes && status.forgeNodes.governance) + ', Analysis ' + (status.forgeNodes && status.forgeNodes.analysis) + ', Ops ' + (status.forgeNodes && status.forgeNodes.ops) + '</p>';
    html += '<button type="button" class="grx26-btn-run-selftest">Run Self-Test</button>';
    html += '<div id="grx26-selftest-result"></div></div>';
    el.innerHTML = html;
    var btn = el.querySelector('.grx26-btn-run-selftest');
    var resultEl = el.querySelector('#grx26-selftest-result');
    if (btn && resultEl) {
      btn.addEventListener('click', function() {
        var report = global.CoreOrchestrator && global.CoreOrchestrator.runSelfTest ? global.CoreOrchestrator.runSelfTest() : { pass: false, checks: [] };
        var html = '<p class="grx26-self-test-result ' + (report.pass ? 'pass' : 'fail') + '">' + (report.pass ? 'PASS' : 'FAIL') + '</p><ul style="margin-top:8px;font-size:12px;">';
        (report.checks || []).forEach(function(c) {
          html += '<li>' + (c.pass ? '✓' : '✗') + ' ' + (c.name || '') + (c.detail ? ' (' + c.detail + ')' : '') + '</li>';
        });
        html += '</ul>';
        resultEl.innerHTML = html;
      });
    }
  }

  function renderAuditLog(el, n) {
    if (!el) return;
    n = n || 20;
    var entries = global.Audit && global.Audit.getRecent ? global.Audit.getRecent(n) : [];
    var html = '<div class="grx26-panel"><h2>Audit Log (recent ' + n + ')</h2><table class="grx26-audit-table"><thead><tr><th>Time</th><th>Event</th><th>Trace ID</th></tr></thead><tbody>';
    entries.forEach(function(e) {
      html += '<tr><td>' + (e.ts ? new Date(e.ts).toLocaleTimeString() : '') + '</td><td>' + (e.eventType || '') + '</td><td>' + (e.traceId || '') + '</td></tr>';
    });
    if (entries.length === 0) html += '<tr><td colspan="3">No entries.</td></tr>';
    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  global.GRX26 = global.GRX26 || {};
  global.GRX26.Panels = { renderSystemStatus: renderSystemStatus, renderAuditLog: renderAuditLog };
})(typeof window !== 'undefined' ? window : this);
