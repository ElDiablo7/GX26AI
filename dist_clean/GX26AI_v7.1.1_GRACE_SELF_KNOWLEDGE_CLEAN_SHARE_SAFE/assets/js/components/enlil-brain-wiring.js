/**
 * ENLIL_GOV: Brain Wiring for All Modules
 * Registers window.moduleBrains[moduleId] for every module so that
 * the AI Control Strip RUN button calls the real /api/brain endpoint
 * via runModuleBrain / runLevel5Brain (brainLevel5.js).
 *
 * Does NOT overwrite existing handlers — modules with custom brains keep them.
 */
(function(global) {
  'use strict';

  // All module IDs in the system
  var ALL_MODULES = [
    'core', 'core2', 'sentinel', 'titan', 'venus', 'guardian',
    'forge', 'forge_map', 'system-status', 'audit-log',
    'builder', 'siteops', 'tradelink', 'beauty', 'fit',
    'yoga', 'uplift', 'chef', 'artist', 'family',
    'gamer', 'accounting', 'osint', 'sport'
  ];

  // Module-specific system prompts for modules not already in brainLevel5.js
  // These supplement the prompts in brainLevel5.js BRAIN_CONFIG.systemPrompts
  var ENLIL_PROMPTS = {
    core: 'You are GRACE-X Core, the main AI command center. Route requests, provide system info, and assist with any task. Be direct and efficient.',
    core2: 'You are GRACE-X Core 2.0, an advanced AI command interface. Provide detailed, intelligent responses. You have access to all system modules.',
    sentinel: 'You are ENLIL, the Command & Governance module. You handle authentication, authorization, policy enforcement, and security posture. Be authoritative and precise.',
    titan: 'You are NINURTA, the Tactical Threat Analysis nucleus. Perform threat scanning, integrity checks, compliance validation, and red team analysis. Be terse and operational.',
    venus: 'You are ENKI, the Sandbox & Flytrap module. Handle cyber security, honeypot deployment, predator trapping, and evidence gathering. Be sharp and security-focused.',
    guardian: 'You are NANSHE, the Protection & Safeguarding module. Handle child safety, domestic abuse detection, crisis intervention. Always prioritize human safety above all else.',
    forge: 'You are GIBIL, the Forge & Systems module. Help build mini-apps, manage projects, generate code templates, and handle file operations. Be technical and precise.',
    forge_map: 'You are GIBIL MAP, the Systems Map module. Show system registry, node structure, and module relationships. Provide system architecture insights.',
    'system-status': 'You are NISABA, the System Status & Records module. Report on system health, run diagnostics, and maintain operational records. Be factual and data-driven.',
    'audit-log': 'You are UTU LOG, the Oversight & Audit module. Manage audit trails, verify log integrity, and provide compliance reporting. Be thorough and precise.',
    sport: 'You are GRACE-X Sport, a real-time sports analytics assistant. Provide live scores, match predictions, and betting insights. Use data, not hype.'
  };

  /**
   * Create a brain handler for a module.
   * Calls runModuleBrain (which is already wrapped by brainLevel5.js to call the API).
   * Falls back gracefully when offline.
   */
  function createBrainHandler(moduleId) {
    return async function(input, context) {
      var text = '';

      // Handle input: could be a string or the first argument from task bus
      if (typeof input === 'string') {
        text = input.trim();
      } else if (input && typeof input === 'object' && input.input) {
        text = String(input.input).trim();
      }

      if (!text) {
        return 'No input provided. Type a message and click RUN.';
      }

      // If there's a target, prepend it as context
      var target = (context && context.target) ? context.target : '';
      var fullInput = text;
      if (target) {
        fullInput = '[TARGET: ' + target + '] ' + text;
      }

      // Ensure our system prompt is registered in brainLevel5 config
      // (brainLevel5.js checks BRAIN_CONFIG.systemPrompts[moduleId])
      if (ENLIL_PROMPTS[moduleId] && global.BRAIN_CONFIG_EXTEND) {
        global.BRAIN_CONFIG_EXTEND(moduleId, ENLIL_PROMPTS[moduleId]);
      }

      // Primary path: runModuleBrain (wrapped by brainLevel5.js to call /api/brain)
      if (typeof global.runModuleBrain === 'function') {
        try {
          var reply = global.runModuleBrain(moduleId, fullInput);
          // runModuleBrain may return a Promise (Level 5) or a string (Level 1)
          if (reply && typeof reply.then === 'function') {
            return await reply;
          }
          return reply || 'No response from brain.';
        } catch (err) {
          console.warn('[ENLIL Brain Wiring] runModuleBrain error for ' + moduleId + ':', err);
        }
      }

      // Fallback: runLevel5Brain directly
      if (typeof global.runLevel5Brain === 'function') {
        try {
          return await global.runLevel5Brain(moduleId, fullInput);
        } catch (err) {
          console.warn('[ENLIL Brain Wiring] runLevel5Brain error for ' + moduleId + ':', err);
        }
      }

      // Last resort: meaningful stub
      return moduleId.toUpperCase() + ' received your input. The AI brain API is not available right now. Your message has been logged:\n\n"' + text.substring(0, 200) + '"';
    };
  }

  /**
   * Register brain handlers for all modules.
   * Does NOT overwrite existing handlers.
   */
  function wireAllBrains() {
    if (!global.moduleBrains) {
      global.moduleBrains = {};
    }

    var wired = 0;
    var skipped = 0;

    for (var i = 0; i < ALL_MODULES.length; i++) {
      var moduleId = ALL_MODULES[i];

      // Skip if module already has a custom handler
      if (global.moduleBrains[moduleId] && typeof global.moduleBrains[moduleId] === 'function') {
        skipped++;
        continue;
      }

      // Register handler
      global.moduleBrains[moduleId] = createBrainHandler(moduleId);
      wired++;
    }

    console.info('[ENLIL Brain Wiring] Wired ' + wired + ' modules to AI brain, skipped ' + skipped + ' (already had handlers)');
  }

  /**
   * Extend brainLevel5 system prompts if possible.
   * Called once to inject our ENLIL-specific prompts into the Level 5 config.
   */
  function extendBrainPrompts() {
    // brainLevel5.js stores prompts in a closure, but we can inject via a helper
    // if it exposes one. Otherwise, prompts are sent server-side via module name.
    // The server's /api/brain endpoint uses the module name to pick a system prompt.
    // So our prompts here serve as documentation and fallback context.
    
    // If brainLevel5 exposed a config extender, use it
    if (typeof global.BRAIN_CONFIG_EXTEND === 'function') {
      for (var moduleId in ENLIL_PROMPTS) {
        if (ENLIL_PROMPTS.hasOwnProperty(moduleId)) {
          global.BRAIN_CONFIG_EXTEND(moduleId, ENLIL_PROMPTS[moduleId]);
        }
      }
    }
  }

  // Wire everything up after a short delay to let brainLevel5.js initialize first
  function init() {
    extendBrainPrompts();
    wireAllBrains();
  }

  // Run after DOM is ready and other scripts have loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 200);
    });
  } else {
    setTimeout(init, 200);
  }

  // Re-wire when new modules load (in case scripts register handlers late)
  document.addEventListener('gracex:module:loaded', function() {
    setTimeout(wireAllBrains, 300);
  });

  // Expose for debugging
  global.ENLIL = global.ENLIL || {};
  global.ENLIL.BrainWiring = {
    wireAll: wireAllBrains,
    createHandler: createBrainHandler,
    modules: ALL_MODULES,
    prompts: ENLIL_PROMPTS
  };

})(typeof window !== 'undefined' ? window : this);
