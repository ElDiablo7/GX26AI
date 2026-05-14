/**
 * GRACE-X Development Tools Loader
 * Conditionally loads performance monitoring in dev mode only
 * 
 * @copyright © 2026 Zac Crockett - GRACE-X AI™
 * @version 1.0.0
 * @build TITAN_2026_01_01
 */

(function() {
  'use strict';
  
  // Check if dev mode is enabled via any of these methods:
  // 1. Explicit window flag
  // 2. localStorage flag (persists across sessions)
  // 3. Hostname check (localhost = dev mode)
  const isDev = window.GRACEX_DEV_MODE === true || 
                localStorage.getItem('gracex-dev-mode') === 'true' ||
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';
  
  if (!isDev) {
    console.log('[GRACE-X DevTools] Production mode - performance monitoring disabled');
    
    // Create stub API to prevent errors if code references it
    window.GRACEX_Performance = {
      enabled: false,
      measure: () => {},
      mark: () => {},
      getMetrics: () => ({ enabled: false })
    };
    
    return;
  }
  
  console.log('[GRACE-X DevTools] Development mode detected - loading performance monitor');
  
  // Load performance.js dynamically
  const perfScript = document.createElement('script');
  perfScript.src = 'assets/js/performance.js?v=TITAN';
  perfScript.async = true;
  
  perfScript.onload = function() {
    console.log('[GRACE-X DevTools] Performance monitor loaded successfully');
  };
  
  perfScript.onerror = function() {
    console.error('[GRACE-X DevTools] Failed to load performance monitor');
  };
  
  document.head.appendChild(perfScript);
  
  // Add dev mode indicator to UI
  const devIndicator = document.createElement('div');
  devIndicator.style.cssText = `
    position: fixed;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    font-size: 10px;
    font-weight: 600;
    border-radius: 4px;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  devIndicator.textContent = 'DEV MODE';
  devIndicator.title = 'Development mode active - Performance monitoring enabled';
  
  // Add indicator when DOM is ready
  if (document.body) {
    document.body.appendChild(devIndicator);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(devIndicator);
    });
  }
  
  // Add console helper for toggling dev mode
  window.GRACEX_toggleDevMode = function() {
    const currentState = localStorage.getItem('gracex-dev-mode') === 'true';
    const newState = !currentState;
    localStorage.setItem('gracex-dev-mode', String(newState));
    console.log(`[GRACE-X DevTools] Dev mode ${newState ? 'enabled' : 'disabled'} - reload page to apply`);
    return newState;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // OMNI-BRAIN DEV TOOLS (TRACK 1)
  // ═══════════════════════════════════════════════════════════════════════
  window.GRACEX_OmniBrain = {
    exportChain: function(chainId) {
        if (!window.GraceX || !window.GraceX.RAM) return console.error("[DevTools] RAM Brain not loaded.");
        const json = window.GraceX.RAM.exportChainToJSON(chainId);
        if (!json) return console.error(`[DevTools] Chain ${chainId} not found.`);
        
        // Trigger download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gracex_ram_chain_${chainId}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`[DevTools] Exported chain ${chainId} to JSON file.`);
    },
    importChain: function(jsonString) {
        if (!window.GraceX || !window.GraceX.RAM) return console.error("[DevTools] RAM Brain not loaded.");
        if (window.GraceX.RAM.importChainFromJSON(jsonString)) {
            console.log("[DevTools] Successfully imported chain into Omni-Brain.");
        } else {
            console.error("[DevTools] Failed to import chain into Omni-Brain.");
        }
    },
    clearAllRAM: function() {
        if (!window.GraceX || !window.GraceX.RAM) return console.error("[DevTools] RAM Brain not loaded.");
        window.GraceX.RAM.clearAll();
        console.log("[DevTools] Nuclear wipe of all cross-tab Omni-Brain RAM completed.");
    }
  };
  
  console.log('[GRACE-X DevTools] Use GRACEX_toggleDevMode() to toggle dev mode');
  console.log('[GRACE-X DevTools] Omni-Brain Tools available at window.GRACEX_OmniBrain');
})();
