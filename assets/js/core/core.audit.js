/**
 * GRX26AI — Lightweight audit log. In-memory + localStorage.
 * ENLIL_GOV: Tamper-evident hash chain (prevHash -> hash); export includes timestamp, actorId, moduleId, action, target, outcome, hash.
 */
(function(global) {
  'use strict';

  var STORAGE_KEY = 'grx26_audit';
  var CHAIN_KEY = 'grx26_audit_chain';
  var MAX_MEMORY = 500;
  var MAX_STORAGE = 200;
  var buffer = [];
  var lastHash = '';

  function sha256ish(str) {
    var h = 0;
    var s = str + '';
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i) | 0;
    }
    return 'h' + Math.abs(h).toString(16) + '-' + s.length;
  }

  function hashEntry(prevHash, entry) {
    var canon = JSON.stringify({
      eventType: entry.eventType,
      traceId: entry.traceId,
      ts: entry.ts,
      actorId: entry.actorId,
      moduleId: entry.moduleId,
      action: entry.action,
      target: entry.target,
      outcome: entry.outcome,
      payload: entry.payload
    });
    return sha256ish(prevHash + canon);
  }

  function log(eventType, payload, traceId, opts) {
    opts = opts || {};
    var entry = {
      eventType: eventType,
      traceId: traceId || null,
      payload: payload || {},
      ts: Date.now(),
      actorId: opts.actorId || null,
      moduleId: opts.moduleId || null,
      action: opts.action || null,
      target: opts.target != null ? String(opts.target) : null,
      outcome: opts.outcome != null ? String(opts.outcome) : null
    };
    entry.prevHash = lastHash;
    entry.hash = hashEntry(lastHash, entry);
    lastHash = entry.hash;

    buffer.unshift(entry);
    if (buffer.length > MAX_MEMORY) buffer.length = MAX_MEMORY;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var stored = raw ? (function() { try { return JSON.parse(raw); } catch (e) { return []; } })() : [];
      stored.unshift(entry);
      if (stored.length > MAX_STORAGE) stored.length = MAX_STORAGE;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      localStorage.setItem(CHAIN_KEY, lastHash);
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
        var chainRaw = localStorage.getItem(CHAIN_KEY);
        if (chainRaw) lastHash = chainRaw;
        else if (buffer.length > 0) lastHash = buffer[0].hash || '';
      }
    } catch (e) {}
  }

  function exportBundle() {
    var list = buffer.slice();
    return list.map(function(e) {
      return {
        timestamp: e.ts,
        actorId: e.actorId,
        moduleId: e.moduleId,
        action: e.action,
        target: e.target,
        outcome: e.outcome,
        eventType: e.eventType,
        traceId: e.traceId,
        prevHash: e.prevHash,
        hash: e.hash
      };
    });
  }

  loadFromStorage();

  global.Audit = { log: log, getRecent: getRecent, exportBundle: exportBundle };
})(typeof window !== 'undefined' ? window : this);
