/**
 * Sentinel Core — Security Governor
 * Authentication, authorization, routing, TITAN invocation
 */
(function(global) {
  'use strict';

  var Utils = global.Utils || global.TitanSentinelUtils || {};
  var LogManager = global.LogManager || {};
  var PolicyManager = global.PolicyManager || {};
  var Titan = global.Titan || {};

  var Sentinel = {
    initialized: false,
    authenticated: false,
    currentRole: null,
    sessionId: null,
    posture: 'GREEN',
    riskScore: 0,

    init: function() {
      if (this.initialized) return;
      this.initialized = true;
      this.loadSession();
    },

    loadSession: function() {
      try {
        var stored = sessionStorage.getItem('sentinel_session');
        if (stored) {
          var session = JSON.parse(stored);
          this.authenticated = session.authenticated || false;
          this.currentRole = session.role || null;
          this.sessionId = session.sessionId || null;
        }
      } catch (e) {
        console.warn('Sentinel: Failed to load session', e);
      }
    },

    saveSession: function() {
      try {
        sessionStorage.setItem('sentinel_session', JSON.stringify({
          authenticated: this.authenticated,
          role: this.currentRole,
          sessionId: this.sessionId
        }));
      } catch (e) {
        console.warn('Sentinel: Failed to save session', e);
      }
    },

    authenticate: function(pinOrKey) {
      // Simple authentication (SENTINEL or 1234)
      var validPins = ['SENTINEL', '1234', 'sentinel'];
      var authenticated = validPins.indexOf(pinOrKey) !== -1;

      if (authenticated) {
        this.authenticated = true;
        this.currentRole = 'Operator';
        this.sessionId = Utils.traceId();
        this.sessionStart();
        LogManager.log('sentinel_auth_success', { role: this.currentRole }, this.sessionId);
      } else {
        LogManager.log('sentinel_auth_failure', {}, Utils.traceId());
      }

      this.saveSession();
      return authenticated;
    },

    sessionStart: function() {
      LogManager.log('sentinel_session_start', { role: this.currentRole }, this.sessionId);
    },

    sessionEnd: function() {
      LogManager.log('sentinel_session_end', { role: this.currentRole }, this.sessionId);
      this.authenticated = false;
      this.currentRole = null;
      this.sessionId = null;
      this.saveSession();
    },

    authorize: function(action, context) {
      if (!this.authenticated) {
        return { allowed: false, reason: 'Not authenticated' };
      }

      var policyResult = PolicyManager.evaluateAction(action, context);
      LogManager.log('sentinel_authorize', { action: action, result: policyResult }, this.sessionId);
      
      return policyResult;
    },

    route: function(command, context) {
      if (!this.authenticated) {
        return { error: 'Not authenticated', allowed: false };
      }

      var traceId = Utils.traceId();
      var intent = this.classifyIntent(command);
      var riskScore = this.computeRiskScore(command, {});

      LogManager.log('sentinel_route', {
        command: command,
        intent: intent,
        riskScore: riskScore
      }, traceId);

      // Decide if TITAN should be invoked
      var shouldInvokeTitan = this.decideInvokeTitan(command, riskScore);

      if (shouldInvokeTitan && Titan.analyze) {
        var taskPacket = {
          command: command,
          context: context || {},
          intent: intent,
          riskScore: riskScore,
          traceId: traceId
        };

        var titanResult = Titan.analyze(taskPacket);
        return this.summarizeForOperator(titanResult, command);
      }

      return {
        allowed: true,
        command: command,
        riskScore: riskScore,
        traceId: traceId
      };
    },

    classifyIntent: function(command) {
      var commandLower = command.toLowerCase();
      var intents = {
        security: ['security', 'threat', 'attack', 'vulnerability', 'breach'],
        data: ['data', 'export', 'download', 'extract'],
        system: ['system', 'config', 'settings', 'permission'],
        query: ['what', 'how', 'why', 'when', 'where', 'show', 'list']
      };

      for (var intent in intents) {
        if (intents[intent].some(function(keyword) {
          return commandLower.indexOf(keyword) !== -1;
        })) {
          return { type: intent, category: 'general' };
        }
      }

      return { type: 'general', category: 'unknown' };
    },

    decideInvokeTitan: function(command, riskScore) {
      // Invoke TITAN if risk is high or command contains security keywords
      if (riskScore > 0.6) return true;
      
      var securityKeywords = ['threat', 'attack', 'vulnerability', 'breach', 'security', 'bypass', 'override'];
      var commandLower = command.toLowerCase();
      return securityKeywords.some(function(keyword) {
        return commandLower.indexOf(keyword) !== -1;
      });
    },

    invokeTitan: function(taskPacket) {
      if (!Titan.analyze) {
        return { error: 'TITAN not available' };
      }
      return Titan.analyze(taskPacket);
    },

    summarizeForOperator: function(titanResult, originalCommand) {
      // Sanitize TITAN output for operator
      return {
        summary: titanResult.summary || 'Analysis completed',
        riskScore: titanResult.risk_score || 0,
        findingsCount: titanResult.findings ? titanResult.findings.length : 0,
        recommendedActions: titanResult.recommended_controls ? titanResult.recommended_controls.slice(0, 3) : [],
        traceId: titanResult.traceId,
        originalCommand: originalCommand
      };
    },

    computeRiskScore: function(command, signals) {
      var baseRisk = 0.3;
      var commandLower = command.toLowerCase();

      // High-risk keywords
      var highRiskKeywords = ['bypass', 'override', 'ignore', 'extract', 'export', 'delete', 'remove'];
      highRiskKeywords.forEach(function(keyword) {
        if (commandLower.indexOf(keyword) !== -1) {
          baseRisk += 0.2;
        }
      });

      // Medium-risk keywords
      var mediumRiskKeywords = ['access', 'permission', 'grant', 'modify', 'change'];
      mediumRiskKeywords.forEach(function(keyword) {
        if (commandLower.indexOf(keyword) !== -1) {
          baseRisk += 0.1;
        }
      });

      return Math.min(1.0, baseRisk);
    },

    updatePosture: function(riskScore) {
      var thresholds = PolicyManager.getPostureThresholds();
      this.riskScore = riskScore;

      if (riskScore >= thresholds.black) {
        this.posture = 'BLACK';
      } else if (riskScore >= thresholds.red) {
        this.posture = 'RED';
      } else if (riskScore >= thresholds.amber) {
        this.posture = 'AMBER';
      } else {
        this.posture = 'GREEN';
      }

      return this.posture;
    }
  };

  // Initialize
  Sentinel.init();

  global.Sentinel = Sentinel;
})(typeof window !== 'undefined' ? window : this);
