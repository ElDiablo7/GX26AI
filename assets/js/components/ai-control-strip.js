/**
 * ENLIL_GOV: AI Control Strip Component
 * Standard interface for all modules (security gods + AGENT-xx)
 * Provides: INPUT, LASER toggle, TARGET, OUTPUT, Targeted I/O display
 */
(function(global) {
  'use strict';

  /**
   * Render AI Control Strip for a module
   * @param {Object} config - { moduleId, moduleName, specialty, onRun }
   * @returns {string} HTML string
   */
  function renderAIControlStrip(config) {
    const { moduleId, moduleName, specialty, onRun } = config || {};
    const safeMode = (window.GRX26_FLAGS && window.GRX26_FLAGS.SAFE_MODE) || 
                     (window.Sentinel && window.Sentinel.lockdownActive) ||
                     (window.GRX26_DEMO_MODE);
    
    return `
<div class="enlil-ai-control-strip" data-module="${moduleId}">
  <div class="enlil-strip-header">
    <h3 class="enlil-strip-title">${moduleName || moduleId.toUpperCase()}</h3>
    <span class="enlil-strip-specialty">${specialty || 'AI Worker Node'}</span>
  </div>
  
  <div class="enlil-strip-main">
    <div class="enlil-strip-row">
      <div class="enlil-input-group">
        <label for="ai_input_${moduleId}">INPUT</label>
        <textarea 
          id="ai_input_${moduleId}" 
          class="enlil-input-textarea"
          placeholder="Give ${moduleName || 'AGENT'} instructions…"
          ${safeMode ? 'disabled' : ''}
          rows="3"></textarea>
      </div>
      
      <div class="enlil-laser-group">
        <label for="ai_laser_${moduleId}">LASER</label>
        <button 
          id="ai_laser_${moduleId}" 
          class="enlil-laser-btn"
          data-state="off"
          ${safeMode ? 'disabled' : ''}
          title="Toggle targeting mode ON/OFF">
          <span class="laser-indicator"></span>
          <span class="laser-label">OFF</span>
        </button>
      </div>
      
      <div class="enlil-target-group">
        <label for="ai_target_${moduleId}">TARGET</label>
        <input 
          type="text" 
          id="ai_target_${moduleId}" 
          class="enlil-target-input"
          placeholder="target: file/folder/url/module"
          ${safeMode ? 'disabled' : ''} />
      </div>
    </div>
    
    <div class="enlil-strip-row">
      <div class="enlil-output-group">
        <label>OUTPUT</label>
        <div id="ai_output_${moduleId}" class="enlil-output-panel">
          <div class="enlil-output-status">idle</div>
          <div class="enlil-output-content"></div>
        </div>
      </div>
    </div>
    
    <div class="enlil-strip-row enlil-targeted-io">
      <div class="enlil-io-display">
        <div class="enlil-io-item">
          <span class="enlil-io-label">TARGET:</span>
          <span id="ai_io_target_${moduleId}" class="enlil-io-value">—</span>
        </div>
        <div class="enlil-io-item">
          <span class="enlil-io-label">INPUT:</span>
          <span id="ai_io_input_${moduleId}" class="enlil-io-value">—</span>
        </div>
        <div class="enlil-io-item">
          <span class="enlil-io-label">OUTPUT:</span>
          <span id="ai_io_output_${moduleId}" class="enlil-io-value">—</span>
        </div>
      </div>
    </div>
    
    <div class="enlil-strip-actions">
      <button 
        class="enlil-action-btn enlil-btn-run"
        data-module="${moduleId}"
        ${safeMode ? 'disabled' : ''}
        title="Execute task">
        RUN
      </button>
      <button 
        class="enlil-action-btn enlil-btn-export"
        data-module="${moduleId}"
        ${safeMode ? 'disabled' : ''}
        title="Export I/O bundle">
        EXPORT
      </button>
      <button 
        class="enlil-action-btn enlil-btn-clear"
        data-module="${moduleId}"
        title="Clear input/output">
        CLEAR
      </button>
    </div>
  </div>
</div>
    `.trim();
  }

  /**
   * Initialize control strip event handlers for a module
   */
  function initControlStrip(moduleId) {
    const laserBtn = document.getElementById(`ai_laser_${moduleId}`);
    const runBtn = document.querySelector(`.enlil-btn-run[data-module="${moduleId}"]`);
    const exportBtn = document.querySelector(`.enlil-btn-export[data-module="${moduleId}"]`);
    const clearBtn = document.querySelector(`.enlil-btn-clear[data-module="${moduleId}"]`);
    const inputEl = document.getElementById(`ai_input_${moduleId}`);
    const targetEl = document.getElementById(`ai_target_${moduleId}`);
    const outputEl = document.getElementById(`ai_output_${moduleId}`);
    
    // Initialize state
    if (!window.ENLIL_STATE) window.ENLIL_STATE = { modules: {} };
    if (!window.ENLIL_STATE.modules[moduleId]) {
      window.ENLIL_STATE.modules[moduleId] = {
        laserOn: false,
        target: '',
        lastInput: '',
        lastOutput: ''
      };
    }
    
    // Check safe mode / lockdown
    const safeMode = (window.GRX26_FLAGS && window.GRX26_FLAGS.SAFE_MODE) || 
                     (window.Sentinel && window.Sentinel.lockdownActive) ||
                     (window.GRX26_DEMO_MODE);
    
    // Update disabled states
    if (inputEl) inputEl.disabled = safeMode;
    if (targetEl) targetEl.disabled = safeMode;
    if (laserBtn) laserBtn.disabled = safeMode;
    if (runBtn) runBtn.disabled = safeMode;
    if (exportBtn) exportBtn.disabled = safeMode;
    
    // Clear laser and target if safe mode active
    if (safeMode) {
      const state = window.ENLIL_STATE.modules[moduleId];
      state.laserOn = false;
      if (targetEl) targetEl.value = '';
      state.target = '';
      if (laserBtn) {
        laserBtn.setAttribute('data-state', 'off');
        const label = laserBtn.querySelector('.laser-label');
        if (label) label.textContent = 'OFF';
        laserBtn.classList.remove('laser-active');
      }
      updateIODisplay(moduleId);
    }
    
    // Laser toggle
    if (laserBtn) {
      laserBtn.addEventListener('click', function() {
        if (window.GRX26_FLAGS && window.GRX26_FLAGS.SAFE_MODE) return;
        if (window.Sentinel && window.Sentinel.lockdownActive) return;
        
        const state = window.ENLIL_STATE.modules[moduleId];
        state.laserOn = !state.laserOn;
        laserBtn.setAttribute('data-state', state.laserOn ? 'on' : 'off');
        laserBtn.querySelector('.laser-label').textContent = state.laserOn ? 'ON' : 'OFF';
        laserBtn.classList.toggle('laser-active', state.laserOn);
        
        // Clear target if laser off
        if (!state.laserOn && targetEl) {
          targetEl.value = '';
          state.target = '';
          updateIODisplay(moduleId);
        }
      });
    }
    
    // RUN button
    if (runBtn) {
      runBtn.addEventListener('click', function() {
        if (window.GRX26_FLAGS && window.GRX26_FLAGS.SAFE_MODE) return;
        if (window.Sentinel && window.Sentinel.lockdownActive) return;
        if (window.GRX26_DEMO_MODE) return;
        
        const input = inputEl ? inputEl.value.trim() : '';
        const target = targetEl ? targetEl.value.trim() : '';
        const state = window.ENLIL_STATE.modules[moduleId];
        
        if (!input) {
          updateOutput(moduleId, 'error', 'No input provided');
          return;
        }
        
        // Update state
        state.lastInput = input;
        state.target = target;
        updateIODisplay(moduleId);
        
        // Dispatch to task bus
        if (window.ENLIL_BUS && window.ENLIL_BUS.dispatch) {
          window.ENLIL_BUS.dispatch({
            moduleId: moduleId,
            target: target,
            input: input,
            laserOn: state.laserOn
          });
        } else {
          // Fallback: direct execution
          executeTask(moduleId, input, target, state.laserOn);
        }
      });
    }
    
    // EXPORT button
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        if (window.GRX26_FLAGS && window.GRX26_FLAGS.SAFE_MODE) return;
        if (window.GRX26_DEMO_MODE) return;
        
        const state = window.ENLIL_STATE.modules[moduleId];
        const bundle = {
          timestamp: Date.now(),
          moduleId: moduleId,
          target: state.target,
          input: state.lastInput,
          output: state.lastOutput,
          laserOn: state.laserOn
        };
        
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enlil_${moduleId}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
    
    // CLEAR button
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        if (inputEl) inputEl.value = '';
        if (targetEl) targetEl.value = '';
        const state = window.ENLIL_STATE.modules[moduleId];
        state.lastInput = '';
        state.target = '';
        state.lastOutput = '';
        updateOutput(moduleId, 'idle', '');
        updateIODisplay(moduleId);
      });
    }
    
    // Update I/O display on input change
    if (inputEl) {
      inputEl.addEventListener('input', function() {
        updateIODisplay(moduleId);
      });
    }
    if (targetEl) {
      targetEl.addEventListener('input', function() {
        const state = window.ENLIL_STATE.modules[moduleId];
        state.target = targetEl.value.trim();
        updateIODisplay(moduleId);
      });
    }
  }
  
  /**
   * Update output panel
   */
  function updateOutput(moduleId, status, content) {
    const outputEl = document.getElementById(`ai_output_${moduleId}`);
    if (!outputEl) return;
    
    const statusEl = outputEl.querySelector('.enlil-output-status');
    const contentEl = outputEl.querySelector('.enlil-output-content');
    
    if (statusEl) statusEl.textContent = status;
    if (contentEl) contentEl.textContent = content;
    
    outputEl.className = 'enlil-output-panel enlil-status-' + status;
    
    // Update state
    if (window.ENLIL_STATE && window.ENLIL_STATE.modules[moduleId]) {
      window.ENLIL_STATE.modules[moduleId].lastOutput = content;
      updateIODisplay(moduleId);
    }
  }
  
  /**
   * Update Targeted I/O display
   */
  function updateIODisplay(moduleId) {
    const state = window.ENLIL_STATE && window.ENLIL_STATE.modules[moduleId];
    if (!state) return;
    
    const targetEl = document.getElementById(`ai_io_target_${moduleId}`);
    const inputEl = document.getElementById(`ai_io_input_${moduleId}`);
    const outputEl = document.getElementById(`ai_io_output_${moduleId}`);
    
    if (targetEl) targetEl.textContent = state.target || '—';
    if (inputEl) {
      const input = document.getElementById(`ai_input_${moduleId}`);
      const inputVal = input ? input.value.trim() : state.lastInput;
      inputEl.textContent = inputVal ? (inputVal.substring(0, 120) + (inputVal.length > 120 ? '...' : '')) : '—';
    }
    if (outputEl) {
      outputEl.textContent = state.lastOutput ? (state.lastOutput.substring(0, 120) + (state.lastOutput.length > 120 ? '...' : '')) : '—';
    }
  }
  
  /**
   * Execute task (fallback if no task bus)
   */
  function executeTask(moduleId, input, target, laserOn) {
    updateOutput(moduleId, 'running', 'Processing...');
    
    // Try to find module brain handler
    let result = null;
    if (window.moduleBrains && window.moduleBrains[moduleId]) {
      try {
        const handler = window.moduleBrains[moduleId];
        if (typeof handler === 'function') {
          result = handler(input, { target: target });
        }
      } catch (e) {
        console.error('[ENLIL Control Strip] Module handler error:', e);
      }
    }
    
    // Default response if no handler
    if (!result) {
      result = `AGENT acknowledged. No brain wired yet. Input logged and routed.\n\nModule: ${moduleId}\nTarget: ${target || 'none'}\nLaser: ${laserOn ? 'ON' : 'OFF'}`;
    }
    
    setTimeout(() => {
      updateOutput(moduleId, 'done', typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    }, 500);
  }

  global.ENLIL = global.ENLIL || {};
  global.ENLIL.ControlStrip = {
    render: renderAIControlStrip,
    init: initControlStrip,
    updateOutput: updateOutput,
    updateIODisplay: updateIODisplay
  };
})(typeof window !== 'undefined' ? window : this);
