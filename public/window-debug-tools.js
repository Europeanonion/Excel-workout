// React DevTools Integration for Excel Workout PWA
console.log('%c Excel Workout Debug Tools Enabled ', 'background: #e91e63; color: white; font-size: 12px; font-weight: bold; padding: 4px;');
console.log('Access debug tools with window.__EXCEL_WORKOUT_DEBUG__');

window.__EXCEL_WORKOUT_DEBUG__ = {
  version: 'dev',
  componentTree: {},

  // Helper to log performance
  logPerformance: function(label) {
    console.time(label);
    return function() { console.timeEnd(label); }
  },

  // Helper to test worker
  testWorker: async function(file) {
    if (!file) {
      console.error('Please provide a file to process');
      return;
    }
    console.log('Testing worker with file:', file.name);
    try {
      const { processFileWithWorker } = await import('/utils/processFileWithWorker.js');
      return processFileWithWorker(file, function(progress) {
        console.log('Processing progress: ' + progress + '%');
      });
    } catch (error) {
      console.error('Worker test failed:', error);
      console.error('Error details:', error.stack || error.message);
    }
  },

  // Helper to analyze component rendering
  trackComponentRenders: function(componentName, details = {}) {
    if (!this.componentTree[componentName]) {
      this.componentTree[componentName] = { 
        renderCount: 0, 
        lastRender: null,
        mounts: 0,
        updates: 0,
        unmounts: 0,
        renderHistory: []
      };
    }
    
    const component = this.componentTree[componentName];
    const timestamp = new Date();
    
    // Update render count and timestamp
    component.renderCount++;
    component.lastRender = timestamp;
    
    // Track render type
    if (details.type) {
      switch (details.type) {
        case 'mount':
          component.mounts++;
          console.log('%c Component ' + componentName + ' mounted ', 'background: #4caf50; color: white;');
          break;
        case 'update':
          component.updates++;
          if (details.propChanges && details.propChanges.length > 0) {
            console.log('%c Component ' + componentName + ' updated due to prop changes: ', 'background: #2196f3; color: white;', details.propChanges);
          }
          if (details.stateChanges && details.stateChanges.length > 0) {
            console.log('%c Component ' + componentName + ' updated due to state changes: ', 'background: #ff9800; color: white;', details.stateChanges);
          }
          if ((!details.propChanges || details.propChanges.length === 0) && 
              (!details.stateChanges || details.stateChanges.length === 0)) {
            console.log('%c Component ' + componentName + ' updated (no detected prop/state changes) ', 'background: #9e9e9e; color: white;');
          }
          break;
        case 'unmount':
          component.unmounts++;
          console.log('%c Component ' + componentName + ' unmounted ', 'background: #f44336; color: white;');
          break;
      }
    } else {
      console.log('Component ' + componentName + ' rendered ' + component.renderCount + ' times');
    }
    
    // Store render history (limited to last 10 renders to prevent memory issues)
    component.renderHistory.unshift({
      timestamp,
      type: details.type || 'render',
      propChanges: details.propChanges || null,
      stateChanges: details.stateChanges || null
    });
    
    // Limit history size
    if (component.renderHistory.length > 10) {
      component.renderHistory.pop();
    }
    
    return component;
  },
  
  // Helper to reset component tracking
  resetComponentTracking: function(componentName) {
    if (componentName) {
      // Reset specific component
      if (this.componentTree[componentName]) {
        this.componentTree[componentName] = { 
          renderCount: 0, 
          lastRender: null,
          mounts: 0,
          updates: 0,
          unmounts: 0,
          renderHistory: []
        };
        console.log('Reset tracking for component: ' + componentName);
      } else {
        console.warn('Component not found: ' + componentName);
      }
    } else {
      // Reset all components
      this.componentTree = {};
      console.log('Reset tracking for all components');
    }
  },

  // Helper to check if worker is supported
  checkWorkerSupport: function() {
    if (typeof Worker !== 'undefined') {
      console.log('✅ Web Workers are supported in this browser');
      return true;
    } else {
      console.error('❌ Web Workers are NOT supported in this browser');
      return false;
    }
  }
};
