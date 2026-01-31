/**
 * GRX26AI — Lightweight audit log. In-memory + localStorage.
 */
(function(global) {
  'use strict';

  var STORAGE_KEY = 'grx26_audit';
  var MAX_MEMORY = 500;
  var MAX_STORAGE = 200;
  var buffer = [];

  function log(eventType, payload, traceId) {
    var entry = {
      eventType: eventType,
      traceId: traceId || null,
      payload: payload || {},
      ts: Date.now()
    };
    buffer.unshift(entry);
    if (buffer.length > MAX_MEMORY) buffer.length = MAX_MEMORY;
    try {
      var stored = [];
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) try { stored = JSON.parse(raw); } catch (e) { stored = []; }
      stored.unshift(entry);
      if (stored.length > MAX_STORAGE) stored.length = MAX_STORAGE;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {}
    return entry;
  }

  function getRecent(n) {
    n = Math.min(Number(n) || 20, buffer.length);
    return buffer.slice(0, n);
  }

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var stored = JSON.parse(raw);
        buffer = stored.slice(0, MAX_MEMORY);
      }
    } catch (e) {}
  }

  loadFromStorage();

  global.Audit = { log: log, getRecent: getRecent };
})(typeof window !== 'undefined' ? window : this);
