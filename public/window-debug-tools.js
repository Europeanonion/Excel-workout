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
      const { processFileWithWorker } = await import('./utils/processFileWithWorker.js');
      return processFileWithWorker(file, function(progress) {
        console.log('Processing progress: ' + progress + '%');
      });
    } catch (error) {
      console.error('Worker test failed:', error);
    }
  },

  // Helper to analyze component rendering
  trackComponentRenders: function(componentName) {
    if (!this.componentTree[componentName]) {
      this.componentTree[componentName] = { renderCount: 0, lastRender: null };
    }
    this.componentTree[componentName].renderCount++;
    this.componentTree[componentName].lastRender = new Date();
    console.log('Component ' + componentName + ' rendered ' + this.componentTree[componentName].renderCount + ' times');
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
