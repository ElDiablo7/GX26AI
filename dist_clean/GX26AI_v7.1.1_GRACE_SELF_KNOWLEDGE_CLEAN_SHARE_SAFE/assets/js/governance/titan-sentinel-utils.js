/**
 * TITAN + Sentinel Utility Functions
 * Core utilities for hashing, sanitization, time formatting, etc.
 */
(function(global) {
  'use strict';

  var Utils = {
    /**
     * Simple hash function (SHA-256 simulation for client-side)
     */
    hash: function(str) {
      if (typeof str !== 'string') str = JSON.stringify(str);
      
      // Simple hash function (not cryptographically secure, but sufficient for log chaining)
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Convert to hex string
      return Math.abs(hash).toString(16).padStart(8, '0');
    },

    /**
     * Sanitize string for display
     */
    sanitize: function(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    },

    /**
     * Format timestamp
     */
    formatTime: function(timestamp) {
      if (!timestamp) timestamp = Date.now();
      if (typeof timestamp === 'string') timestamp = new Date(timestamp).getTime();
      var date = new Date(timestamp);
      return date.toISOString().replace('T', ' ').substring(0, 19);
    },

    /**
     * Deep clone object
     */
    deepClone: function(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj.getTime());
      if (obj instanceof Array) return obj.map(function(item) { return Utils.deepClone(item); });
      if (typeof obj === 'object') {
        var cloned = {};
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            cloned[key] = Utils.deepClone(obj[key]);
          }
        }
        return cloned;
      }
      return obj;
    },

    /**
     * Redact sensitive data
     */
    redact: function(str, level) {
      if (typeof str !== 'string') return str;
      level = level || 'medium';
      
      if (level === 'high') {
        return '[REDACTED]';
      } else if (level === 'medium') {
        if (str.length > 20) {
          return str.substring(0, 5) + '...' + str.substring(str.length - 5);
        }
        return '***';
      }
      return str;
    },

    /**
     * Generate trace ID
     */
    traceId: function() {
      return 'tr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    },

    /**
     * Check if value is empty
     */
    isEmpty: function(value) {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return value.trim().length === 0;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      return false;
    },

    /**
     * Merge objects
     */
    merge: function(target, source) {
      if (!source) return target;
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
            target[key] = Utils.merge(target[key] || {}, source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
      return target;
    },

    /**
     * Get severity color
     */
    getSeverityColor: function(severity) {
      var colors = {
        critical: '#ef4444',
        high: '#fbbf24',
        medium: '#3b82f6',
        low: '#22c55e'
      };
      return colors[severity] || colors.medium;
    }
  };

  global.Utils = Utils;
  global.TitanSentinelUtils = Utils;
})(typeof window !== 'undefined' ? window : this);
