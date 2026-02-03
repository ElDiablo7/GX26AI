/**
 * TITAN + Sentinel Logging System
 * Immutable, append-only logging with hash chain
 */
(function(global) {
  'use strict';

  var Utils = global.Utils || global.TitanSentinelUtils || {};

  var LogManager = {
    logs: [],
    initialized: false,

    init: function() {
      if (this.initialized) return;
      this.initialized = true;
      this.loadLogs();
    },

    loadLogs: function() {
      try {
        var stored = localStorage.getItem('sentinel_logs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('LogManager: Failed to load logs', e);
        this.logs = [];
      }
    },

    saveLogs: function() {
      try {
        localStorage.setItem('sentinel_logs', JSON.stringify(this.logs));
      } catch (e) {
        console.warn('LogManager: Failed to save logs', e);
      }
    },

    log: function(action, data, traceId) {
      traceId = traceId || Utils.traceId();
      var timestamp = Date.now();
      var prevHash = this.logs.length > 0 ? this.logs[this.logs.length - 1].hash : '';

      var logEntry = {
        timestamp: timestamp,
        action: action,
        data: data || {},
        traceId: traceId,
        prevHash: prevHash,
        hash: ''
      };

      // Compute hash
      var hashInput = JSON.stringify({
        timestamp: logEntry.timestamp,
        action: logEntry.action,
        data: logEntry.data,
        traceId: logEntry.traceId,
        prevHash: logEntry.prevHash
      });
      logEntry.hash = Utils.hash(hashInput);

      this.logs.push(logEntry);
      this.saveLogs();

      return logEntry;
    },

    verifyChain: function() {
      if (this.logs.length === 0) return { valid: true, issues: [] };
      
      var issues = [];
      for (var i = 1; i < this.logs.length; i++) {
        var prevHash = this.logs[i - 1].hash;
        var expectedHash = this.logs[i].prevHash;
        if (prevHash !== expectedHash) {
          issues.push('Hash chain broken at entry ' + i);
        }
      }

      return {
        valid: issues.length === 0,
        issues: issues
      };
    },

    export: function(format) {
      format = format || 'json';
      if (format === 'json') {
        return JSON.stringify(this.logs, null, 2);
      }
      // Could add CSV or other formats here
      return JSON.stringify(this.logs, null, 2);
    },

    getRecent: function(count) {
      count = count || 10;
      return this.logs.slice(-count);
    }
  };

  // Initialize
  LogManager.init();

  global.LogManager = LogManager;
})(typeof window !== 'undefined' ? window : this);
