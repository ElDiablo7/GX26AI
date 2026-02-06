// GRACE-X Venus module — GRX26AI integration
// Anti-Hacking Cyber Security · Honeypot System · Predator Trapping
// Adapted for GRX26AI: uses Audit.log instead of SentinelLogs

(function () {
  'use strict';
  
  // Global permission flag (defaults to false). Setting this to true must be
  // performed by an authorised module/controller after logging an audit event.
  window.VENUS_PERMISSION = window.VENUS_PERMISSION || false;

  function updateStatus() {
    const statusEl = document.getElementById('venus-status');
    if (!statusEl) return;
    statusEl.textContent = window.VENUS_PERMISSION ? 'Permission granted.' : 'Permission not granted.';
  }

  function requestPermission() {
    // Log permission request via GRX26AI Audit system
    const traceId = 'venus-' + Date.now();
    try {
      if (window.Audit && window.Audit.log) {
        window.Audit.log('venus_permission_request', {}, traceId);
      }
    } catch (_) {}
    alert('Venus external interactions are sandboxed. Permission is required and must be granted by an authorised user.');
  }

  // Public API: call this to perform an external action. This will respect the permission flag.
  function externalAction() {
    const traceId = 'venus-' + Date.now();
    if (!window.VENUS_PERMISSION) {
      alert('Permission required');
      try {
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_action_denied', {}, traceId);
        }
      } catch (_) {}
      return;
    }
    // Simulated external action (would perform fetch or network call)
    try {
      if (window.Audit && window.Audit.log) {
        window.Audit.log('venus_external_action', { action: 'externalAction' }, traceId);
      }
    } catch (_) {}
    alert('External action performed');
  }

  // Wire up Venus UI buttons
  function initVenusUI() {
    // Permission button (if exists)
    const permBtn = document.getElementById('venus-permission-btn');
    if (permBtn) permBtn.addEventListener('click', requestPermission);

    // Arm all honeypots
    const armAllBtn = document.getElementById('venus-arm-all');
    if (armAllBtn) {
      armAllBtn.addEventListener('click', function() {
        const traceId = 'venus-' + Date.now();
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_arm_all', {}, traceId);
        }
        const items = document.querySelectorAll('.honeypot-item');
        items.forEach(function(item) {
          const statusEl = item.querySelector('.honeypot-status');
          if (statusEl) {
            statusEl.className = 'honeypot-status armed';
            statusEl.textContent = 'ARMED';
            item.classList.add('active');
          }
        });
      });
    }

    // Brain clear
    const clearBtn = document.getElementById('venus-brain-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        const output = document.getElementById('venus-brain-output');
        if (output) output.innerHTML = '<div class="brain-message brain-message-system venus-message">Venus online. All honeypots armed and monitoring. I\'m ready to trap anyone stupid enough to try attacking this system. What do you need?</div>';
      });
    }

    // Brain send (route via Core → Sentinel)
    const sendBtn = document.getElementById('venus-brain-send');
    const inputEl = document.getElementById('venus-brain-input');
    const outputEl = document.getElementById('venus-brain-output');
    if (sendBtn && inputEl && outputEl) {
      sendBtn.addEventListener('click', function() {
        const text = (inputEl.value || '').trim();
        if (!text) return;
        inputEl.value = '';
        
        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'brain-message venus-message';
        userMsg.textContent = text;
        outputEl.appendChild(userMsg);
        outputEl.scrollTop = outputEl.scrollHeight;

        // Route via Core → Sentinel
        if (window.CoreOrchestrator && window.CoreOrchestrator.handleUserRequest) {
          const result = window.CoreOrchestrator.handleUserRequest(text, { module: 'venus' });
          
          // Add response
          setTimeout(function() {
            const respMsg = document.createElement('div');
            respMsg.className = 'brain-message brain-message-system venus-message';
            respMsg.textContent = result.result && result.result.summary ? result.result.summary : 'Processed via Sentinel.';
            outputEl.appendChild(respMsg);
            outputEl.scrollTop = outputEl.scrollHeight;
          }, 300);
        } else {
          const respMsg = document.createElement('div');
          respMsg.className = 'brain-message brain-message-system venus-message';
          respMsg.textContent = 'Venus: Request processed. (Core orchestrator not available)';
          outputEl.appendChild(respMsg);
          outputEl.scrollTop = outputEl.scrollHeight;
        }
      });
    }

    // Enter key on input
    if (inputEl) {
      inputEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && sendBtn) sendBtn.click();
      });
    }

    // Export all evidence
    const exportAllBtn = document.getElementById('venus-export-all');
    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', function() {
        const traceId = 'venus-' + Date.now();
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_export_all', {}, traceId);
        }
        alert('Exporting all evidence...\n\nThis would generate a complete evidence package with all logs, captures, and transcripts.');
      });
    }

    // Guardian integration buttons
    const engagePredatorBtn = document.getElementById('venus-engage-predator');
    if (engagePredatorBtn) {
      engagePredatorBtn.addEventListener('click', function() {
        const traceId = 'venus-' + Date.now();
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_engage_predator', {}, traceId);
        }
        alert('🪤 Deploying honeypot engagement mode...\n\nVenus will impersonate target and engage predator to gather evidence.');
      });
    }

    const viewThreatBtn = document.getElementById('venus-view-threat');
    if (viewThreatBtn) {
      viewThreatBtn.addEventListener('click', function() {
        const traceId = 'venus-' + Date.now();
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_view_threat', {}, traceId);
        }
        alert('Threat Details:\n\nGuardian has flagged suspicious contact. Review evidence vault for full details.');
      });
    }

    // Threat analysis button
    const threatAnalysisBtn = document.getElementById('venus-threat-analysis');
    if (threatAnalysisBtn) {
      threatAnalysisBtn.addEventListener('click', function() {
        const traceId = 'venus-' + Date.now();
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_threat_analysis', {}, traceId);
        }
        alert('Running threat analysis...\n\nAnalyzing all active traps, intrusions, and evidence patterns.');
      });
    }

    // Lockdown button
    const lockdownBtn = document.getElementById('venus-lockdown');
    if (lockdownBtn) {
      lockdownBtn.addEventListener('click', function() {
        if (confirm('⚠️ ACTIVATE LOCKDOWN MODE?\n\nThis will:\n- Disable all external connections\n- Freeze all honeypots\n- Generate emergency report\n\nContinue?')) {
          const traceId = 'venus-' + Date.now();
          if (window.Audit && window.Audit.log) {
            window.Audit.log('venus_lockdown', {}, traceId);
          }
          alert('🔒 LOCKDOWN MODE ACTIVATED\n\nAll systems secured. Emergency report generated.');
        }
      });
    }

    // Report type buttons
    document.querySelectorAll('.report-type-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const reportType = this.dataset.type;
        const traceId = 'venus-' + Date.now();
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_report_generate', { type: reportType }, traceId);
        }
        const reportStatus = document.getElementById('venus-report-status');
        if (reportStatus) {
          reportStatus.innerHTML = '<p style="color: #10b981;">✓ Generating ' + reportType.toUpperCase() + ' report...\n\nEvidence package will be formatted for ' + 
            (reportType === 'police' ? 'UK Police / Action Fraud' :
             reportType === 'ceop' ? 'CEOP (Child Exploitation & Online Protection)' :
             reportType === 'ncsc' ? 'NCSC (National Cyber Security Centre)' :
             'Internal use') + '</p>';
        }
      });
    });

    // Timeline range selector
    const timelineRange = document.getElementById('venus-timeline-range');
    if (timelineRange) {
      timelineRange.addEventListener('change', function() {
        const traceId = 'venus-' + Date.now();
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_timeline_change', { range: this.value }, traceId);
        }
        // Update timeline display (placeholder)
        console.log('[Venus] Timeline range changed to:', this.value);
      });
    }

    // Auto-engage toggle
    const autoEngage = document.getElementById('venus-auto-engage');
    if (autoEngage) {
      autoEngage.addEventListener('change', function() {
        const traceId = 'venus-' + Date.now();
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_auto_engage_toggle', { enabled: this.checked }, traceId);
        }
      });
    }

    // Notify authorities toggle
    const notifyAuthorities = document.getElementById('venus-notify-authorities');
    if (notifyAuthorities) {
      notifyAuthorities.addEventListener('change', function() {
        const traceId = 'venus-' + Date.now();
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_notify_authorities_toggle', { enabled: this.checked }, traceId);
        }
      });
    }

    // Evidence category clicks
    document.querySelectorAll('.evidence-category').forEach(function(cat) {
      cat.addEventListener('click', function() {
        const category = this.dataset.category;
        const traceId = 'venus-' + Date.now();
        if (window.Audit && window.Audit.log) {
          window.Audit.log('venus_evidence_category_view', { category: category }, traceId);
        }
        alert('Viewing ' + category + ' evidence...\n\nThis would show all files in this category.');
      });
    });

    updateStatus();
  }

  // Bind UI on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVenusUI);
  } else {
    initVenusUI();
  }

  // Update status when module is loaded via router
  document.addEventListener('gracex:module:loaded', function(ev) {
    if (ev && ev.detail && ev.detail.module === 'venus') {
      setTimeout(function() {
        initVenusUI();
        updateStatus();
      }, 50);
    }
  });

  // Expose API
  window.Venus = { externalAction: externalAction, requestPermission: requestPermission };
})();
