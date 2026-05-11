/**
 * TITAN + Sentinel Policy Management
 * Policy pack loading, evaluation, and enforcement
 */
(function(global) {
  'use strict';

  var PolicyManager = {
    policyPacks: {},
    activePacks: [],
    initialized: false,

    init: function() {
      if (this.initialized) return;
      this.initialized = true;
      this.loadPolicyPacks();
    },

    loadPolicyPacks: function() {
      if (typeof fetch !== 'undefined') {
        fetch('assets/data/policy_packs.json')
          .then(function(response) { return response.json(); })
          .then(function(data) {
            PolicyManager.policyPacks = data.packs || {};
            // Activate baseline by default
            if (PolicyManager.policyPacks.baseline_internal) {
              PolicyManager.activePacks = ['baseline_internal'];
            }
          })
          .catch(function(err) {
            console.warn('PolicyManager: Failed to load policy packs', err);
            PolicyManager.policyPacks = {};
          });
      }
    },

    activatePack: function(packId) {
      if (this.policyPacks[packId]) {
        if (this.activePacks.indexOf(packId) === -1) {
          this.activePacks.push(packId);
        }
        return true;
      }
      return false;
    },

    deactivatePack: function(packId) {
      var index = this.activePacks.indexOf(packId);
      if (index !== -1) {
        this.activePacks.splice(index, 1);
        return true;
      }
      return false;
    },

    getActivePacks: function() {
      return this.activePacks.slice();
    },

    evaluateAction: function(action, context) {
      var result = {
        allowed: true,
        reason: '',
        redactionLevel: 'low',
        requiresTwoPerson: false
      };

      // Check each active pack
      this.activePacks.forEach(function(packId) {
        var pack = PolicyManager.policyPacks[packId];
        if (!pack) return;

        // Check restricted actions
        if (pack.restricted_actions && pack.restricted_actions.indexOf(action) !== -1) {
          result.allowed = false;
          result.reason = 'Action restricted by policy pack: ' + packId;
          return;
        }

        // Check allowed actions
        if (pack.allowed_actions && pack.allowed_actions.length > 0) {
          if (pack.allowed_actions.indexOf(action) === -1) {
            result.allowed = false;
            result.reason = 'Action not in allowed list for policy pack: ' + packId;
            return;
          }
        }

        // Check redaction rules
        if (pack.redaction_rules) {
          pack.redaction_rules.forEach(function(rule) {
            if (rule.action === action || rule.action === '*') {
              if (rule.level && ['high', 'medium', 'low'].indexOf(rule.level) !== -1) {
                result.redactionLevel = rule.level;
              }
            }
          });
        }

        // Check two-person rule
        if (pack.two_person_rule && pack.two_person_rule.indexOf(action) !== -1) {
          result.requiresTwoPerson = true;
        }
      });

      return result;
    },

    getPostureThresholds: function() {
      var thresholds = {
        green: 0.3,
        amber: 0.6,
        red: 0.8,
        black: 0.95
      };

      // Merge thresholds from active packs
      this.activePacks.forEach(function(packId) {
        var pack = PolicyManager.policyPacks[packId];
        if (pack && pack.posture_thresholds) {
          Object.assign(thresholds, pack.posture_thresholds);
        }
      });

      return thresholds;
    }
  };

  // Initialize
  PolicyManager.init();

  global.PolicyManager = PolicyManager;
})(typeof window !== 'undefined' ? window : this);
