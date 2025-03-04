/**
 * Excel Workout PWA - Web Worker for Excel file processing
 * This worker handles the heavy computation of parsing Excel files
 * to prevent UI blocking.
 */

// Set a timeout for long-running operations
const OPERATION_TIMEOUT = 30000; // 30 seconds

// Listen for messages from the main thread
self.onmessage = async function(e) {
  const { type, file } = e.data;
  
  if (type === 'process') {
    // Create a timeout to abort long-running operations
    const timeoutId = setTimeout(() => {
      self.postMessage({
        type: 'error',
        error: 'Operation timed out after ' + (OPERATION_TIMEOUT/1000) + ' seconds'
      });
    }, OPERATION_TIMEOUT);
    
    try {
      // Report initial progress
      self.postMessage({ type: 'progress', progress: 0 });
      
      // Process the file
      const result = await processFile(file);
      
      // Clear the timeout since operation completed successfully
      clearTimeout(timeoutId);
      
      // Report completion
      self.postMessage({ type: 'progress', progress: 100 });
      
      // Send the result back to the main thread
      self.postMessage({ type: 'result', data: result });
    } catch (error) {
      // Clear the timeout since operation completed (with error)
      clearTimeout(timeoutId);
      
      // Report error with more details
      self.postMessage({
        type: 'error',
        error: error.message || 'Unknown error processing file',
        stack: error.stack,
        fileName: file ? file.name : 'unknown',
        fileType: file ? file.type : 'unknown',
        timestamp: new Date().toISOString()
      });
    }
  } else {
    // Handle unknown message types
    self.postMessage({
      type: 'error',
      error: `Unknown message type: ${type}`
    });
  }
};

/**
 * Process an Excel file
 * @param {Object} file - The file object with name, type, and data
 * @returns {Object} - The processed data
 */
async function processFile(file) {
  // Simulate processing steps with progress updates
  await simulateStep(20);
  
  // Parse the file based on type
  let result;
  if (file.name.endsWith('.csv')) {
    result = await parseCSV(file);
  } else {
    result = await parseExcel(file);
  }
  
  await simulateStep(80);
  
  return {
    fileName: file.name,
    fileType: file.type,
    processedData: result,
    timestamp: new Date().toISOString()
  };
}

/**
 * Simulate a processing step with progress reporting
 * @param {number} targetProgress - The progress percentage to reach
 */
async function simulateStep(targetProgress) {
  // In a real implementation, this would be actual processing work
  // For demo purposes, we're just simulating work with a delay
  return new Promise(resolve => {
    self.postMessage({ type: 'progress', progress: targetProgress });
    setTimeout(resolve, 500);
  });
}

/**
 * Parse CSV data
 * @param {Object} file - The file object
 * @returns {Object} - Parsed data
 */
async function parseCSV(file) {
  // In a real implementation, this would parse the CSV data
  // For demo purposes, we're returning a mock result
  return {
    format: 'csv',
    rows: 10,
    columns: 5,
    parsed: true
  };
}

/**
 * Parse Excel data
 * @param {Object} file - The file object
 * @returns {Object} - Parsed data
 */
async function parseExcel(file) {
  // In a real implementation, this would parse the Excel data
  // For demo purposes, we're returning a mock result
  return {
    format: 'excel',
    sheets: 1,
    rows: 20,
    columns: 8,
    parsed: true
  };
}