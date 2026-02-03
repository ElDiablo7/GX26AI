/**
 * Sentinel UI Controller - Complete Control Interface
 * Handles all UI interactions for Sentinel module
 */
(function() {
  'use strict';

  // Ensure Utils is available
  if (!window.Utils && window.TitanSentinelUtils) {
    window.Utils = window.TitanSentinelUtils;
  }

  var SentinelUI = {
    initialized: false,
    refreshInterval: null,

    init: function() {
      if (this.initialized) return;
      this.initialized = true;

      // Load Sentinel core if available
      if (typeof Sentinel === 'undefined') {
        console.warn('SentinelUI: Sentinel core not loaded. Loading scripts...');
        this.loadSentinelCore();
        return;
      }

      this.setupEventListeners();
      this.loadPolicyPacks();
      this.updateUI();
      this.startAutoRefresh();
    },

    loadSentinelCore: function() {
      // Try to load Sentinel core scripts
      var scripts = [
        'assets/js/governance/titan-sentinel-utils.js',
        'assets/js/governance/titan-sentinel-logs.js',
        'assets/js/governance/titan-sentinel-policy.js',
        'assets/js/governance/titan-sentinel-core.js'
      ];

      var loaded = 0;
      var self = this;
      scripts.forEach(function(src) {
        var script = document.createElement('script');
        script.src = src;
        script.onload = function() {
          loaded++;
          if (loaded === scripts.length) {
            setTimeout(function() {
              self.setupEventListeners();
              self.loadPolicyPacks();
              self.updateUI();
              self.startAutoRefresh();
            }, 100);
          }
        };
        script.onerror = function() {
          console.warn('SentinelUI: Failed to load', src);
          loaded++;
        };
        document.head.appendChild(script);
      });
    },

    setupEventListeners: function() {
      var self = this;

      // Authentication
      var authBtn = document.getElementById('sentinel-auth-btn');
      var authInput = document.getElementById('sentinel-auth-input');
      var logoutBtn = document.getElementById('sentinel-logout-btn');

      if (authBtn && typeof Sentinel !== 'undefined') {
        authBtn.addEventListener('click', function() {
          var pin = authInput.value;
          if (pin) {
            var result = Sentinel.authenticate(pin);
            if (result.success) {
              self.updateUI();
              alert('Authentication successful');
            } else {
              alert('Authentication failed: ' + result.message);
            }
          }
        });
      }

      if (logoutBtn && typeof Sentinel !== 'undefined') {
        logoutBtn.addEventListener('click', function() {
          Sentinel.sessionEnd();
          self.updateUI();
        });
      }

      if (authInput) {
        authInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter' && authBtn) {
            authBtn.click();
          }
        });
      }

      // Role selection
      var roleSelect = document.getElementById('sentinel-role-select');
      if (roleSelect && typeof Sentinel !== 'undefined') {
        roleSelect.addEventListener('change', function() {
          Sentinel.setRole(this.value);
          self.updateUI();
        });
      }

      // Posture buttons
      document.querySelectorAll('.sentinel-posture-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (typeof Sentinel !== 'undefined') {
            var posture = this.dataset.posture;
            Sentinel.setPosture(posture);
            self.updateUI();
          }
        });
      });

      // Lockdown switch
      var lockdownSwitch = document.getElementById('sentinel-lockdown-switch');
      var lockdownReason = document.getElementById('sentinel-lockdown-reason');
      if (lockdownSwitch && typeof Sentinel !== 'undefined') {
        lockdownSwitch.addEventListener('change', function() {
          if (this.checked) {
            var reason = lockdownReason ? lockdownReason.value : 'Operator initiated';
            Sentinel.lockdown(reason);
            if (lockdownReason) lockdownReason.style.display = 'block';
          } else {
            var pin = prompt('Enter unlock PIN:');
            if (pin) {
              Sentinel.unlockdown(pin);
              if (lockdownReason) lockdownReason.style.display = 'none';
            } else {
              this.checked = true;
            }
          }
          self.updateUI();
        });
      }

      // Policy selection
      var policySelect = document.getElementById('sentinel-policy-select');
      if (policySelect && typeof Sentinel !== 'undefined') {
        policySelect.addEventListener('change', function() {
          Sentinel.loadPolicyPack(this.value);
          self.updateUI();
          self.updatePolicyInfo();
        });
      }

      // Command routing
      var routeBtn = document.getElementById('sentinel-route-btn');
      var commandInput = document.getElementById('sentinel-command-input');
      if (routeBtn && typeof Sentinel !== 'undefined') {
        routeBtn.addEventListener('click', function() {
          self.routeCommand();
        });
      }

      if (commandInput) {
        commandInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter' && routeBtn) {
            routeBtn.click();
          }
        });
      }

      // Quick commands
      document.querySelectorAll('.sentinel-quick-cmd').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (commandInput) {
            commandInput.value = this.dataset.cmd;
            self.routeCommand();
          }
        });
      });

      // Health check
      var healthBtn = document.getElementById('sentinel-health-check-btn');
      if (healthBtn && typeof Sentinel !== 'undefined') {
        healthBtn.addEventListener('click', function() {
          var health = Sentinel.healthCheck();
          alert('Health Check:\n' + JSON.stringify(health, null, 2));
        });
      }

      // Log management
      var refreshLogsBtn = document.getElementById('sentinel-refresh-logs-btn');
      if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', function() {
          self.updateLogs();
        });
      }

      var exportLogsBtn = document.getElementById('sentinel-export-logs-btn');
      if (exportLogsBtn && typeof Sentinel !== 'undefined') {
        exportLogsBtn.addEventListener('click', function() {
          Sentinel.auditExport();
        });
      }

      var verifyLogsBtn = document.getElementById('sentinel-verify-logs-btn');
      if (verifyLogsBtn && typeof Logs !== 'undefined') {
        verifyLogsBtn.addEventListener('click', function() {
          self.verifyLogs();
        });
      }
    },

    loadPolicyPacks: function() {
      if (typeof Policy === 'undefined' || typeof fetch === 'undefined') return;

      fetch('assets/data/policy_packs.json')
        .then(function(response) { return response.json(); })
        .then(function(data) {
          for (var pack in data) {
            Policy.loadPack(pack, data[pack]);
          }
          Policy.setActive('baseline_internal');
          SentinelUI.updatePolicyInfo();
        })
        .catch(function(err) {
          console.error('SentinelUI: Failed to load policy packs', err);
        });
    },

    routeCommand: function() {
      if (typeof Sentinel === 'undefined') {
        alert('Sentinel core not loaded');
        return;
      }

      var input = document.getElementById('sentinel-command-input');
      if (!input || !input.value.trim()) {
        alert('Please enter a command');
        return;
      }

      var command = input.value.trim();
      input.value = '';

      var result = Sentinel.route(command, {});
      this.displayResult(result);
      this.updateUI();
    },

    displayResult: function(result) {
      var resultDiv = document.getElementById('sentinel-command-result');
      var contentDiv = document.getElementById('sentinel-result-content');
      if (!resultDiv || !contentDiv) return;

      resultDiv.style.display = 'block';

      var html = '';
      if (result.error) {
        html = '<div style="color: #ef4444;"><strong>Error:</strong> ' + (Utils ? Utils.sanitize(result.error) : result.error) + '</div>';
      } else if (result.allowed) {
        html = '<div style="margin-bottom: 10px;">';
        html += '<div><strong>Status:</strong> <span style="color: #22c55e;">Allowed</span></div>';
        html += '<div><strong>Trace ID:</strong> ' + (result.traceId || 'N/A') + '</div>';
        html += '<div><strong>Risk Score:</strong> ' + (result.riskScore ? (result.riskScore * 100).toFixed(1) + '%' : 'N/A') + '</div>';
        html += '<div><strong>Posture:</strong> ' + (result.posture || 'GREEN') + '</div>';
        html += '<div><strong>TITAN Invoked:</strong> ' + (result.invokeTitan ? 'Yes' : 'No') + '</div>';
        if (result.summary) {
          html += '<div style="margin-top: 10px; padding: 10px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; border-radius: 4px;">';
          html += '<strong>Summary:</strong> ' + (Utils ? Utils.sanitize(result.summary) : result.summary);
          html += '</div>';
        }
        if (result.warnings && result.warnings.length > 0) {
          html += '<div style="margin-top: 10px;"><strong>Warnings:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
          result.warnings.forEach(function(w) {
            html += '<li>' + (Utils ? Utils.sanitize(w) : w) + '</li>';
          });
          html += '</ul></div>';
        }
        html += '</div>';
      } else {
        html = '<div style="color: #ef4444;"><strong>Blocked:</strong> ' + (Utils ? Utils.sanitize(result.reason || result.error || 'Unknown') : result.reason) + '</div>';
      }

      contentDiv.innerHTML = html;

      // Update risk display
      if (result.riskScore !== undefined) {
        this.updateRiskDisplay(result.riskScore);
      }
    },

    updateRiskDisplay: function(riskScore) {
      var riskValue = document.getElementById('sentinel-risk-value');
      var riskBar = document.getElementById('sentinel-risk-bar');
      if (riskValue) {
        riskValue.textContent = riskScore.toFixed(2);
        var color = riskScore < 0.3 ? '#22c55e' : riskScore < 0.7 ? '#fbbf24' : '#ef4444';
        riskValue.style.color = color;
      }
      if (riskBar) {
        riskBar.style.width = (riskScore * 100) + '%';
        var color = riskScore < 0.3 ? '#22c55e' : riskScore < 0.7 ? '#fbbf24' : '#ef4444';
        riskBar.style.background = color;
      }
    },

    updateUI: function() {
      if (typeof Sentinel === 'undefined') return;

      // Authentication status
      var authStatus = document.getElementById('sentinel-auth-status-text');
      var authStatusDiv = document.getElementById('sentinel-auth-status');
      var logoutBtn = document.getElementById('sentinel-logout-btn');
      var roleSelect = document.getElementById('sentinel-role-select');
      var sessionStatus = document.getElementById('sentinel-session-active');

      if (authStatus) {
        authStatus.textContent = Sentinel.authenticated ? 'Authenticated' : 'Not Authenticated';
      }
      if (authStatusDiv) {
        authStatusDiv.style.background = Sentinel.authenticated ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)';
        authStatusDiv.style.borderLeftColor = Sentinel.authenticated ? '#22c55e' : '#dc2626';
      }
      if (logoutBtn) {
        logoutBtn.disabled = !Sentinel.authenticated;
        logoutBtn.style.opacity = Sentinel.authenticated ? '1' : '0.5';
      }
      if (roleSelect) {
        roleSelect.value = Sentinel.currentRole;
        roleSelect.disabled = !Sentinel.authenticated;
      }
      if (sessionStatus) {
        sessionStatus.textContent = Sentinel.sessionActive ? 'Active' : 'Inactive';
      }

      // Posture display
      this.updatePostureDisplay();

      // Lockdown status
      var lockdownSwitch = document.getElementById('sentinel-lockdown-switch');
      var lockdownStatus = document.getElementById('sentinel-lockdown-status');
      if (lockdownSwitch) {
        lockdownSwitch.checked = Sentinel.lockdownActive;
      }
      if (lockdownStatus) {
        lockdownStatus.textContent = Sentinel.lockdownActive 
          ? 'LOCKDOWN ACTIVE: ' + (Sentinel.lockdownReason || 'No reason provided')
          : 'System operational';
      }

      // Health status
      if (typeof Sentinel.healthCheck === 'function') {
        var health = Sentinel.healthCheck();
        var healthInit = document.getElementById('health-initialized');
        var healthLogchain = document.getElementById('health-logchain');
        var healthPolicy = document.getElementById('health-policy');
        if (healthInit) healthInit.textContent = health.initialized ? '✓' : '✗';
        if (healthLogchain) {
          healthLogchain.textContent = health.logChainValid ? '✓' : '✗';
          healthLogchain.style.color = health.logChainValid ? '#22c55e' : '#ef4444';
        }
        if (healthPolicy) healthPolicy.textContent = health.policyPack ? '✓' : '✗';
      }
    },

    updatePostureDisplay: function() {
      if (typeof Sentinel === 'undefined') return;

      var postureText = document.getElementById('sentinel-posture-text');
      var postureDesc = document.getElementById('sentinel-posture-desc');
      var postureIndicator = document.getElementById('sentinel-posture-indicator');
      var postureDisplay = document.getElementById('sentinel-posture-display');

      var posture = Sentinel.currentPosture || 'GREEN';
      var configs = {
        'GREEN': { color: '#22c55e', desc: 'Normal operations', bg: 'rgba(34, 197, 94, 0.1)' },
        'AMBER': { color: '#fbbf24', desc: 'Elevated risk', bg: 'rgba(251, 191, 36, 0.1)' },
        'RED': { color: '#ef4444', desc: 'High risk', bg: 'rgba(239, 68, 68, 0.1)' },
        'BLACK': { color: '#dc2626', desc: 'Lockdown/Critical', bg: 'rgba(220, 38, 38, 0.2)' }
      };

      var config = configs[posture] || configs['GREEN'];

      if (postureText) postureText.textContent = posture;
      if (postureDesc) postureDesc.textContent = config.desc;
      if (postureIndicator) {
        postureIndicator.style.background = config.color;
        postureIndicator.style.boxShadow = '0 0 10px ' + config.color;
      }
      if (postureDisplay) {
        postureDisplay.style.borderLeftColor = config.color;
        postureDisplay.style.background = config.bg;
      }
    },

    updatePolicyInfo: function() {
      if (typeof Policy === 'undefined') return;

      var pack = Policy.getActive();
      var policyName = document.getElementById('policy-name');
      var policyDesc = document.getElementById('policy-desc');
      var policyRules = document.getElementById('sentinel-policy-rules');

      if (policyName && pack) policyName.textContent = pack.name || 'Unknown';
      if (policyDesc && pack) policyDesc.textContent = pack.description || 'No description';

      if (policyRules && pack) {
        var html = '';
        if (pack.allowed_actions && pack.allowed_actions.length > 0) {
          html += '<div style="margin-bottom: 10px;"><strong>Allowed:</strong> ' + pack.allowed_actions.join(', ') + '</div>';
        }
        if (pack.restricted_actions && pack.restricted_actions.length > 0) {
          html += '<div style="margin-bottom: 10px;"><strong>Restricted:</strong> ' + pack.restricted_actions.join(', ') + '</div>';
        }
        if (pack.two_person_rules && pack.two_person_rules.length > 0) {
          html += '<div style="margin-bottom: 10px;"><strong>Two-Person:</strong> ' + pack.two_person_rules.length + ' rules</div>';
        }
        policyRules.innerHTML = html || '<div>No rules defined</div>';
      }
    },

    updateLogs: function() {
      if (typeof Logs === 'undefined') return;

      var limit = parseInt(document.getElementById('sentinel-logs-limit')?.value || 50);
      var recent = Logs.renderRecent(limit);
      var tbody = document.getElementById('sentinel-audit-logs');

      if (!tbody) return;

      if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; opacity: 0.5;">No log entries</td></tr>';
        return;
      }

      tbody.innerHTML = recent.map(function(entry) {
        return '<tr>' +
          '<td>' + entry.time + '</td>' +
          '<td>' + entry.role + '</td>' +
          '<td>' + entry.action + '</td>' +
          '<td>' + entry.posture + '</td>' +
          '<td style="font-family: monospace; font-size: 11px;">' + (entry.traceId || '-') + '</td>' +
          '<td style="font-size: 11px; opacity: 0.8;">' + (entry.summary || '-') + '</td>' +
          '</tr>';
      }).join('');
    },

    verifyLogs: function() {
      if (typeof Logs === 'undefined') return;

      var verify = Logs.verify();
      var verifyDiv = document.getElementById('sentinel-log-verification');
      var verifyStatus = document.getElementById('log-verify-status');

      if (verifyDiv) {
        verifyDiv.style.display = 'block';
        verifyDiv.style.background = verify.valid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        verifyDiv.style.borderLeftColor = verify.valid ? '#22c55e' : '#ef4444';
      }
      if (verifyStatus) {
        verifyStatus.textContent = verify.valid ? '✓ Verified: ' + verify.message : '✗ Invalid: ' + verify.message;
        verifyStatus.style.color = verify.valid ? '#22c55e' : '#ef4444';
      }
    },

    startAutoRefresh: function() {
      var self = this;
      this.refreshInterval = setInterval(function() {
        self.updateUI();
        self.updateLogs();
      }, 5000);
    }
  };

  // Initialize when module loads
  document.addEventListener('gracex:module:loaded', function(ev) {
    if (ev.detail && ev.detail.module === 'sentinel') {
      setTimeout(function() {
        SentinelUI.init();
      }, 100);
    }
  });

  // Also try immediate init
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
      SentinelUI.init();
    }, 500);
  }

  window.SentinelUI = SentinelUI;
})();
