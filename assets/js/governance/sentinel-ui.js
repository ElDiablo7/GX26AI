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
    titanInvocations: 0,

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

      if (authBtn) {
        authBtn.addEventListener('click', function() {
          var pin = authInput ? authInput.value : '';
          if (pin && typeof Sentinel !== 'undefined') {
            var result = Sentinel.authenticate(pin);
            if (result) {
              self.updateUI();
              if (typeof window.GRACEX_Utils !== 'undefined' && window.GRACEX_Utils.showToast) {
                window.GRACEX_Utils.showToast('Authentication successful', 'success', 2000);
              } else {
                alert('Authentication successful');
              }
            } else {
              if (typeof window.GRACEX_Utils !== 'undefined' && window.GRACEX_Utils.showToast) {
                window.GRACEX_Utils.showToast('Authentication failed', 'error', 2000);
              } else {
                alert('Authentication failed');
              }
            }
          }
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
          if (typeof Sentinel !== 'undefined' && Sentinel.sessionEnd) {
            Sentinel.sessionEnd();
          }
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
      if (roleSelect) {
        roleSelect.addEventListener('change', function() {
          if (typeof Sentinel !== 'undefined') {
            if (Sentinel.setRole) {
              Sentinel.setRole(this.value);
            } else {
              Sentinel.currentRole = this.value;
            }
            self.updateUI();
          }
        });
      }

      // Posture buttons
      document.querySelectorAll('.sentinel-posture-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (typeof Sentinel !== 'undefined') {
            var posture = this.dataset.posture;
            if (Sentinel.setPosture) {
              Sentinel.setPosture(posture);
            } else {
              Sentinel.posture = posture;
              Sentinel.currentPosture = posture;
            }
            self.updateUI();
          }
        });
      });

      // Lockdown switch
      var lockdownSwitch = document.getElementById('sentinel-lockdown-switch');
      var lockdownReason = document.getElementById('sentinel-lockdown-reason');
      if (lockdownSwitch) {
        lockdownSwitch.addEventListener('change', function() {
          if (typeof Sentinel !== 'undefined') {
            if (this.checked) {
              var reason = lockdownReason ? lockdownReason.value : 'Operator initiated';
              if (Sentinel.lockdown) {
                Sentinel.lockdown(reason);
              } else {
                Sentinel.lockdownActive = true;
                Sentinel.lockdownReason = reason;
                Sentinel.posture = 'BLACK';
                Sentinel.currentPosture = 'BLACK';
              }
              if (lockdownReason) lockdownReason.style.display = 'block';
            } else {
              var pin = prompt('Enter unlock PIN:');
              if (pin) {
                var unlocked = false;
                if (Sentinel.unlockdown) {
                  unlocked = Sentinel.unlockdown(pin);
                } else {
                  var validPins = ['SENTINEL', '1234', 'sentinel'];
                  if (validPins.indexOf(pin) !== -1) {
                    Sentinel.lockdownActive = false;
                    Sentinel.lockdownReason = null;
                    Sentinel.posture = 'GREEN';
                    Sentinel.currentPosture = 'GREEN';
                    unlocked = true;
                  }
                }
                if (unlocked && lockdownReason) {
                  lockdownReason.style.display = 'none';
                } else {
                  this.checked = true;
                }
              } else {
                this.checked = true;
              }
            }
            self.updateUI();
          }
        });
      }

      // Policy selection
      var policySelect = document.getElementById('sentinel-policy-select');
      if (policySelect) {
        policySelect.addEventListener('change', function() {
          if (typeof Sentinel !== 'undefined' && Sentinel.loadPolicyPack) {
            Sentinel.loadPolicyPack(this.value);
          } else if (typeof PolicyManager !== 'undefined' && PolicyManager.activatePack) {
            PolicyManager.activatePack(this.value);
          }
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
      if (healthBtn) {
        healthBtn.addEventListener('click', function() {
          if (typeof Sentinel !== 'undefined') {
            var health = Sentinel.healthCheck ? Sentinel.healthCheck() : {
              initialized: Sentinel.initialized,
              authenticated: Sentinel.authenticated,
              posture: Sentinel.posture || Sentinel.currentPosture
            };
            alert('Health Check:\n' + JSON.stringify(health, null, 2));
            self.updateUI();
          }
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
      if (exportLogsBtn) {
        exportLogsBtn.setAttribute('data-grx26-demo-disabled', 'export');
        exportLogsBtn.disabled = !!window.GRX26_DEMO_MODE;
        window.addEventListener('grx26-demo-mode-changed', function() {
          if (exportLogsBtn) exportLogsBtn.disabled = !!window.GRX26_DEMO_MODE;
        });
        exportLogsBtn.addEventListener('click', function() {
          if (window.GRX26_DEMO_MODE) return;
          if (typeof Sentinel !== 'undefined' && Sentinel.auditExport) {
            Sentinel.auditExport();
          } else if (typeof LogManager !== 'undefined' && LogManager.export) {
            var exportData = LogManager.export('json');
            var blob = new Blob([exportData], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'sentinel_audit_' + Date.now() + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        });
      }

      var verifyLogsBtn = document.getElementById('sentinel-verify-logs-btn');
      if (verifyLogsBtn) {
        verifyLogsBtn.addEventListener('click', function() {
          self.verifyLogs();
        });
      }

      // TITAN controls
      var forceTitanBtn = document.getElementById('sentinel-force-titan');
      var titanStatusBtn = document.getElementById('sentinel-titan-status');
      if (forceTitanBtn && typeof Sentinel !== 'undefined') {
        forceTitanBtn.addEventListener('click', function() {
          var command = prompt('Enter command to force TITAN analysis:');
          if (command) {
            var taskPacket = {
              command: command,
              context: {},
              intent: { type: 'security', category: 'general' },
              riskScore: 1.0,
              traceId: Utils ? Utils.traceId() : 'tr-' + Date.now()
            };
            if (typeof Titan !== 'undefined' && Titan.analyze) {
              var result = Titan.analyze(taskPacket);
              alert('TITAN Analysis:\n' + JSON.stringify(result, null, 2));
            } else {
              alert('TITAN core not available');
            }
          }
        });
      }
      if (titanStatusBtn) {
        titanStatusBtn.addEventListener('click', function() {
          if (typeof Titan !== 'undefined') {
            var status = Titan.initialized ? 'Ready' : 'Not Initialized';
            alert('TITAN Status: ' + status);
          } else {
            alert('TITAN core not loaded');
          }
        });
      }

      // Two-person rule creation
      var twopersonCreateBtn = document.getElementById('sentinel-twoperson-create-btn');
      if (twopersonCreateBtn) {
        twopersonCreateBtn.addEventListener('click', function() {
          var actionInput = document.getElementById('sentinel-twoperson-action');
          if (actionInput && actionInput.value.trim()) {
            var action = actionInput.value.trim();
            if (typeof Sentinel !== 'undefined') {
              if (Sentinel.requireTwoPersonRule) {
                Sentinel.requireTwoPersonRule(action);
              } else {
                if (!Sentinel.twoPersonRules) Sentinel.twoPersonRules = [];
                if (Sentinel.twoPersonRules.indexOf(action) === -1) {
                  Sentinel.twoPersonRules.push(action);
                }
              }
            }
            alert('Two-person rule created for: ' + action);
            actionInput.value = '';
            self.updateUI();
          } else {
            alert('Please enter an action');
          }
        });
      }
    },

    loadPolicyPacks: function() {
      if (typeof PolicyManager === 'undefined' || typeof fetch === 'undefined') return;

      fetch('assets/data/policy_packs.json')
        .then(function(response) { return response.json(); })
        .then(function(data) {
          if (PolicyManager.policyPacks) {
            PolicyManager.policyPacks = data.packs || data || {};
            if (PolicyManager.activatePack) {
              PolicyManager.activatePack('baseline_internal');
            }
          }
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
      if (typeof PolicyManager === 'undefined') return;

      var activePacks = PolicyManager.getActivePacks ? PolicyManager.getActivePacks() : [];
      var policyName = document.getElementById('policy-name');
      var policyDesc = document.getElementById('policy-desc');
      var policyRules = document.getElementById('sentinel-policy-rules');

      if (activePacks.length > 0 && PolicyManager.policyPacks) {
        var packId = activePacks[0];
        var pack = PolicyManager.policyPacks[packId];
        if (pack) {
          if (policyName) policyName.textContent = pack.name || packId || 'Unknown';
          if (policyDesc) policyDesc.textContent = pack.description || 'No description';

          if (policyRules) {
            var html = '';
            if (pack.allowed_actions && pack.allowed_actions.length > 0) {
              html += '<div style="margin-bottom: 10px;"><strong>Allowed:</strong> ' + pack.allowed_actions.join(', ') + '</div>';
            }
            if (pack.restricted_actions && pack.restricted_actions.length > 0) {
              html += '<div style="margin-bottom: 10px;"><strong>Restricted:</strong> ' + pack.restricted_actions.join(', ') + '</div>';
            }
            if (pack.two_person_rule && pack.two_person_rule.length > 0) {
              html += '<div style="margin-bottom: 10px;"><strong>Two-Person:</strong> ' + pack.two_person_rule.length + ' rules</div>';
            }
            policyRules.innerHTML = html || '<div>No rules defined</div>';
          }
        }
      } else {
        if (policyName) policyName.textContent = '-';
        if (policyDesc) policyDesc.textContent = 'No active policy pack';
        if (policyRules) policyRules.innerHTML = '<div>No policy pack loaded</div>';
      }
    },

    updateLogs: function() {
      if (typeof LogManager === 'undefined') return;

      var limit = parseInt(document.getElementById('sentinel-logs-limit')?.value || 50);
      var logs = LogManager.getRecent ? LogManager.getRecent(limit) : [];
      var tbody = document.getElementById('sentinel-audit-logs');

      if (!tbody) return;

      if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; opacity: 0.5;">No log entries</td></tr>';
        return;
      }

      tbody.innerHTML = logs.map(function(entry) {
        var time = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '-';
        var role = entry.data && entry.data.role ? entry.data.role : '-';
        var action = entry.action || '-';
        var posture = entry.data && entry.data.posture ? entry.data.posture : 'GREEN';
        return '<tr>' +
          '<td>' + time + '</td>' +
          '<td>' + role + '</td>' +
          '<td>' + action + '</td>' +
          '<td>' + posture + '</td>' +
          '<td style="font-family: monospace; font-size: 11px;">' + (entry.traceId || '-') + '</td>' +
          '<td style="font-size: 11px; opacity: 0.8;">' + (entry.data ? JSON.stringify(entry.data).substring(0, 50) : '-') + '</td>' +
          '</tr>';
      }).join('');
    },

    verifyLogs: function() {
      if (typeof LogManager === 'undefined') return;

      var verify = LogManager.verifyChain ? LogManager.verifyChain() : { valid: false, issues: ['LogManager not available'] };
      var verifyDiv = document.getElementById('sentinel-log-verification');
      var verifyStatus = document.getElementById('log-verify-status');

      if (verifyDiv) {
        verifyDiv.style.display = 'block';
        verifyDiv.style.background = verify.valid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        verifyDiv.style.borderLeftColor = verify.valid ? '#22c55e' : '#ef4444';
      }
      if (verifyStatus) {
        var message = verify.valid ? 'Chain verified' : (verify.issues && verify.issues.length > 0 ? verify.issues.join(', ') : 'Verification failed');
        verifyStatus.textContent = verify.valid ? '✓ Verified: ' + message : '✗ Invalid: ' + message;
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
