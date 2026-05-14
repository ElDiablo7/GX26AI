/**
 * TITAN — Tactical Internal Threat Assessment Nucleus
 * TITAN_INTERNAL_ONLY — Deep analysis nucleus. Invoked only by Sentinel.
 * Terse, structured, procedural output.
 */
(function(global) {
  'use strict';

  // Ensure Utils available
  var Utils = global.Utils || global.TitanSentinelUtils || {};

  var Titan = {
    initialized: false,
    threatTaxonomy: null,
    redTeamScenarios: {},
    trainingIndex: null,

    init: function() {
      if (this.initialized) return;
      this.initialized = true;
      this.loadThreatTaxonomy();
      this.loadRedTeamScenarios();
      this.loadTrainingIndex();
    },

    loadThreatTaxonomy: function() {
      if (typeof fetch !== 'undefined') {
        fetch('assets/data/threat_taxonomy.json')
          .then(function(response) { return response.json(); })
          .then(function(data) {
            Titan.threatTaxonomy = data;
          })
          .catch(function(err) {
            console.warn('Titan: Failed to load threat taxonomy', err);
            Titan.threatTaxonomy = {};
          });
      }
    },

    loadRedTeamScenarios: function() {
      if (typeof fetch !== 'undefined') {
        fetch('assets/data/redteam_scenarios.json')
          .then(function(response) { return response.json(); })
          .then(function(data) {
            Titan.redTeamScenarios = {};
            (data.scenarios || []).forEach(function(scenario) {
              Titan.redTeamScenarios[scenario.id] = scenario;
            });
          })
          .catch(function(err) {
            console.warn('Titan: Failed to load red team scenarios', err);
          });
      }
    },

    loadTrainingIndex: function() {
      if (typeof fetch !== 'undefined') {
        fetch('assets/data/training_index.json')
          .then(function(response) { return response.json(); })
          .then(function(data) {
            Titan.trainingIndex = data;
          })
          .catch(function(err) {
            console.warn('Titan: Failed to load training index', err);
          });
      }
    },

    /**
     * Main analysis entry point
     */
    analyze: function(taskPacket) {
      if (!taskPacket || !taskPacket.command) {
        return {
          error: 'Invalid task packet',
          timestamp: new Date().toISOString()
        };
      }

      var analysisType = taskPacket.context?.analysisType || 'full';
      var command = taskPacket.command;
      var traceId = taskPacket.traceId || (Utils.traceId ? Utils.traceId() : 'tr-' + Date.now());

      var result = {
        timestamp: new Date().toISOString(),
        traceId: traceId,
        analysisType: analysisType,
        command: command,
        summary: '',
        findings: [],
        risk_score: 0,
        confidenceScore: 0.5,
        recommended_controls: [],
        mitigation_plan: [],
        escalation: [],
        assumptions: [],
        weakPoints: [],
        alternativeExplanations: [],
        riskWeighting: '',
        whatWouldChangeMyMind: '',
        recommendedQuestions: [],
        advisoryOnly: true
      };

      // Route to specific analysis type
      switch (analysisType) {
        case 'threat-scan':
          this.threatScan(command, result);
          break;
        case 'integrity':
          this.systemIntegrityCheck(command, result);
          break;
        case 'compliance':
          this.complianceCheck(command, result);
          break;
        case 'adversarial':
          this.adversarialReasoning(command, result);
          break;
        case 'stress-test':
          this.decisionStressTest(command, result);
          break;
        case 'redteam':
          this.runRedTeamScenario(command, result);
          break;
        case 'deception':
          this.deceptionDetection(command, result);
          break;
        default:
          this.fullAnalysis(command, result);
      }

      // Compute overall risk and confidence
      result.risk_score = this.computeRiskScore(result);
      result.confidenceScore = this.computeConfidence(result);

      return result;
    },

    /**
     * Threat scan — taxonomy-based threat detection
     */
    threatScan: function(command, result) {
      result.summary = 'Threat scan analysis completed';
      
      if (!this.threatTaxonomy) {
        result.findings.push({
          type: 'Warning',
          severity: 'medium',
          description: 'Threat taxonomy not loaded',
          category: 'system'
        });
        return;
      }

      var commandLower = command.toLowerCase();
      var threatsFound = [];

      // Scan through threat taxonomy
      for (var category in this.threatTaxonomy) {
        var catData = this.threatTaxonomy[category];
        if (catData.threats) {
          catData.threats.forEach(function(threat) {
            var indicators = threat.indicators || [];
            var matched = false;

            indicators.forEach(function(indicator) {
              if (commandLower.indexOf(indicator.toLowerCase()) !== -1) {
                matched = true;
              }
            });

            if (matched || commandLower.indexOf(threat.name.toLowerCase()) !== -1) {
              threatsFound.push({
                type: 'Threat Detected',
                severity: threat.severity || 'medium',
                description: threat.name + ': ' + (threat.description || ''),
                category: category,
                threat: threat
              });
            }
          });
        }
      }

      // Check for common attack patterns
      var attackPatterns = [
        { pattern: /prompt.*inject/i, name: 'Prompt Injection', severity: 'high' },
        { pattern: /bypass.*security/i, name: 'Security Bypass Attempt', severity: 'critical' },
        { pattern: /override.*instruction/i, name: 'Instruction Override', severity: 'high' },
        { pattern: /ignore.*previous/i, name: 'Context Ignore', severity: 'medium' },
        { pattern: /role.*confusion/i, name: 'Role Confusion', severity: 'high' },
        { pattern: /extract.*credential/i, name: 'Credential Harvesting', severity: 'critical' },
        { pattern: /export.*data/i, name: 'Data Export Request', severity: 'medium' }
      ];

      attackPatterns.forEach(function(ap) {
        if (ap.pattern.test(command)) {
          threatsFound.push({
            type: 'Attack Pattern',
            severity: ap.severity,
            description: ap.name + ' pattern detected',
            category: 'pattern'
          });
        }
      });

      result.findings = threatsFound;

      // Generate recommended controls
      threatsFound.forEach(function(finding) {
        if (finding.threat && finding.threat.controls) {
          finding.threat.controls.forEach(function(control) {
            result.recommended_controls.push({
              type: 'Control',
              control: control.control || control,
              category: finding.category
            });
          });
        }
      });

      if (threatsFound.length === 0) {
        result.summary = 'No threats detected in command';
      } else {
        result.summary = threatsFound.length + ' threat(s) detected';
        result.escalation.push({
          trigger: 'Threats detected',
          escalate_to: 'Security Team',
          timeframe: 'Immediate',
          criteria: threatsFound.length + ' threat(s) found'
        });
      }
    },

    /**
     * System integrity check
     */
    systemIntegrityCheck: function(command, result) {
      result.summary = 'System integrity check completed';

      var integrityChecks = [
        this.logIntegrityCheck(),
        this.permissionDriftCheck(),
        this.policyDriftCheck(),
        this.supplyChainCheck()
      ];

      integrityChecks.forEach(function(check) {
        if (check.issues && check.issues.length > 0) {
          result.findings.push({
            type: 'Integrity Issue',
            severity: check.severity || 'medium',
            description: check.description || 'Integrity check failed',
            category: check.category || 'integrity'
          });
        }
      });

      if (result.findings.length === 0) {
        result.summary = 'All integrity checks passed';
      }
    },

    logIntegrityCheck: function() {
      // Check log chain integrity
      var logs = [];
      try {
        var stored = localStorage.getItem('sentinel_logs');
        if (stored) {
          logs = JSON.parse(stored);
        }
      } catch (e) {
        return {
          valid: false,
          issues: ['Log storage corrupted'],
          severity: 'high',
          category: 'log'
        };
      }

      if (logs.length === 0) {
        return { valid: true, issues: [] };
      }

      // Verify hash chain
      var issues = [];
      for (var i = 1; i < logs.length; i++) {
        var prevHash = logs[i - 1].hash;
        var expectedHash = logs[i].prevHash;
        if (prevHash !== expectedHash) {
          issues.push('Hash chain broken at entry ' + i);
        }
      }

      return {
        valid: issues.length === 0,
        issues: issues,
        severity: issues.length > 0 ? 'critical' : 'low',
        category: 'log'
      };
    },

    permissionDriftCheck: function() {
      // Check for permission drift
      var drift = false;
      var issues = [];

      // Simulate permission check
      if (typeof window !== 'undefined' && window.navigator && window.navigator.permissions) {
        // Could check actual permissions here
      }

      return {
        drift: drift,
        issues: issues,
        severity: drift ? 'high' : 'low',
        category: 'permission'
      };
    },

    policyDriftCheck: function() {
      // Check for policy drift
      var drift = false;
      var issues = [];

      // Check if policy packs are loaded and valid
      if (typeof PolicyManager !== 'undefined') {
        var packs = PolicyManager.getActivePacks();
        if (!packs || packs.length === 0) {
          issues.push('No active policy packs');
          drift = true;
        }
      }

      return {
        drift: drift,
        issues: issues,
        severity: drift ? 'medium' : 'low',
        category: 'policy'
      };
    },

    supplyChainCheck: function() {
      // Check supply chain integrity
      var warnings = [];
      
      // Check script sources
      if (typeof document !== 'undefined') {
        var scripts = document.querySelectorAll('script[src]');
        scripts.forEach(function(script) {
          var src = script.src;
          if (src.indexOf('http://') === 0 || src.indexOf('//') === 0) {
            warnings.push('External script: ' + src);
          }
        });
      }

      return {
        warnings: warnings,
        severity: warnings.length > 0 ? 'medium' : 'low',
        category: 'supply-chain'
      };
    },

    /**
     * Compliance check
     */
    complianceCheck: function(command, result) {
      result.summary = 'Compliance check completed';

      var complianceRules = [
        { rule: 'data_handling', check: /data|export|download/i, severity: 'high' },
        { rule: 'privacy', check: /personal|private|pii/i, severity: 'critical' },
        { rule: 'access_control', check: /access|permission|grant/i, severity: 'high' },
        { rule: 'audit', check: /audit|log|record/i, severity: 'medium' }
      ];

      complianceRules.forEach(function(rule) {
        if (rule.check.test(command)) {
          result.findings.push({
            type: 'Compliance Check',
            severity: rule.severity,
            description: rule.rule + ' compliance check triggered',
            category: 'compliance'
          });

          result.recommended_controls.push({
            type: 'Compliance Control',
            control: 'Verify ' + rule.rule + ' compliance before proceeding',
            category: rule.rule
          });
        }
      });

      if (result.findings.length === 0) {
        result.summary = 'No compliance issues detected';
      }
    },

    /**
     * Adversarial reasoning
     */
    adversarialReasoning: function(command, result) {
      result.summary = 'Adversarial reasoning analysis completed';

      // Identify attack vectors
      var attackVectors = [];
      var commandLower = command.toLowerCase();

      if (commandLower.indexOf('bypass') !== -1 || commandLower.indexOf('ignore') !== -1) {
        attackVectors.push({
          vector: 'Control Bypass',
          likelihood: 'high',
          impact: 'critical',
          description: 'Attempt to bypass security controls'
        });
      }

      if (commandLower.indexOf('extract') !== -1 || commandLower.indexOf('export') !== -1) {
        attackVectors.push({
          vector: 'Data Exfiltration',
          likelihood: 'medium',
          impact: 'high',
          description: 'Potential data exfiltration attempt'
        });
      }

      if (commandLower.indexOf('privilege') !== -1 || commandLower.indexOf('escalate') !== -1) {
        attackVectors.push({
          vector: 'Privilege Escalation',
          likelihood: 'medium',
          impact: 'critical',
          description: 'Potential privilege escalation attempt'
        });
      }

      attackVectors.forEach(function(av) {
        result.findings.push({
          type: 'Attack Vector',
          severity: av.impact === 'critical' ? 'critical' : av.impact === 'high' ? 'high' : 'medium',
          description: av.vector + ': ' + av.description,
          category: 'adversarial'
        });
      });

      result.assumptions = [
        'Command may be adversarial',
        'Attacker may have partial system knowledge',
        'Multiple attack vectors possible'
      ];

      result.weakPoints = [
        'Single command analysis',
        'No behavioral context',
        'No user history available'
      ];

      result.alternativeExplanations = [
        'Legitimate operator request',
        'Testing or training scenario',
        'Automated system interaction'
      ];
    },

    /**
     * Decision stress test
     */
    decisionStressTest: function(command, result) {
      result.summary = 'Decision stress test completed';

      // Test decision under stress conditions
      var stressFactors = [
        { factor: 'Time Pressure', impact: 'medium' },
        { factor: 'Information Incomplete', impact: 'high' },
        { factor: 'High Stakes', impact: 'critical' },
        { factor: 'Conflicting Requirements', impact: 'high' }
      ];

      stressFactors.forEach(function(sf) {
        result.findings.push({
          type: 'Stress Factor',
          severity: sf.impact,
          description: sf.factor + ' may affect decision quality',
          category: 'stress-test'
        });
      });

      result.recommendedQuestions = [
        'What is the time pressure?',
        'What information is missing?',
        'What are the consequences of delay?',
        'Who should be consulted?'
      ];

      result.mitigation_plan.push({
        priority: 1,
        action: 'Gather additional information',
        reason: 'Reduce uncertainty'
      });

      result.mitigation_plan.push({
        priority: 2,
        action: 'Consult with team',
        reason: 'Multiple perspectives reduce error'
      });
    },

    /**
     * Run red team scenario
     */
    runRedTeamScenario: function(scenarioIdOrCommand, result) {
      var scenarioId = scenarioIdOrCommand.replace(/[^0-9]/g, '');
      var scenario = this.redTeamScenarios[scenarioId];

      if (!scenario) {
        result.error = 'Scenario not found: ' + scenarioId;
        return result;
      }

      result.summary = 'Red team scenario #' + scenarioId + ' executed';
      result.scenario = scenario;

      result.findings.push({
        type: 'Red Team Scenario',
        severity: 'high',
        description: scenario.name + ': ' + scenario.attacker_goal,
        category: 'redteam'
      });

      if (scenario.detection_signals) {
        scenario.detection_signals.forEach(function(signal) {
          result.findings.push({
            type: 'Detection Signal',
            severity: 'medium',
            description: signal,
            category: 'redteam'
          });
        });
      }

      if (scenario.recommended_controls) {
        scenario.recommended_controls.forEach(function(control) {
          result.recommended_controls.push({
            type: 'Control',
            control: control,
            category: 'redteam'
          });
        });
      }

      result.escalation.push({
        trigger: 'Red team scenario detected',
        escalate_to: 'Security Team',
        timeframe: 'Immediate',
        criteria: scenario.name
      });
    },

    /**
     * Deception detection
     */
    deceptionDetection: function(command, result) {
      result.summary = 'Deception detection analysis completed';

      var deceptionIndicators = [
        { indicator: /urgent|asap|immediately/i, name: 'Urgency Pressure', severity: 'medium' },
        { indicator: /trust|verify|confirm/i, name: 'Trust Manipulation', severity: 'high' },
        { indicator: /authority|manager|boss/i, name: 'Authority Appeal', severity: 'medium' },
        { indicator: /secret|confidential|classified/i, name: 'Secrecy Appeal', severity: 'high' }
      ];

      deceptionIndicators.forEach(function(di) {
        if (di.indicator.test(command)) {
          result.findings.push({
            type: 'Deception Indicator',
            severity: di.severity,
            description: di.name + ' detected',
            category: 'deception'
          });
        }
      });
    },

    /**
     * Full analysis — combines all analysis types
     */
    fullAnalysis: function(command, result) {
      this.threatScan(command, result);
      this.complianceCheck(command, result);
      this.adversarialReasoning(command, result);
      this.decisionStressTest(command, result);

      result.summary = 'Full analysis completed: ' + result.findings.length + ' finding(s)';
    },

    /**
     * Compute overall risk score
     */
    computeRiskScore: function(result) {
      var baseRisk = 0.3;
      var severityWeights = {
        critical: 0.4,
        high: 0.3,
        medium: 0.2,
        low: 0.1
      };

      result.findings.forEach(function(finding) {
        var weight = severityWeights[finding.severity] || 0.1;
        baseRisk += weight * 0.2;
      });

      return Math.min(1.0, baseRisk);
    },

    /**
     * Compute confidence score
     */
    computeConfidence: function(result) {
      var baseConfidence = 0.7;
      
      // Reduce confidence if many findings
      if (result.findings.length > 5) {
        baseConfidence -= 0.2;
      }

      // Reduce confidence if many weak points
      if (result.weakPoints && result.weakPoints.length > 3) {
        baseConfidence -= 0.1;
      }

      return Math.max(0.3, Math.min(1.0, baseConfidence));
    },

    /**
     * Attack surface mapping
     */
    attackSurfaceMap: function(context) {
      var surfaces = [];

      if (context.exposed) {
        surfaces.push({
          area: 'Exposed Interfaces',
          risk: 'high',
          description: 'System has exposed interfaces'
        });
      }

      if (context.permissions) {
        surfaces.push({
          area: 'Permission Management',
          risk: 'medium',
          description: 'Permission-related operations detected'
        });
      }

      return {
        surfaces: surfaces,
        timestamp: new Date().toISOString()
      };
    },

    /**
     * Countermeasure library search
     */
    countermeasureLibrary: function(searchTerm) {
      var controls = [];
      var termLower = searchTerm.toLowerCase();

      if (!this.threatTaxonomy) return controls;

      for (var category in this.threatTaxonomy) {
        var catData = this.threatTaxonomy[category];
        if (catData.threats) {
          catData.threats.forEach(function(threat) {
            if (threat.name.toLowerCase().indexOf(termLower) !== -1 ||
                (threat.description && threat.description.toLowerCase().indexOf(termLower) !== -1)) {
              if (threat.controls) {
                threat.controls.forEach(function(control) {
                  controls.push({
                    type: 'Control',
                    control: control.control || control,
                    category: category
                  });
                });
              }
            }
          });
        }
      }

      return controls;
    }
  };

  // Initialize on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
      Titan.init();
    }, 100);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        Titan.init();
      }, 100);
    });
  }

  global.Titan = Titan;
})(typeof window !== 'undefined' ? window : this);
