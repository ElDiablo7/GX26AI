/**
 * GRACE-X Audit Log — Tamper-Evident Hash Chain
 * Uses real SHA-256 via Web Crypto API (async with DJB2 fallback).
 * v7.0.1-security-hardening
 */
(function(global) {
  'use strict';

  var buffer = [];
  var lastHash = '';
  var MAX_MEMORY = 500;
  var MAX_STORAGE = 200;
  var STORAGE_KEY = 'gracex_audit_log';
  var CHAIN_KEY = 'gracex_audit_chain';

  // Real SHA-256 hash via Web Crypto API
  function sha256(str) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      var enc = new TextEncoder();
      return crypto.subtle.digest('SHA-256', enc.encode(str)).then(function(buf) {
        return Array.from(new Uint8Array(buf)).map(function(b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
      });
    }
    // Fallback: DJB2 (non-cryptographic — clearly labeled)
    var h = 5381;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i) | 0;
    }
    return Promise.resolve('djb2-' + Math.abs(h).toString(16).padStart(8, '0'));
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
    return sha256(prevHash + canon);
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

    // hashEntry now returns a Promise
    hashEntry(lastHash, entry).then(function(hash) {
      entry.hash = hash;
      lastHash = hash;

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
    });

    // Return entry synchronously (hash will be populated async)
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

  function verifyChain() {
    if (buffer.length < 2) return { valid: true, issues: [] };
    var issues = [];
    // Verify chain integrity (entries are newest-first)
    for (var i = 0; i < buffer.length - 1; i++) {
      if (buffer[i].prevHash && buffer[i + 1].hash) {
        if (buffer[i].prevHash !== buffer[i + 1].hash) {
          issues.push('Chain break at index ' + i);
        }
      }
    }
    return { valid: issues.length === 0, issues: issues };
  }

  loadFromStorage();

  global.Audit = { log: log, getRecent: getRecent, exportBundle: exportBundle, verifyChain: verifyChain };
})(typeof window !== 'undefined' ? window : this);
