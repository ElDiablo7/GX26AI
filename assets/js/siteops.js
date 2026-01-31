// =====================================================
// GRACE-X SiteOps™ v2.0
// Construction Project Management Brain
// Multi-trade coordination, programme control, compliance
// =====================================================

(function() {
  'use strict';

  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  
  const STORAGE_KEY = 'gracex_siteops_project';

  const state = {
    project: {
      name: '',
      address: '',
      status: 'planning',
      startDate: '',
      constraints: {}
    },
    phases: [],
    trades: [],
    dependencies: [],
    gates: [],
    issues: [],
    dailyLogs: [],
    changes: []
  };

  // Phase ID counter
  let phaseIdCounter = 1;
  let issueIdCounter = 1;
  let changeIdCounter = 1;

  // =====================================================
  // STANDARD CONSTRUCTION DEPENDENCIES
  // =====================================================
  
  const STANDARD_DEPENDENCIES = [
    { from: 'demolition', to: 'structural', reason: 'Structural cannot start until demolition complete' },
    { from: 'structural', to: 'first-fix', reason: 'First fix requires structural sign-off' },
    { from: 'first-fix-mep', to: 'plaster', reason: 'No plaster before M&E first fix signed off' },
    { from: 'plaster', to: 'second-fix', reason: 'Second fix after plaster cured' },
    { from: 'wet-trades', to: 'flooring', reason: 'No flooring before wet trades cured' },
    { from: 'final-mep', to: 'kitchen', reason: 'Kitchen install after final M&E positions confirmed' },
    { from: 'second-fix', to: 'decoration', reason: 'Decoration after second fix complete' },
    { from: 'decoration', to: 'snagging', reason: 'Snagging after decoration' }
  ];

  // Gate types
  const GATE_TYPES = [
    { id: 'bc-foundation', name: 'Building Control - Foundation', phase: 'foundation' },
    { id: 'bc-dpc', name: 'Building Control - DPC', phase: 'structural' },
    { id: 'bc-structural', name: 'Building Control - Structural', phase: 'structural' },
    { id: 'part-p', name: 'Part P - Electrical', phase: 'first-fix-mep' },
    { id: 'gas-safe', name: 'Gas Safe Certification', phase: 'first-fix-mep' },
    { id: 'bc-insulation', name: 'Building Control - Insulation', phase: 'insulation' },
    { id: 'bc-completion', name: 'Building Control - Completion', phase: 'completion' },
    { id: 'fire-safety', name: 'Fire Safety Certificate', phase: 'completion' },
    { id: 'asbestos', name: 'Asbestos Survey', phase: 'demolition' }
  ];

  // Trade types
  const TRADE_TYPES = [
    'Demolition', 'Groundworks', 'Structural', 'Brickwork', 'Roofing',
    'Carpentry', 'Plumbing', 'Electrical', 'Plastering', 'Tiling',
    'Flooring', 'Painting', 'Kitchen', 'Bathroom', 'Landscaping'
  ];

  // =====================================================
  // PERSISTENCE
  // =====================================================
  
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('[GRACEX SITEOPS] Project saved');
    } catch (e) {
      console.warn('[GRACEX SITEOPS] Failed to save:', e);
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state, parsed);
        // Restore counters
        if (state.phases.length > 0) {
          phaseIdCounter = Math.max(...state.phases.map(p => p.id)) + 1;
        }
        if (state.issues.length > 0) {
          issueIdCounter = Math.max(...state.issues.map(i => i.id)) + 1;
        }
        if (state.changes.length > 0) {
          changeIdCounter = Math.max(...state.changes.map(c => c.id)) + 1;
        }
        console.log('[GRACEX SITEOPS] Project loaded');
      }
    } catch (e) {
      console.warn('[GRACEX SITEOPS] Failed to load:', e);
    }
  }

  // =====================================================
  // DASHBOARD
  // =====================================================
  
  function updateDashboard() {
    // Update project info
    const nameEl = document.getElementById('siteops-project-name');
    const addressEl = document.getElementById('siteops-project-address');
    const statusEl = document.getElementById('siteops-project-status');
    const startEl = document.getElementById('siteops-project-start');
    
    if (nameEl) nameEl.value = state.project.name || '';
    if (addressEl) addressEl.value = state.project.address || '';
    if (statusEl) statusEl.value = state.project.status || 'planning';
    if (startEl) startEl.value = state.project.startDate || '';

    // Update status badge
    const badge = document.getElementById('siteops-status-badge');
    if (badge) {
      badge.textContent = state.project.status ? state.project.status.charAt(0).toUpperCase() + state.project.status.slice(1) : 'Planning';
      badge.className = 'siteops-status-badge siteops-status-' + (state.project.status || 'planning');
    }

    // Update health indicator
    const health = document.getElementById('siteops-health');
    const blockers = state.issues.filter(i => i.category === 'blocker' && i.status !== 'closed');
    if (health) {
      if (blockers.length > 0) {
        health.textContent = '🔴 ' + blockers.length + ' Blocker(s)';
      } else if (state.issues.filter(i => i.severity === 'high' && i.status !== 'closed').length > 0) {
        health.textContent = '🟡 Issues pending';
      } else {
        health.textContent = '🟢 Healthy';
      }
    }

    // Update dashboard cards
    updateTodayFocus();
    updateBlockingIssues();
    updateGatesDue();
    updateConstraintsSummary();
  }

  function updateTodayFocus() {
    const el = document.getElementById('siteops-today-focus');
    if (!el) return;

    const criticalPhases = state.phases.filter(p => p.critical && p.status === 'in-progress');
    if (criticalPhases.length > 0) {
      el.innerHTML = criticalPhases.map(p => `<strong>${p.name}</strong> (${p.trade})`).join('<br>');
    } else {
      const inProgress = state.phases.filter(p => p.status === 'in-progress');
      if (inProgress.length > 0) {
        el.innerHTML = inProgress.slice(0, 2).map(p => `${p.name}`).join('<br>');
      } else {
        el.textContent = 'No phases in progress';
      }
    }
  }

  function updateBlockingIssues() {
    const el = document.getElementById('siteops-blocking-issues');
    if (!el) return;

    const blockers = state.issues.filter(i => i.category === 'blocker' && i.status !== 'closed');
    if (blockers.length > 0) {
      el.innerHTML = blockers.slice(0, 3).map(b => `⚠️ ${b.description}`).join('<br>');
    } else {
      el.textContent = '✅ No blockers';
    }
  }

  function updateGatesDue() {
    const el = document.getElementById('siteops-gates-due');
    if (!el) return;

    const pendingGates = state.gates.filter(g => g.status === 'not-booked' || g.status === 'booked');
    if (pendingGates.length > 0) {
      el.innerHTML = pendingGates.slice(0, 3).map(g => `🔒 ${g.type}`).join('<br>');
    } else {
      el.textContent = 'No gates pending';
    }
  }

  function updateConstraintsSummary() {
    const el = document.getElementById('siteops-constraints-summary');
    if (!el) return;

    const constraints = [];
    if (document.getElementById('siteops-constraint-occupied')?.checked) constraints.push('Occupied');
    if (document.getElementById('siteops-constraint-kids')?.checked) constraints.push('Kids');
    if (document.getElementById('siteops-constraint-neighbours')?.checked) constraints.push('Neighbours');

    el.textContent = constraints.length > 0 ? constraints.join(', ') : 'No special constraints';
  }

  // =====================================================
  // PROGRAMME MANAGEMENT
  // =====================================================
  
  function addPhase(phaseData = null) {
    const phase = phaseData || {
      id: phaseIdCounter++,
      name: prompt('Phase name:') || 'New Phase',
      trade: prompt('Trade owner:') || 'TBC',
      startDay: 1,
      duration: 5,
      dependsOn: [],
      gateRequired: false,
      status: 'not-started',
      critical: false,
      notes: ''
    };

    if (!phase.name) return;

    state.phases.push(phase);
    saveState();
    renderProgramme();
    updateDashboard();

    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast(`Phase "${phase.name}" added`, 'success');
    }
  }

  function renderProgramme() {
    const tbody = document.getElementById('siteops-programme-body');
    const empty = document.getElementById('siteops-programme-empty');
    const table = document.getElementById('siteops-programme-table');

    if (!tbody) return;

    if (state.phases.length === 0) {
      if (table) table.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (table) table.style.display = 'table';
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = state.phases.map(phase => `
      <tr class="siteops-phase-row ${phase.critical ? 'critical-path' : ''}" data-id="${phase.id}">
        <td><strong>${phase.name}</strong></td>
        <td>${phase.trade}</td>
        <td>Day ${phase.startDay}</td>
        <td>${phase.duration} days</td>
        <td>${phase.dependsOn?.length > 0 ? phase.dependsOn.map(d => getPhaseNameById(d)).join(', ') : '—'}</td>
        <td>${phase.gateRequired ? '🔒 Yes' : '—'}</td>
        <td>
          <select class="phase-status-select" data-id="${phase.id}">
            <option value="not-started" ${phase.status === 'not-started' ? 'selected' : ''}>Not Started</option>
            <option value="in-progress" ${phase.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="waiting" ${phase.status === 'waiting' ? 'selected' : ''}>Waiting</option>
            <option value="blocked" ${phase.status === 'blocked' ? 'selected' : ''}>Blocked</option>
            <option value="done" ${phase.status === 'done' ? 'selected' : ''}>Done</option>
          </select>
        </td>
        <td>
          <button class="builder-btn phase-edit-btn" data-id="${phase.id}" style="padding: 4px 8px; font-size: 0.8em;">✏️</button>
          <button class="builder-btn phase-delete-btn" data-id="${phase.id}" style="padding: 4px 8px; font-size: 0.8em;">🗑️</button>
        </td>
      </tr>
    `).join('');

    // Wire event listeners
    tbody.querySelectorAll('.phase-status-select').forEach(select => {
      select.addEventListener('change', function() {
        const id = parseInt(this.dataset.id);
        const phase = state.phases.find(p => p.id === id);
        if (phase) {
          phase.status = this.value;
          saveState();
          updateDashboard();
        }
      });
    });

    tbody.querySelectorAll('.phase-delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        if (confirm('Delete this phase?')) {
          state.phases = state.phases.filter(p => p.id !== id);
          saveState();
          renderProgramme();
          updateDashboard();
        }
      });
    });
  }

  function getPhaseNameById(id) {
    const phase = state.phases.find(p => p.id === id);
    return phase ? phase.name : 'Unknown';
  }

  function recalculateProgramme() {
    // Simple forward pass calculation
    state.phases.forEach(phase => {
      if (phase.dependsOn && phase.dependsOn.length > 0) {
        let maxEnd = 0;
        phase.dependsOn.forEach(depId => {
          const dep = state.phases.find(p => p.id === depId);
          if (dep) {
            const depEnd = dep.startDay + dep.duration;
            if (depEnd > maxEnd) maxEnd = depEnd;
          }
        });
        phase.startDay = maxEnd;
      }
    });

    saveState();
    renderProgramme();

    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast('Programme recalculated', 'success');
    }
  }

  function validateSequence() {
    const warnings = [];
    
    // Check each dependency
    state.dependencies.forEach(dep => {
      const fromPhase = state.phases.find(p => p.name.toLowerCase().includes(dep.from) || p.trade?.toLowerCase().includes(dep.from));
      const toPhase = state.phases.find(p => p.name.toLowerCase().includes(dep.to) || p.trade?.toLowerCase().includes(dep.to));
      
      if (fromPhase && toPhase) {
        const fromEnd = fromPhase.startDay + fromPhase.duration;
        if (toPhase.startDay < fromEnd) {
          warnings.push(`⚠️ ${toPhase.name} starts before ${fromPhase.name} ends`);
        }
      }
    });

    // Check gates
    state.gates.filter(g => g.status !== 'passed' && g.blocks).forEach(gate => {
      const blockedPhase = state.phases.find(p => p.status === 'in-progress' && gate.blocks.includes(p.id));
      if (blockedPhase) {
        warnings.push(`🔒 Gate "${gate.type}" blocking ${blockedPhase.name}`);
      }
    });

    const warningEl = document.getElementById('siteops-sequence-warning');
    if (warningEl) {
      if (warnings.length > 0) {
        warningEl.innerHTML = warnings.join('<br>');
        warningEl.style.display = 'block';
    } else {
        warningEl.style.display = 'none';
      }
    }

    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast(warnings.length > 0 ? `${warnings.length} sequence issue(s) found` : 'Sequence valid ✅', warnings.length > 0 ? 'warning' : 'success');
    }

    return warnings;
  }

  // =====================================================
  // TRADES MANAGEMENT
  // =====================================================
  
  function addTrade() {
    const trade = {
      id: Date.now(),
      type: prompt('Trade type:', TRADE_TYPES[0]) || 'General',
      scope: prompt('Scope summary:') || '',
      accessNeeds: '',
      certRequired: false,
      status: 'not-started'
    };

    state.trades.push(trade);
    saveState();
    renderTrades();
  }

  function renderTrades() {
    const container = document.getElementById('siteops-trades-list');
    const empty = document.getElementById('siteops-trades-empty');

    if (!container) return;

    if (state.trades.length === 0) {
      container.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';

    container.innerHTML = state.trades.map(trade => `
      <div class="siteops-trade-card" data-id="${trade.id}">
        <div class="trade-header">
          <strong>${trade.type}</strong>
          <span class="trade-status trade-status-${trade.status}">${trade.status.replace('-', ' ')}</span>
        </div>
        <div class="trade-scope">${trade.scope || 'No scope defined'}</div>
        <div class="trade-actions">
          <button class="builder-btn trade-delete-btn" data-id="${trade.id}" style="padding: 4px 8px; font-size: 0.8em;">🗑️</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.trade-delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        state.trades = state.trades.filter(t => t.id !== id);
        saveState();
        renderTrades();
      });
    });
  }

  // =====================================================
  // GATES & INSPECTIONS
  // =====================================================
  
  function addGate() {
    const type = prompt('Gate type (e.g. Building Control, Part P, Gas Safe):');
    if (!type) return;

    const gate = {
      id: Date.now(),
      type: type,
      relatedPhase: prompt('Related phase:') || '',
      required: 'before',
      status: 'not-booked',
      blocks: []
    };

    state.gates.push(gate);
    saveState();
    renderGates();
    updateDashboard();
  }

  function renderGates() {
    const tbody = document.getElementById('siteops-gates-body');
    const empty = document.getElementById('siteops-gates-empty');
    const table = document.getElementById('siteops-gates-table');

    if (!tbody) return;

    if (state.gates.length === 0) {
      if (table) table.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (table) table.style.display = 'table';
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = state.gates.map(gate => `
      <tr data-id="${gate.id}">
        <td><strong>${gate.type}</strong></td>
        <td>${gate.relatedPhase || '—'}</td>
        <td>${gate.required}</td>
        <td>
          <select class="gate-status-select" data-id="${gate.id}">
            <option value="not-booked" ${gate.status === 'not-booked' ? 'selected' : ''}>Not Booked</option>
            <option value="booked" ${gate.status === 'booked' ? 'selected' : ''}>Booked</option>
            <option value="passed" ${gate.status === 'passed' ? 'selected' : ''}>Passed ✓</option>
            <option value="failed" ${gate.status === 'failed' ? 'selected' : ''}>Failed ✗</option>
            <option value="not-needed" ${gate.status === 'not-needed' ? 'selected' : ''}>Not Needed</option>
          </select>
        </td>
        <td>
          <button class="builder-btn gate-delete-btn" data-id="${gate.id}" style="padding: 4px 8px; font-size: 0.8em;">🗑️</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.gate-status-select').forEach(select => {
      select.addEventListener('change', function() {
        const id = parseInt(this.dataset.id);
        const gate = state.gates.find(g => g.id === id);
        if (gate) {
          gate.status = this.value;
          saveState();
          updateDashboard();
        }
      });
    });

    tbody.querySelectorAll('.gate-delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        state.gates = state.gates.filter(g => g.id !== id);
        saveState();
        renderGates();
      });
    });
  }

  // =====================================================
  // ISSUES MANAGEMENT
  // =====================================================
  
  function toggleIssueForm() {
    const form = document.getElementById('siteops-issue-form');
    if (form) {
      form.style.display = form.style.display === 'none' ? 'grid' : 'none';
    }
  }

  function saveIssue() {
    const category = document.getElementById('siteops-issue-category')?.value;
    const severity = document.getElementById('siteops-issue-severity')?.value;
    const desc = document.getElementById('siteops-issue-desc')?.value;
    const owner = document.getElementById('siteops-issue-owner')?.value;

    if (!desc) {
      if (window.GRACEX_Utils) GRACEX_Utils.showToast('Description required', 'error');
      return;
    }

    const issue = {
      id: issueIdCounter++,
      category: category,
      severity: severity,
      description: desc,
      owner: owner,
      status: 'open',
      created: new Date().toISOString()
    };

    state.issues.push(issue);
    saveState();
    renderIssues();
    updateDashboard();
    toggleIssueForm();

    // Clear form
    document.getElementById('siteops-issue-desc').value = '';
    document.getElementById('siteops-issue-owner').value = '';

    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast(`Issue #${issue.id} logged`, 'success');
    }
  }

  function renderIssues() {
    const tbody = document.getElementById('siteops-issues-body');
    if (!tbody) return;

    tbody.innerHTML = state.issues.map(issue => `
      <tr class="issue-${issue.severity} ${issue.status === 'closed' ? 'issue-closed' : ''}">
        <td>#${issue.id}</td>
        <td><span class="issue-category issue-cat-${issue.category}">${issue.category}</span></td>
        <td>${issue.description}</td>
        <td><span class="issue-severity issue-sev-${issue.severity}">${issue.severity}</span></td>
        <td>${issue.owner || '—'}</td>
        <td>
          <select class="issue-status-select" data-id="${issue.id}">
            <option value="open" ${issue.status === 'open' ? 'selected' : ''}>Open</option>
            <option value="in-progress" ${issue.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="closed" ${issue.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
        <td>
          <button class="builder-btn issue-delete-btn" data-id="${issue.id}" style="padding: 4px 8px; font-size: 0.8em;">🗑️</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.issue-status-select').forEach(select => {
      select.addEventListener('change', function() {
        const id = parseInt(this.dataset.id);
        const issue = state.issues.find(i => i.id === id);
        if (issue) {
          issue.status = this.value;
          saveState();
          updateDashboard();
        }
      });
    });

    tbody.querySelectorAll('.issue-delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        state.issues = state.issues.filter(i => i.id !== id);
        saveState();
        renderIssues();
        updateDashboard();
      });
    });
  }

  // =====================================================
  // DAILY OPS
  // =====================================================
  
  function saveDailyLog() {
    const date = document.getElementById('siteops-daily-date')?.value;
    const who = document.getElementById('siteops-daily-who')?.value;
    const what = document.getElementById('siteops-daily-what')?.value;
    const deliveries = document.getElementById('siteops-daily-deliveries')?.value;
    const delays = document.getElementById('siteops-daily-delays')?.value;
    const weather = document.getElementById('siteops-daily-weather')?.value;

    if (!date || !what) {
      if (window.GRACEX_Utils) GRACEX_Utils.showToast('Date and activity required', 'error');
      return;
    }

    const log = {
      date: date,
      who: who,
      what: what,
      deliveries: deliveries,
      delays: delays,
      weather: weather,
      timestamp: new Date().toISOString()
    };

    state.dailyLogs.push(log);
    saveState();

    // Clear form
    document.getElementById('siteops-daily-what').value = '';
    document.getElementById('siteops-daily-deliveries').value = '';
    document.getElementById('siteops-daily-delays').value = '';

    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast('Daily log saved', 'success');
    }
  }

  function viewDailyHistory() {
    const output = document.getElementById('siteops-daily-output');
    if (!output) return;

    if (state.dailyLogs.length === 0) {
      output.textContent = 'No daily logs recorded yet.';
      output.style.display = 'block';
      return;
    }

    const lines = [];
    lines.push('═══════════════════════════════════════');
    lines.push('DAILY OPS LOG HISTORY');
    lines.push('═══════════════════════════════════════');

    state.dailyLogs.slice().reverse().forEach(log => {
      lines.push('');
      lines.push(`📅 ${log.date}`);
      lines.push(`Who: ${log.who || '—'}`);
      lines.push(`Activity: ${log.what}`);
      if (log.deliveries) lines.push(`Deliveries: ${log.deliveries}`);
      if (log.delays) lines.push(`Delays: ${log.delays}`);
      lines.push(`Weather: ${log.weather}`);
      lines.push('───────────────────────────────────────');
    });

    output.textContent = lines.join('\n');
    output.style.display = 'block';
  }

  // =====================================================
  // CHANGE CONTROL
  // =====================================================
  
  function toggleChangeForm() {
    const form = document.getElementById('siteops-change-form');
    if (form) {
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
  }

  function saveChange() {
    const desc = document.getElementById('siteops-change-desc')?.value;
    const reason = document.getElementById('siteops-change-reason')?.value;
    const time = document.getElementById('siteops-change-time')?.value;
    const cost = document.getElementById('siteops-change-cost')?.value;
    const phases = document.getElementById('siteops-change-phases')?.value;

    if (!desc) {
      if (window.GRACEX_Utils) GRACEX_Utils.showToast('Description required', 'error');
      return;
    }

    const change = {
      id: changeIdCounter++,
      description: desc,
      reason: reason,
      timeImpact: parseInt(time) || 0,
      costImpact: parseInt(cost) || 0,
      affectedPhases: phases,
      status: 'pending',
      created: new Date().toISOString()
    };

    state.changes.push(change);
    saveState();
    renderChanges();
    toggleChangeForm();

    // Clear form
    document.getElementById('siteops-change-desc').value = '';
    document.getElementById('siteops-change-reason').value = '';
    document.getElementById('siteops-change-time').value = '';
    document.getElementById('siteops-change-cost').value = '';
    document.getElementById('siteops-change-phases').value = '';

    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast(`Change #${change.id} logged`, 'success');
    }
  }

  function renderChanges() {
    const tbody = document.getElementById('siteops-changes-body');
    if (!tbody) return;

    tbody.innerHTML = state.changes.map(change => `
      <tr>
        <td>#${change.id}</td>
        <td>${change.description}</td>
        <td>${change.timeImpact > 0 ? '+' + change.timeImpact + ' days' : '—'}</td>
        <td>${change.costImpact > 0 ? '£' + change.costImpact : '—'}</td>
        <td>
          <select class="change-status-select" data-id="${change.id}">
            <option value="pending" ${change.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${change.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="rejected" ${change.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
        <td>
          <button class="builder-btn change-delete-btn" data-id="${change.id}" style="padding: 4px 8px; font-size: 0.8em;">🗑️</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.change-status-select').forEach(select => {
      select.addEventListener('change', function() {
        const id = parseInt(this.dataset.id);
        const change = state.changes.find(c => c.id === id);
        if (change) {
          change.status = this.value;
          saveState();
          if (change.status === 'approved' && change.timeImpact > 0) {
            if (window.GRACEX_Utils) {
              GRACEX_Utils.showToast('Change approved - recalculate programme', 'warning');
            }
          }
        }
      });
    });

    tbody.querySelectorAll('.change-delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        state.changes = state.changes.filter(c => c.id !== id);
        saveState();
        renderChanges();
      });
    });
  }

  // =====================================================
  // RAMS GENERATION
  // =====================================================
  
  function generateProjectRAMS() {
    const output = document.getElementById('siteops-rams-output');
    if (!output) return;

    const lines = [];
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('GRACE-X SITEOPS™ PROJECT RISK ASSESSMENT');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Project: ${state.project.name || 'Unnamed'}`);
    lines.push(`Site: ${state.project.address || '—'}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');
    
    lines.push('SITE CONSTRAINTS');
    lines.push('────────────────');
    if (document.getElementById('siteops-constraint-occupied')?.checked) {
      lines.push('⚠️ OCCUPIED PROPERTY - additional safety measures required');
    }
    if (document.getElementById('siteops-constraint-kids')?.checked) {
      lines.push('⚠️ CHILDREN MAY BE PRESENT - secure all hazards');
    }
    if (document.getElementById('siteops-constraint-neighbours')?.checked) {
      lines.push('⚠️ NEIGHBOUR SENSITIVITY - observe noise windows');
    }
    lines.push('');

    lines.push('PHASE-BY-PHASE HAZARDS');
    lines.push('──────────────────────');
    
    state.phases.forEach(phase => {
      lines.push('');
      lines.push(`▶ ${phase.name} (${phase.trade})`);
      
      // Generic hazards by trade
      const hazards = getHazardsForTrade(phase.trade);
      hazards.forEach(h => lines.push(`  • ${h}`));
    });

    lines.push('');
    lines.push('GENERAL CONTROLS');
    lines.push('────────────────');
    lines.push('✓ Daily briefings before work starts');
    lines.push('✓ PPE requirements enforced');
    lines.push('✓ First aid kit on site');
    lines.push('✓ Emergency contacts displayed');
    lines.push('✓ Fire extinguisher available');
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');

    output.textContent = lines.join('\n');

    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast('Project RAMS generated', 'success');
    }
  }

  function getHazardsForTrade(trade) {
    const t = (trade || '').toLowerCase();
    
    if (t.includes('demolition') || t.includes('strip')) {
      return ['Flying debris', 'Dust inhalation', 'Structural collapse', 'Hidden services'];
    }
    if (t.includes('electric')) {
      return ['Electric shock', 'Burns', 'Fire risk', 'Part P compliance required'];
    }
    if (t.includes('plumb')) {
      return ['Scalding', 'Flooding', 'Legionella', 'Manual handling'];
    }
    if (t.includes('plaster')) {
      return ['Dermatitis', 'Manual handling', 'Dust', 'Working at height (ceilings)'];
    }
    if (t.includes('roof')) {
      return ['Falls from height', 'Fragile surfaces', 'Weather conditions', 'Manual handling'];
    }
    return ['Manual handling', 'Slips/trips', 'Tool use', 'Site traffic'];
  }

  // =====================================================
  // REPORTS
  // =====================================================
  
  function generateWeeklyReport() {
    const output = document.getElementById('siteops-report-output');
    if (!output) return;

    const lines = [];
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('WEEKLY SITE REPORT');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push(`Project: ${state.project.name || 'Unnamed'}`);
    lines.push(`Week ending: ${new Date().toLocaleDateString()}`);
    lines.push(`Status: ${state.project.status}`);
    lines.push('');
    
    lines.push('PROGRAMME STATUS');
    lines.push('────────────────');
    const done = state.phases.filter(p => p.status === 'done').length;
    const inProgress = state.phases.filter(p => p.status === 'in-progress').length;
    const blocked = state.phases.filter(p => p.status === 'blocked').length;
    lines.push(`Completed: ${done}/${state.phases.length} phases`);
    lines.push(`In Progress: ${inProgress}`);
    lines.push(`Blocked: ${blocked}`);
    lines.push('');

    lines.push('ISSUES SUMMARY');
    lines.push('──────────────');
    const openIssues = state.issues.filter(i => i.status !== 'closed');
    lines.push(`Open issues: ${openIssues.length}`);
    lines.push(`Blockers: ${state.issues.filter(i => i.category === 'blocker' && i.status !== 'closed').length}`);
    lines.push('');

    lines.push('GATES STATUS');
    lines.push('────────────');
    state.gates.forEach(g => {
      lines.push(`${g.type}: ${g.status}`);
    });
    lines.push('');

    lines.push('CHANGES THIS WEEK');
    lines.push('─────────────────');
    const recentChanges = state.changes.filter(c => {
      const created = new Date(c.created);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    });
    if (recentChanges.length > 0) {
      recentChanges.forEach(c => lines.push(`#${c.id}: ${c.description} (${c.status})`));
    } else {
      lines.push('No changes this week');
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');

    output.textContent = lines.join('\n');
    output.style.display = 'block';

    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast('Weekly report generated', 'success');
    }
  }

  // =====================================================
  // EXPORT
  // =====================================================
  
  function exportProgramme() {
    const lines = [];
    lines.push('GRACE-X SITEOPS PROGRAMME EXPORT');
    lines.push('Generated: ' + new Date().toISOString());
    lines.push('Project: ' + (state.project.name || 'Unnamed'));
    lines.push('');
    lines.push('PHASES');
    lines.push('──────');
    
    state.phases.forEach((p, idx) => {
      lines.push(`${idx + 1}. ${p.name}`);
      lines.push(`   Trade: ${p.trade}`);
      lines.push(`   Start: Day ${p.startDay}`);
      lines.push(`   Duration: ${p.duration} days`);
      lines.push(`   Status: ${p.status}`);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GRACEX_Programme_' + new Date().toISOString().split('T')[0] + '.txt';
    a.click();
    URL.revokeObjectURL(url);

    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast('Programme exported', 'success');
    }
  }

  // =====================================================
  // BUILDER INTEGRATION
  // =====================================================
  
  function importFromBuilder() {
    // Check if Builder scope pack exists
    const builderProjects = localStorage.getItem('builder_projects');
    const builderScope = localStorage.getItem('gracex_builder_scope');
    
    if (!builderProjects && !builderScope) {
      if (window.GRACEX_Utils) {
        GRACEX_Utils.showToast('No Builder data found - create a scope pack in Builder first', 'info');
      }
      return;
    }

    // Simple import - create phases from Builder scope items
    // This would be expanded in a full implementation
    if (window.GRACEX_Utils) {
      GRACEX_Utils.showToast('Builder import - feature coming soon', 'info');
    }
  }

  // =====================================================
  // WIRE BRAIN
  // =====================================================
  
  function wireSiteOpsBrain() {
    if (window.setupModuleBrain) {
      window.setupModuleBrain('siteops', {
        panelId: 'siteops-brain-panel',
        inputId: 'siteops-brain-input',
        sendId: 'siteops-brain-send',
        outputId: 'siteops-brain-output',
        clearId: 'siteops-brain-clear',
        initialMessage: "I'm GRACE-X SiteOps. I coordinate multi-trade projects and keep your programme on track. What's the project?"
      });
    }
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================
  
  function init() {
    console.log('[GRACEX SITEOPS] Initializing v2.0...');

    // Load saved state
    loadState();

    // Set today's date for daily log
    const dateInput = document.getElementById('siteops-daily-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Wire up all buttons
    document.getElementById('siteops-btn-add-phase')?.addEventListener('click', addPhase);
    document.getElementById('siteops-btn-programme-recalc')?.addEventListener('click', recalculateProgramme);
    document.getElementById('siteops-btn-sequence-check')?.addEventListener('click', validateSequence);
    document.getElementById('siteops-btn-trade-add')?.addEventListener('click', addTrade);
    document.getElementById('siteops-btn-gate-add')?.addEventListener('click', addGate);
    document.getElementById('siteops-btn-issue-add')?.addEventListener('click', toggleIssueForm);
    document.getElementById('siteops-issue-save')?.addEventListener('click', saveIssue);
    document.getElementById('siteops-daily-save')?.addEventListener('click', saveDailyLog);
    document.getElementById('siteops-daily-view')?.addEventListener('click', viewDailyHistory);
    document.getElementById('siteops-btn-change-new')?.addEventListener('click', toggleChangeForm);
    document.getElementById('siteops-change-save')?.addEventListener('click', saveChange);
    document.getElementById('siteops-change-cancel')?.addEventListener('click', toggleChangeForm);
    document.getElementById('siteops-btn-rams-generate')?.addEventListener('click', generateProjectRAMS);
    document.getElementById('siteops-btn-report-weekly')?.addEventListener('click', generateWeeklyReport);
    document.getElementById('siteops-btn-export-programme')?.addEventListener('click', exportProgramme);
    document.getElementById('siteops-btn-import-from-builder')?.addEventListener('click', importFromBuilder);

    // Project info save on change
    ['siteops-project-name', 'siteops-project-address', 'siteops-project-status', 'siteops-project-start'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', function() {
        state.project[this.id.replace('siteops-project-', '')] = this.value;
        saveState();
        updateDashboard();
      });
    });

    // Constraints save on change
    ['occupied', 'kids', 'pets', 'elderly', 'neighbours', 'parking'].forEach(c => {
      document.getElementById('siteops-constraint-' + c)?.addEventListener('change', function() {
        state.project.constraints[c] = this.checked;
        saveState();
        updateConstraintsSummary();
      });
    });

    // Render all
    renderProgramme();
    renderTrades();
    renderGates();
    renderIssues();
    renderChanges();
    updateDashboard();

    // Wire brain
    wireSiteOpsBrain();

    console.log('[GRACEX SITEOPS] Initialized successfully');
  }

  // =====================================================
  // MODULE HOOKS
  // =====================================================
  
  document.addEventListener('gracex:module:loaded', function(ev) {
    try {
      const detail = ev.detail || {};
      const mod = detail.module || '';
      const url = detail.url || '';

      if (mod === 'siteops' || (url && url.indexOf('siteops.html') !== -1)) {
        setTimeout(init, 100);
      }
    } catch (err) {
      console.warn('[GRACEX SITEOPS] Init via event failed:', err);
    }
  });

  // Direct open
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();
