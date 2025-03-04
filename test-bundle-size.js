const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Get file size in kilobytes
 * @param {string} filePath Path to the file
 * @returns {string} Size in KB with 2 decimal places
 */
function getFileSizeInKB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2);
}

/**
 * Get gzipped size of a file in kilobytes
 * @param {string} filePath Path to the file
 * @returns {string} Gzipped size in KB with 2 decimal places
 */
function getGzippedSizeInKB(filePath) {
  const content = fs.readFileSync(filePath);
  const gzippedContent = zlib.gzipSync(content);
  return (gzippedContent.length / 1024).toFixed(2);
}

/**
 * Analyze bundle sizes and print results
 */
function analyzeBundles() {
  console.log('\n=== Bundle Size Analysis ===\n');
  
  const buildDir = path.join(__dirname, 'build', 'static', 'js');
  
  // Check if build directory exists
  if (!fs.existsSync(buildDir)) {
    console.error('Build directory not found. Run "npm run build" first.');
    return;
  }
  
  // Get all JS files and sort by size (largest first)
  const files = fs.readdirSync(buildDir)
    .filter(file => file.endsWith('.js'))
    .sort((a, b) => {
      return getFileSizeInKB(path.join(buildDir, b)) - getFileSizeInKB(path.join(buildDir, a));
    });
  
  let totalSize = 0;
  let totalGzippedSize = 0;
  
  console.log('Individual Bundle Sizes:\n');
  console.log('Filename                            | Size (KB) | Gzipped (KB)');
  console.log('-------------------------------------|-----------|-------------');
  
  files.forEach(file => {
    const filePath = path.join(buildDir, file);
    const size = parseFloat(getFileSizeInKB(filePath));
    const gzippedSize = parseFloat(getGzippedSizeInKB(filePath));
    
    totalSize += size;
    totalGzippedSize += gzippedSize;
    
    console.log(`${file.padEnd(35)} | ${size.toFixed(2).padStart(9)} | ${gzippedSize.toFixed(2).padStart(12)}`);
  });
  
  console.log('\nTotal Bundle Sizes:');
  console.log(`Total Size: ${totalSize.toFixed(2)} KB`);
  console.log(`Total Gzipped Size: ${totalGzippedSize.toFixed(2)} KB`);
  
  // Save the results to a file for comparison
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultsFile = path.join(__dirname, `bundle-analysis-${timestamp}.txt`);
  
  let resultsContent = '=== Bundle Size Analysis ===\n\n';
  resultsContent += `Date: ${new Date().toLocaleString()}\n\n`;
  resultsContent += 'Individual Bundle Sizes:\n\n';
  resultsContent += 'Filename                            | Size (KB) | Gzipped (KB)\n';
  resultsContent += '-------------------------------------|-----------|--------------\n';
  
  files.forEach(file => {
    const filePath = path.join(buildDir, file);
    const size = getFileSizeInKB(filePath);
    const gzippedSize = getGzippedSizeInKB(filePath);
    
    resultsContent += `${file.padEnd(35)} | ${size.padStart(9)} | ${gzippedSize.padStart(12)}\n`;
  });
  
  resultsContent += '\nTotal Bundle Sizes:\n';
  resultsContent += `Total Size: ${totalSize.toFixed(2)} KB\n`;
  resultsContent += `Total Gzipped Size: ${totalGzippedSize.toFixed(2)} KB\n`;
  
  // Add comparison with previous analysis if available
  if (fs.existsSync('bundle-analysis.json')) {
    try {
      const previousAnalysis = JSON.parse(fs.readFileSync('bundle-analysis.json', 'utf8'));
      const previousTotal = previousAnalysis.totalGzippedSize;
      const difference = previousTotal - totalGzippedSize;
      const percentChange = ((difference / previousTotal) * 100).toFixed(2);
      
      resultsContent += '\nComparison with Previous Analysis:\n';
      resultsContent += `Previous Total Gzipped Size: ${previousTotal.toFixed(2)} KB\n`;
      resultsContent += `Change: ${difference > 0 ? '-' : '+'}${Math.abs(difference).toFixed(2)} KB (${
        difference > 0 ? '-' : '+'
      }${Math.abs(percentChange)}%)\n`;
      
      console.log('\nComparison with Previous Analysis:');
      console.log(`Previous Total Gzipped Size: ${previousTotal.toFixed(2)} KB`);
      console.log(`Change: ${difference > 0 ? '-' : '+'}${Math.abs(difference).toFixed(2)} KB (${
        difference > 0 ? '-' : '+'
      }${Math.abs(percentChange)}%)`);
    } catch (error) {
      console.log('Could not compare with previous analysis:', error.message);
    }
  }
  
  fs.writeFileSync(resultsFile, resultsContent);
  console.log(`\nResults saved to: ${resultsFile}`);
  
  // Save current analysis as reference for future comparisons
  fs.writeFileSync('bundle-analysis.json', JSON.stringify({
    date: new Date().toISOString(),
    totalSize: totalSize,
    totalGzippedSize: totalGzippedSize,
    files: files.map(file => ({
      name: file,
      size: parseFloat(getFileSizeInKB(path.join(buildDir, file))),
      gzippedSize: parseFloat(getGzippedSizeInKB(path.join(buildDir, file)))
    }))
  }, null, 2));
}

// Execute the analysis
analyzeBundles();