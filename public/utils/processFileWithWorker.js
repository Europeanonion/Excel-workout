/**
 * Excel Workout PWA - Worker-based file processing utility
 * This module provides a worker-based approach to processing Excel files
 * to prevent UI blocking during heavy computation.
 */

// Maximum time to wait for worker response (in milliseconds)
const MAX_WORKER_TIMEOUT = 60000; // 1 minute

/**
 * Process a file using a Web Worker
 * @param {File} file - The file to process
 * @param {Function} progressCallback - Optional callback for progress updates
 * @param {Object} options - Additional options
 * @param {number} options.timeout - Custom timeout in milliseconds
 * @returns {Promise<Object>} - The processed data
 */
export function processFileWithWorker(file, progressCallback, options = {}) {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!file || !(file instanceof File)) {
      reject(new Error('Invalid file: Please provide a valid File object'));
      return;
    }
    
    // Check if workers are supported
    if (!isWorkerSupported()) {
      reject(new Error('Web Workers are not supported in this browser'));
      return;
    }
    
    // Create a worker
    const worker = new Worker('/excelWorker.js');
    
    // Set up timeout
    const timeout = options.timeout || MAX_WORKER_TIMEOUT;
    const timeoutId = setTimeout(() => {
      worker.terminate();
      reject(new Error(`Worker timed out after ${timeout/1000} seconds`));
    }, timeout);
    
    // Track memory usage if performance API is available
    let memoryUsage = {};
    if (window.performance && window.performance.memory) {
      memoryUsage.before = { ...window.performance.memory };
    }
    
    // Set up message handler
    worker.onmessage = function(e) {
      const { type, data, progress, error, stack, fileName, fileType, timestamp } = e.data;
      
      switch (type) {
        case 'progress':
          if (progressCallback && typeof progressCallback === 'function') {
            progressCallback(progress);
          }
          break;
        case 'result':
          clearTimeout(timeoutId);
          worker.terminate();
          
          // Track memory usage after processing
          if (window.performance && window.performance.memory) {
            memoryUsage.after = { ...window.performance.memory };
            console.debug('Memory usage during processing:', {
              before: memoryUsage.before,
              after: memoryUsage.after,
              difference: {
                usedJSHeapSize: memoryUsage.after.usedJSHeapSize - memoryUsage.before.usedJSHeapSize,
                totalJSHeapSize: memoryUsage.after.totalJSHeapSize - memoryUsage.before.totalJSHeapSize
              }
            });
          }
          
          resolve(data);
          break;
        case 'error':
          clearTimeout(timeoutId);
          worker.terminate();
          
          // Create a detailed error object
          const errorObj = new Error(error);
          if (stack) errorObj.stack = stack;
          errorObj.details = {
            fileName,
            fileType,
            timestamp
          };
          
          reject(errorObj);
          break;
      }
    };
    
    // Handle worker errors
    worker.onerror = function(error) {
      clearTimeout(timeoutId);
      worker.terminate();
      reject(new Error(`Worker error: ${error.message || 'Unknown error'}`));
    };
    
    // Convert file to array buffer for transfer to worker
    const reader = new FileReader();
    
    reader.onload = function(e) {
      // Post the file data to the worker
      worker.postMessage({
        type: 'process',
        file: {
          name: file.name,
          type: file.type,
          data: e.target.result
        }
      });
    };
    
    reader.onerror = function() {
      clearTimeout(timeoutId);
      reject(new Error('Failed to read file'));
    };
    
    // Read the file as array buffer
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Check if Web Workers are supported in the current browser
 * @returns {boolean} - Whether Web Workers are supported
 */
export function isWorkerSupported() {
  return typeof Worker !== 'undefined';
}

/**
 * Abort a running worker
 * @param {Worker} worker - The worker to abort
 * @returns {boolean} - Whether the worker was successfully aborted
 */
export function abortWorker(worker) {
  if (worker) {
    try {
      worker.terminate();
      return true;
    } catch (error) {
      console.error('Failed to abort worker:', error);
      return false;
    }
  }
  return false;
}