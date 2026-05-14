/**
 * TITAN UI Controller - Complete Analysis Interface
 * Full control interface for TITAN analysis nucleus
 */
(function() {
  'use strict';

  // Ensure Utils is available
  if (!window.Utils && window.TitanSentinelUtils) {
    window.Utils = window.TitanSentinelUtils;
  }

  var TitanUI = {
    initialized: false,
    analysisHistory: [],
    threatTaxonomy: null,
    redTeamScenarios: null,
    currentAnalysis: null,

    init: function() {
      if (this.initialized) return;
      this.initialized = true;

      // Load TITAN core if available
      if (typeof Titan === 'undefined') {
        console.warn('TitanUI: Titan core not loaded. Loading scripts...');
        this.loadTitanCore();
        return;
      }

      this.setupEventListeners();
      this.loadDataFiles();
      this.updateStatus();
      this.loadThreatTaxonomy();
      this.loadRedTeamScenarios();
      this.loadAnalysisHistory();
    },

    loadTitanCore: function() {
      var scripts = [
        'assets/js/governance/titan-sentinel-utils.js',
        'assets/js/governance/titan-sentinel-logs.js',
        'assets/js/governance/titan-sentinel-policy.js',
        'assets/js/governance/titan-sentinel-core.js',
        'assets/js/governance/titan-core.js'
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
              self.loadDataFiles();
              self.updateStatus();
              self.loadThreatTaxonomy();
              self.loadRedTeamScenarios();
              self.loadAnalysisHistory();
            }, 100);
          }
        };
        script.onerror = function() {
          console.warn('TitanUI: Failed to load', src);
          loaded++;
        };
        document.head.appendChild(script);
      });
    },

    setupEventListeners: function() {
      var self = this;

      // Analysis button
      var analyzeBtn = document.getElementById('titan-analyze-btn');
      if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
          self.runAnalysis();
        });
      }

      // Clear button
      var clearBtn = document.getElementById('titan-clear-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', function() {
          document.getElementById('titan-analysis-input').value = '';
          self.clearResults();
        });
      }

      // Quick actions
      document.querySelectorAll('.titan-quick-action').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var input = document.getElementById('titan-analysis-input');
          var analysisType = document.getElementById('titan-analysis-type');
          if (input) input.value = this.dataset.cmd;
          if (analysisType) analysisType.value = this.dataset.action;
          self.runAnalysis();
        });
      });

      // Scenario selector
      var scenarioSelect = document.getElementById('titan-scenario-select');
      var runScenarioBtn = document.getElementById('titan-run-scenario-btn');
      if (runScenarioBtn) {
        runScenarioBtn.addEventListener('click', function() {
          var scenarioId = scenarioSelect ? scenarioSelect.value : null;
          if (scenarioId) {
            self.runRedTeamScenario(scenarioId);
          }
        });
      }

      // Integrity check
      var integrityBtn = document.getElementById('titan-integrity-check-btn');
      if (integrityBtn && typeof Titan !== 'undefined') {
        integrityBtn.addEventListener('click', function() {
          self.runIntegrityCheck();
        });
      }

      // Attack surface mapping
      var mapBtn = document.getElementById('titan-map-attack-surface-btn');
      if (mapBtn && typeof Titan !== 'undefined') {
        mapBtn.addEventListener('click', function() {
          self.mapAttackSurface();
        });
      }

      // Countermeasure search
      var searchInput = document.getElementById('titan-countermeasure-search');
      if (searchInput && typeof Titan !== 'undefined') {
        searchInput.addEventListener('input', function() {
          self.searchCountermeasures(this.value);
        });
      }

      // Threat category selector
      var threatCategory = document.getElementById('titan-threat-category');
      if (threatCategory) {
        threatCategory.addEventListener('change', function() {
          self.displayThreatCategory(this.value);
        });
      }

      // History refresh
      var refreshHistoryBtn = document.getElementById('titan-refresh-history-btn');
      if (refreshHistoryBtn) {
        refreshHistoryBtn.addEventListener('click', function() {
          self.loadAnalysisHistory();
        });
      }

      // Export analysis
      var exportBtn = document.getElementById('titan-export-analysis-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', function() {
          self.exportAnalysis();
        });
      }
    },

    loadDataFiles: function() {
      var self = this;

      // Load threat taxonomy
      if (typeof fetch !== 'undefined') {
        fetch('assets/data/threat_taxonomy.json')
          .then(function(response) { return response.json(); })
          .then(function(data) {
            self.threatTaxonomy = data;
            if (typeof Titan !== 'undefined') {
              Titan.threatTaxonomy = data;
            }
            self.populateThreatCategories();
          })
          .catch(function(err) {
            console.error('TitanUI: Failed to load threat taxonomy', err);
          });

        // Load red team scenarios
        fetch('assets/data/redteam_scenarios.json')
          .then(function(response) { return response.json(); })
          .then(function(data) {
            self.redTeamScenarios = data.scenarios || [];
            if (typeof Titan !== 'undefined') {
              Titan.redTeamScenarios = {};
              self.redTeamScenarios.forEach(function(scenario) {
                Titan.redTeamScenarios[scenario.id] = scenario;
              });
            }
            self.populateScenarios();
          })
          .catch(function(err) {
            console.error('TitanUI: Failed to load red team scenarios', err);
          });
      }
    },

    loadThreatTaxonomy: function() {
      // Already handled in loadDataFiles
    },

    loadRedTeamScenarios: function() {
      // Already handled in loadDataFiles
    },

    populateThreatCategories: function() {
      var select = document.getElementById('titan-threat-category');
      if (!select || !this.threatTaxonomy) return;

      select.innerHTML = '<option value="">Select category...</option>';
      for (var category in this.threatTaxonomy) {
        var option = document.createElement('option');
        option.value = category;
        option.textContent = this.threatTaxonomy[category].category || category;
        select.appendChild(option);
      }
    },

    populateScenarios: function() {
      var select = document.getElementById('titan-scenario-select');
      if (!select || !this.redTeamScenarios) return;

      select.innerHTML = '<option value="">Select scenario...</option>';
      this.redTeamScenarios.forEach(function(scenario) {
        var option = document.createElement('option');
        option.value = scenario.id;
        option.textContent = 'Scenario #' + scenario.id + ': ' + scenario.name;
        select.appendChild(option);
      });
    },

    displayThreatCategory: function(category) {
      if (!category || !this.threatTaxonomy || !this.threatTaxonomy[category]) {
        document.getElementById('titan-threat-list').innerHTML = '<div style="padding: 15px; text-align: center; opacity: 0.5;">Select a category</div>';
        document.getElementById('titan-threat-details').innerHTML = '<div style="text-align: center; opacity: 0.5;">Select a threat to view details</div>';
        return;
      }

      var catData = this.threatTaxonomy[category];
      var threatList = document.getElementById('titan-threat-list');
      var threatDetails = document.getElementById('titan-threat-details');

      // Build threat list
      var html = '';
      if (catData.threats && catData.threats.length > 0) {
        catData.threats.forEach(function(threat, index) {
          html += '<div class="titan-threat-item" data-index="' + index + '" style="padding: 10px; margin-bottom: 8px; background: rgba(0, 212, 255, 0.1); border-left: 3px solid #00d4ff; border-radius: 4px; cursor: pointer; transition: all 0.2s;">';
          html += '<div style="font-weight: 600; margin-bottom: 4px;">' + threat.name + '</div>';
          html += '<div style="font-size: 11px; opacity: 0.8;">Severity: ' + (threat.severity || 'medium') + '</div>';
          html += '</div>';
        });
      }
      threatList.innerHTML = html || '<div style="padding: 15px; text-align: center; opacity: 0.5;">No threats in this category</div>';

      // Add click handlers
      document.querySelectorAll('.titan-threat-item').forEach(function(item) {
        item.addEventListener('click', function() {
          var index = parseInt(this.dataset.index);
          TitanUI.displayThreatDetails(category, index);
          document.querySelectorAll('.titan-threat-item').forEach(i => i.style.background = 'rgba(0, 212, 255, 0.1)');
          this.style.background = 'rgba(0, 212, 255, 0.3)';
        });
      });
    },

    displayThreatDetails: function(category, index) {
      if (!this.threatTaxonomy || !this.threatTaxonomy[category]) return;
      var threat = this.threatTaxonomy[category].threats[index];
      if (!threat) return;

      var detailsDiv = document.getElementById('titan-threat-details');
      var html = '<div style="margin-bottom: 15px;">';
      html += '<h3 style="margin: 0 0 10px 0; color: #00d4ff;">' + threat.name + '</h3>';
      html += '<div style="margin-bottom: 10px;"><strong>Severity:</strong> <span style="color: ' + (threat.severity === 'critical' ? '#ef4444' : threat.severity === 'high' ? '#fbbf24' : '#22c55e') + ';">' + (threat.severity || 'medium') + '</span></div>';
      html += '<div style="margin-bottom: 10px;"><strong>Description:</strong> ' + (threat.description || 'No description') + '</div>';
      
      if (threat.indicators && threat.indicators.length > 0) {
        html += '<div style="margin-bottom: 10px;"><strong>Indicators:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
        threat.indicators.forEach(function(ind) {
          html += '<li style="font-family: monospace; font-size: 11px;">' + ind + '</li>';
        });
        html += '</ul></div>';
      }

      if (threat.controls && threat.controls.length > 0) {
        html += '<div style="margin-bottom: 10px;"><strong>Controls:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
        threat.controls.forEach(function(control) {
          html += '<li>' + (control.control || control) + '</li>';
        });
        html += '</ul></div>';
      }

      html += '</div>';
      detailsDiv.innerHTML = html;
    },

    runAnalysis: function() {
      if (typeof Titan === 'undefined' || typeof Sentinel === 'undefined') {
        alert('TITAN core not loaded. Please wait for initialization.');
        return;
      }

      var input = document.getElementById('titan-analysis-input');
      var analysisType = document.getElementById('titan-analysis-type');
      if (!input || !input.value.trim()) {
        alert('Please enter a command or scenario for analysis');
        return;
      }

      var command = input.value.trim();
      var type = analysisType ? analysisType.value : 'full';

      // Create task packet (simulating Sentinel invocation)
      var taskPacket = {
        command: command,
        context: { analysisType: type },
        intent: { type: type, category: 'security' },
        riskScore: 0.7, // Default high risk to trigger TITAN
        traceId: Utils ? Utils.traceId() : 'tr-' + Date.now()
      };

      // Run TITAN analysis
      var result = Titan.analyze(taskPacket);
      this.displayAnalysisResult(result, type);
      this.addToHistory(result, type, command);
      this.updateStatus();
    },

    displayAnalysisResult: function(result, type) {
      this.currentAnalysis = result;

      // Update main results container
      var container = document.getElementById('titan-results-container');
      if (!container) return;

      var html = '<div style="padding: 20px;">';
      html += '<div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--grx26-border, #374151);">';
      html += '<div><strong>Analysis Type:</strong> ' + (type || 'Full Analysis') + '</div>';
      html += '<div><strong>Timestamp:</strong> ' + (result.timestamp || new Date().toISOString()) + '</div>';
      html += '</div>';

      if (result.summary) {
        html += '<div style="padding: 15px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; border-radius: 4px; margin-bottom: 15px;">';
        html += '<strong>Summary:</strong> ' + (Utils ? Utils.sanitize(result.summary) : result.summary);
        html += '</div>';
      }

      html += '</div>';
      container.innerHTML = html;

      // Update findings
      this.displayFindings(result.findings || []);

      // Update risk and controls
      this.updateRiskDisplay(result.risk_score || 0);
      this.updateConfidence(result.confidenceScore || 0);
      this.displayRecommendedControls(result.recommended_controls || []);

      // Update mitigation plan
      this.displayMitigationPlan(result.mitigation_plan || []);

      // Update escalation matrix
      this.displayEscalationMatrix(result.escalation || []);
    },

    displayFindings: function(findings) {
      var listDiv = document.getElementById('titan-findings-list');
      if (!listDiv) return;

      if (findings.length === 0) {
        listDiv.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.5;">No findings</div>';
        return;
      }

      var html = '';
      findings.forEach(function(finding, index) {
        var severityColor = finding.severity === 'critical' ? '#ef4444' : 
                           finding.severity === 'high' ? '#fbbf24' : 
                           finding.severity === 'medium' ? '#3b82f6' : '#22c55e';
        html += '<div style="padding: 12px; margin-bottom: 10px; background: var(--grx26-bg-secondary, #1f2937); border-left: 4px solid ' + severityColor + '; border-radius: 4px;">';
        html += '<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">';
        html += '<strong style="color: ' + severityColor + ';">' + (finding.type || 'Finding') + '</strong>';
        html += '<span style="font-size: 11px; opacity: 0.8;">' + (finding.severity || 'medium') + '</span>';
        html += '</div>';
        html += '<div style="font-size: 13px; margin-bottom: 5px;">' + (finding.description || 'No description') + '</div>';
        if (finding.category) {
          html += '<div style="font-size: 11px; opacity: 0.7;">Category: ' + finding.category + '</div>';
        }
        html += '</div>';
      });
      listDiv.innerHTML = html;
    },

    updateRiskDisplay: function(riskScore) {
      var riskValue = document.getElementById('titan-risk-score');
      var riskBar = document.getElementById('titan-risk-bar');
      
      if (riskValue) {
        riskValue.textContent = riskScore.toFixed(2);
        var color = riskScore < 0.3 ? '#22c55e' : riskScore < 0.7 ? '#fbbf24' : '#ef4444';
        riskValue.style.color = color;
      }
      if (riskBar) {
        riskBar.style.width = (riskScore * 100) + '%';
      }
    },

    updateConfidence: function(confidence) {
      var confEl = document.getElementById('titan-confidence');
      var confBar = document.getElementById('titan-confidence-bar');
      
      if (confEl) {
        confEl.textContent = (confidence * 100).toFixed(0) + '%';
      }
      if (confBar) {
        confBar.style.width = (confidence * 100) + '%';
      }
    },

    displayRecommendedControls: function(controls) {
      var div = document.getElementById('titan-recommended-controls');
      if (!div) return;

      if (controls.length === 0) {
        div.innerHTML = '<div style="padding: 15px; opacity: 0.5; text-align: center;">No controls recommended</div>';
        return;
      }

      var html = '<ul style="list-style: none; padding: 0; margin: 0;">';
      controls.forEach(function(control) {
        html += '<li style="padding: 10px; margin-bottom: 8px; background: rgba(0, 212, 255, 0.1); border-left: 3px solid #00d4ff; border-radius: 4px;">';
        html += '<div style="font-weight: 600; margin-bottom: 4px;">' + (control.type || 'Control') + '</div>';
        html += '<div style="font-size: 12px;">' + (control.control || control) + '</div>';
        if (control.category) {
          html += '<div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">Category: ' + control.category + '</div>';
        }
        html += '</li>';
      });
      html += '</ul>';
      div.innerHTML = html;
    },

    displayMitigationPlan: function(plan) {
      var div = document.getElementById('titan-mitigation-plan');
      if (!div) return;

      if (plan.length === 0) {
        div.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.5;">No mitigation plan</div>';
        return;
      }

      var html = '<ul style="list-style: none; padding: 0; margin: 0;">';
      plan.forEach(function(item, index) {
        html += '<li style="padding: 12px; margin-bottom: 10px; background: var(--grx26-bg-secondary, #1f2937); border-left: 3px solid #3b82f6; border-radius: 4px;">';
        html += '<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">';
        html += '<strong>Priority ' + (index + 1) + ':</strong>';
        html += '<span style="font-size: 11px; opacity: 0.8;">' + (item.priority || 'high') + '</span>';
        html += '</div>';
        html += '<div style="margin-bottom: 5px;"><strong>Action:</strong> ' + (item.action || 'N/A') + '</div>';
        if (item.reason) {
          html += '<div style="font-size: 12px; opacity: 0.8;"><strong>Reason:</strong> ' + item.reason + '</div>';
        }
        html += '</li>';
      });
      html += '</ul>';
      div.innerHTML = html;
    },

    displayEscalationMatrix: function(escalation) {
      var div = document.getElementById('titan-escalation-matrix');
      if (!div) return;

      if (escalation.length === 0) {
        div.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.5;">No escalation required</div>';
        return;
      }

      var html = '<ul style="list-style: none; padding: 0; margin: 0;">';
      escalation.forEach(function(item) {
        html += '<li style="padding: 12px; margin-bottom: 10px; background: var(--grx26-bg-secondary, #1f2937); border-left: 3px solid #ef4444; border-radius: 4px;">';
        html += '<div style="font-weight: 600; margin-bottom: 8px; color: #ef4444;">' + (item.trigger || 'Escalation') + '</div>';
        html += '<div style="margin-bottom: 5px;"><strong>Escalate To:</strong> ' + (item.escalate_to || 'N/A') + '</div>';
        html += '<div style="margin-bottom: 5px;"><strong>Timeframe:</strong> ' + (item.timeframe || 'N/A') + '</div>';
        if (item.criteria) {
          html += '<div style="font-size: 12px; opacity: 0.8;"><strong>Criteria:</strong> ' + item.criteria + '</div>';
        }
        html += '</li>';
      });
      html += '</ul>';
      div.innerHTML = html;
    },

    runIntegrityCheck: function() {
      if (typeof Titan === 'undefined') {
        alert('TITAN core not loaded');
        return;
      }

      var results = Titan.systemIntegrityCheck();
      
      // Update status indicators
      var logIntegrity = document.getElementById('titan-log-integrity');
      var permissionStatus = document.getElementById('titan-permission-status');
      var policyStatus = document.getElementById('titan-policy-status');
      var supplyChainStatus = document.getElementById('titan-supply-chain-status');

      if (logIntegrity) {
        var logCheck = Titan.logIntegrityCheck();
        logIntegrity.textContent = logCheck.valid ? '✓ Valid' : '✗ Invalid';
        logIntegrity.style.color = logCheck.valid ? '#22c55e' : '#ef4444';
      }

      if (permissionStatus) {
        var permCheck = Titan.permissionDriftCheck();
        permissionStatus.textContent = permCheck.drift ? '✗ Drift' : '✓ Normal';
        permissionStatus.style.color = permCheck.drift ? '#ef4444' : '#22c55e';
      }

      if (policyStatus) {
        var policyCheck = Titan.policyDriftCheck();
        policyStatus.textContent = policyCheck.drift ? '✗ Drift' : '✓ Compliant';
        policyStatus.style.color = policyCheck.drift ? '#ef4444' : '#22c55e';
      }

      if (supplyChainStatus) {
        var supplyCheck = Titan.supplyChainCheck();
        supplyChainStatus.textContent = (supplyCheck.warnings && supplyCheck.warnings.length > 0) ? '⚠ Warnings' : '✓ Clean';
        supplyChainStatus.style.color = (supplyCheck.warnings && supplyCheck.warnings.length > 0) ? '#fbbf24' : '#22c55e';
      }

      // Display findings
      if (results.findings && results.findings.length > 0) {
        this.displayFindings(results.findings);
      }
    },

    runRedTeamScenario: function(scenarioId) {
      if (typeof Titan === 'undefined') {
        alert('TITAN core not loaded');
        return;
      }

      var result = Titan.runRedTeamScenario(scenarioId);
      if (result.error) {
        alert('Error: ' + result.error);
        return;
      }

      this.displayAnalysisResult(result, 'redteam');
      this.addToHistory(result, 'redteam', 'Scenario #' + scenarioId);
      this.updateStatus();
    },

    mapAttackSurface: function() {
      if (typeof Titan === 'undefined') {
        alert('TITAN core not loaded');
        return;
      }

      var input = document.getElementById('titan-attack-surface-input');
      if (!input || !input.value.trim()) {
        alert('Please describe the system context');
        return;
      }

      var context = {
        exposed: input.value.toLowerCase().indexOf('exposed') !== -1,
        permissions: input.value.toLowerCase().indexOf('permission') !== -1
      };

      var result = Titan.attackSurfaceMap(context);
      var resultsDiv = document.getElementById('titan-attack-surface-results');
      
      if (resultsDiv) {
        var html = '<div style="margin-bottom: 10px;"><strong>Attack Surfaces Identified:</strong></div>';
        if (result.surfaces && result.surfaces.length > 0) {
          result.surfaces.forEach(function(surface) {
            html += '<div style="padding: 10px; margin-bottom: 8px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; border-radius: 4px;">';
            html += '<strong>' + surface.area + '</strong> — Risk: ' + surface.risk;
            html += '</div>';
          });
        } else {
          html += '<div style="opacity: 0.7;">No attack surfaces identified</div>';
        }
        resultsDiv.innerHTML = html;
      }
    },

    searchCountermeasures: function(searchTerm) {
      if (typeof Titan === 'undefined' || !searchTerm) {
        document.getElementById('titan-countermeasure-results').innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.5;">Enter search term to find controls</div>';
        return;
      }

      var controls = Titan.countermeasureLibrary(searchTerm);
      var resultsDiv = document.getElementById('titan-countermeasure-results');
      
      if (!resultsDiv) return;

      if (controls.length === 0) {
        resultsDiv.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.5;">No controls found for: ' + searchTerm + '</div>';
        return;
      }

      var html = '<ul style="list-style: none; padding: 0; margin: 0;">';
      controls.forEach(function(control) {
        html += '<li style="padding: 12px; margin-bottom: 10px; background: var(--grx26-bg-secondary, #1f2937); border-left: 3px solid #00d4ff; border-radius: 4px;">';
        html += '<div style="font-weight: 600; margin-bottom: 5px;">' + (control.type || 'Control') + '</div>';
        html += '<div style="font-size: 13px;">' + (control.control || control) + '</div>';
        if (control.category) {
          html += '<div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">Category: ' + control.category + '</div>';
        }
        html += '</li>';
      });
      html += '</ul>';
      resultsDiv.innerHTML = html;
    },

    addToHistory: function(result, type, command) {
      this.analysisHistory.push({
        timestamp: Date.now(),
        type: type,
        command: command,
        riskScore: result.risk_score || 0,
        findingsCount: result.findings ? result.findings.length : 0,
        confidence: result.confidenceScore || 0,
        result: result
      });

      // Keep only last 100
      if (this.analysisHistory.length > 100) {
        this.analysisHistory.shift();
      }

      // Save to localStorage
      try {
        localStorage.setItem('titan_analysis_history', JSON.stringify(this.analysisHistory));
      } catch (e) {
        console.warn('TitanUI: Failed to save history', e);
      }

      this.renderHistory();
    },

    loadAnalysisHistory: function() {
      try {
        var stored = localStorage.getItem('titan_analysis_history');
        if (stored) {
          this.analysisHistory = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('TitanUI: Failed to load history', e);
        this.analysisHistory = [];
      }
      this.renderHistory();
    },

    renderHistory: function() {
      var tbody = document.getElementById('titan-analysis-history');
      if (!tbody) return;

      var limit = parseInt(document.getElementById('titan-history-limit')?.value || 20);
      var recent = this.analysisHistory.slice(-limit).reverse();

      if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; opacity: 0.5;">No analysis history</td></tr>';
        return;
      }

      tbody.innerHTML = recent.map(function(entry) {
        var riskColor = entry.riskScore < 0.3 ? '#22c55e' : entry.riskScore < 0.7 ? '#fbbf24' : '#ef4444';
        return '<tr>' +
          '<td>' + new Date(entry.timestamp).toLocaleTimeString() + '</td>' +
          '<td>' + (entry.type || 'full') + '</td>' +
          '<td><span style="color: ' + riskColor + '; font-weight: bold;">' + (entry.riskScore * 100).toFixed(0) + '%</span></td>' +
          '<td>' + entry.findingsCount + '</td>' +
          '<td>' + (entry.confidence * 100).toFixed(0) + '%</td>' +
          '<td><button onclick="TitanUI.viewHistoryEntry(' + (TitanUI.analysisHistory.length - recent.indexOf(entry) - 1) + ')" style="padding: 4px 8px; font-size: 11px; background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; border-radius: 3px; cursor: pointer;">View</button></td>' +
          '</tr>';
      }).join('');
    },

    viewHistoryEntry: function(index) {
      if (index < 0 || index >= this.analysisHistory.length) return;
      var entry = this.analysisHistory[index];
      this.displayAnalysisResult(entry.result, entry.type);
    },

    exportAnalysis: function() {
      if (!this.currentAnalysis) {
        alert('No analysis to export');
        return;
      }

      var data = {
        exported_at: new Date().toISOString(),
        analysis: this.currentAnalysis,
        history: this.analysisHistory
      };

      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'titan_analysis_' + Date.now() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    clearResults: function() {
      document.getElementById('titan-results-container').innerHTML = '<div style="text-align: center; padding: 40px; opacity: 0.5;"><div style="font-size: 48px; margin-bottom: 10px;">🔬</div><div>No analysis results yet. Run an analysis above.</div></div>';
      document.getElementById('titan-findings-list').innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.5;">No findings</div>';
      document.getElementById('titan-recommended-controls').innerHTML = '<div style="padding: 15px; opacity: 0.5; text-align: center;">No controls recommended</div>';
      document.getElementById('titan-mitigation-plan').innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.5;">No mitigation plan</div>';
      document.getElementById('titan-escalation-matrix').innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.5;">No escalation required</div>';
      this.updateRiskDisplay(0);
      this.updateConfidence(0);
    },

    updateStatus: function() {
      if (typeof Titan === 'undefined') {
        document.getElementById('titan-status-text').textContent = 'TITAN core not loaded';
        return;
      }

      var statusText = document.getElementById('titan-status-text');
      var invocationCount = document.getElementById('titan-invocation-count');
      
      if (statusText) {
        statusText.textContent = Titan.initialized ? 'Ready' : 'Initializing...';
        statusText.style.color = Titan.initialized ? '#22c55e' : '#fbbf24';
      }

      if (invocationCount) {
        invocationCount.textContent = this.analysisHistory.length;
      }
    }
  };

  // Initialize when module loads
  document.addEventListener('gracex:module:loaded', function(ev) {
    if (ev.detail && ev.detail.module === 'titan') {
      setTimeout(function() {
        TitanUI.init();
      }, 100);
    }
  });

  // Also try immediate init
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
      TitanUI.init();
    }, 500);
  }

  window.TitanUI = TitanUI;
})();
