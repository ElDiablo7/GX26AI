/**
 * ENLIL_GOV: Task Bus - Central task routing for all modules
 * Routes all module execution through a single dispatcher
 */
(function(global) {
  'use strict';

  const ENLIL_BUS = {
    tasks: [],
    subscribers: [],
    
    /**
     * Dispatch a task
     */
    dispatch: function(task) {
      const taskEntry = {
        ts: Date.now(),
        actorId: (window.Sentinel && window.Sentinel.currentRole) || null,
        moduleId: task.moduleId,
        target: task.target || null,
        input: task.input || '',
        laserOn: task.laserOn || false,
        status: 'queued',
        result: null,
        error: null
      };
      
      this.tasks.unshift(taskEntry);
      if (this.tasks.length > 1000) this.tasks.length = 1000; // Keep last 1000
      
      // Log to audit
      if (global.Audit && global.Audit.log) {
        global.Audit.log('enlil_task_queued', {
          moduleId: task.moduleId,
          target: task.target,
          inputLength: (task.input || '').length
        }, null, {
          actorId: taskEntry.actorId,
          moduleId: task.moduleId,
          action: 'task_queued',
          target: task.target,
          outcome: 'queued'
        });
      }
      
      // Notify subscribers
      this.subscribers.forEach(fn => {
        try {
          fn(taskEntry);
        } catch (e) {
          console.error('[ENLIL Bus] Subscriber error:', e);
        }
      });
      
      // Execute task
      this.executeTask(taskEntry);
      
      return taskEntry;
    },
    
    /**
     * Execute a task
     */
    executeTask: async function(taskEntry) {
      taskEntry.status = 'running';
      
      // Update control strip output
      if (global.ENLIL && global.ENLIL.ControlStrip) {
        global.ENLIL.ControlStrip.updateOutput(taskEntry.moduleId, 'running', 'Processing...');
      }
      
      try {
        // Try module brain handler (registered by enlil-brain-wiring.js for all modules)
        let result = null;
        if (window.moduleBrains && window.moduleBrains[taskEntry.moduleId]) {
          const handler = window.moduleBrains[taskEntry.moduleId];
          if (typeof handler === 'function') {
            result = await Promise.resolve(handler(taskEntry.input, { target: taskEntry.target }));
          }
        }
        
        // Fallback: call runModuleBrain directly (wrapped by brainLevel5.js to call /api/brain)
        if (!result && typeof window.runModuleBrain === 'function') {
          var fullInput = taskEntry.input;
          if (taskEntry.target) {
            fullInput = '[TARGET: ' + taskEntry.target + '] ' + taskEntry.input;
          }
          result = await Promise.resolve(window.runModuleBrain(taskEntry.moduleId, fullInput));
        }
        
        // Fallback: runLevel5Brain directly
        if (!result && typeof window.runLevel5Brain === 'function') {
          result = await Promise.resolve(window.runLevel5Brain(taskEntry.moduleId, taskEntry.input));
        }
        
        // Fallback: Core Orchestrator (internal routing, no API)
        if (!result && global.CoreOrchestrator && global.CoreOrchestrator.handleUserRequest) {
          result = await Promise.resolve(global.CoreOrchestrator.handleUserRequest(taskEntry.input, {
            module: taskEntry.moduleId,
            target: taskEntry.target
          }));
        }
        
        // Last resort stub
        if (!result) {
          result = taskEntry.moduleId.toUpperCase() + ' received your input. The AI brain API is not available right now. Your message has been logged.\n\nInput: "' + (taskEntry.input || '').substring(0, 200) + '"';
        }
        
        taskEntry.status = 'done';
        taskEntry.result = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        
        // Update control strip
        if (global.ENLIL && global.ENLIL.ControlStrip) {
          global.ENLIL.ControlStrip.updateOutput(
            taskEntry.moduleId, 
            'done', 
            taskEntry.result
          );
        }
        
        // Log to audit
        if (global.Audit && global.Audit.log) {
          global.Audit.log('enlil_task_complete', {
            moduleId: taskEntry.moduleId,
            resultLength: (taskEntry.result || '').length
          }, null, {
            actorId: taskEntry.actorId,
            moduleId: taskEntry.moduleId,
            action: 'task_execute',
            target: taskEntry.target,
            outcome: 'success'
          });
        }
        
      } catch (error) {
        taskEntry.status = 'error';
        taskEntry.error = error.message || String(error);
        
        // Update control strip
        if (global.ENLIL && global.ENLIL.ControlStrip) {
          global.ENLIL.ControlStrip.updateOutput(
            taskEntry.moduleId, 
            'error', 
            'Error: ' + taskEntry.error
          );
        }
        
        // Log to audit
        if (global.Audit && global.Audit.log) {
          global.Audit.log('enlil_task_error', {
            moduleId: taskEntry.moduleId,
            error: taskEntry.error
          }, null, {
            actorId: taskEntry.actorId,
            moduleId: taskEntry.moduleId,
            action: 'task_execute',
            target: taskEntry.target,
            outcome: 'error'
          });
        }
        
        console.error('[ENLIL Bus] Task execution error:', error);
      }
    },
    
    /**
     * Subscribe to task events
     */
    subscribe: function(fn) {
      if (typeof fn === 'function') {
        this.subscribers.push(fn);
      }
    },
    
    /**
     * Get current state
     */
    getState: function() {
      return {
        tasks: this.tasks.slice(0, 100), // Last 100 tasks
        totalTasks: this.tasks.length,
        subscribers: this.subscribers.length
      };
    },
    
    /**
     * Get tasks for a module
     */
    getModuleTasks: function(moduleId) {
      return this.tasks.filter(t => t.moduleId === moduleId);
    }
  };

  global.ENLIL_BUS = ENLIL_BUS;
  global.ENLIL = global.ENLIL || {};
  global.ENLIL.Bus = ENLIL_BUS;
})(typeof window !== 'undefined' ? window : this);
