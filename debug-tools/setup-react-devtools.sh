#!/bin/bash

# Check if we're in development mode
if [[ "$NODE_ENV" == "production" ]]; then
  echo "⚠️ This script is intended for development environments only."
  exit 0
fi

# Ensure all files are saved in debug-tools directory
cd "$(dirname "$0")"

# Create the debug injection script
INJECT_SCRIPT="window-debug-tools.js"
echo "// React DevTools Integration for Excel Workout PWA" > $INJECT_SCRIPT
echo "console.log('%c Excel Workout Debug Tools Enabled ', 'background: #e91e63; color: white; font-size: 12px; font-weight: bold; padding: 4px;');" >> $INJECT_SCRIPT
echo "console.log('Access debug tools with window.__EXCEL_WORKOUT_DEBUG__');" >> $INJECT_SCRIPT
echo "" >> $INJECT_SCRIPT
echo "window.__EXCEL_WORKOUT_DEBUG__ = {" >> $INJECT_SCRIPT
echo "  version: 'dev'," >> $INJECT_SCRIPT
echo "  componentTree: {}," >> $INJECT_SCRIPT
echo "" >> $INJECT_SCRIPT
echo "  // Helper to log performance" >> $INJECT_SCRIPT
echo "  logPerformance: function(label) {" >> $INJECT_SCRIPT
echo "    console.time(label);" >> $INJECT_SCRIPT
echo "    return function() { console.timeEnd(label); }" >> $INJECT_SCRIPT
echo "  }," >> $INJECT_SCRIPT
echo "" >> $INJECT_SCRIPT
echo "  // Helper to test worker" >> $INJECT_SCRIPT
echo "  testWorker: async function(file) {" >> $INJECT_SCRIPT
echo "    if (!file) {" >> $INJECT_SCRIPT
echo "      console.error('Please provide a file to process');" >> $INJECT_SCRIPT
echo "      return;" >> $INJECT_SCRIPT
echo "    }" >> $INJECT_SCRIPT
echo "    console.log('Testing worker with file:', file.name);" >> $INJECT_SCRIPT
echo "    try {" >> $INJECT_SCRIPT
echo "      const { processFileWithWorker } = await import('./utils/processFileWithWorker.js');" >> $INJECT_SCRIPT
echo "      return processFileWithWorker(file, function(progress) {" >> $INJECT_SCRIPT
echo "        console.log('Processing progress: ' + progress + '%');" >> $INJECT_SCRIPT
echo "      });" >> $INJECT_SCRIPT
echo "    } catch (error) {" >> $INJECT_SCRIPT
echo "      console.error('Worker test failed:', error);" >> $INJECT_SCRIPT
echo "    }" >> $INJECT_SCRIPT
echo "  }," >> $INJECT_SCRIPT
echo "" >> $INJECT_SCRIPT
echo "  // Helper to analyze component rendering" >> $INJECT_SCRIPT
echo "  trackComponentRenders: function(componentName) {" >> $INJECT_SCRIPT
echo "    if (!this.componentTree[componentName]) {" >> $INJECT_SCRIPT
echo "      this.componentTree[componentName] = { renderCount: 0, lastRender: null };" >> $INJECT_SCRIPT
echo "    }" >> $INJECT_SCRIPT
echo "    this.componentTree[componentName].renderCount++;" >> $INJECT_SCRIPT
echo "    this.componentTree[componentName].lastRender = new Date();" >> $INJECT_SCRIPT
echo "    console.log('Component ' + componentName + ' rendered ' + this.componentTree[componentName].renderCount + ' times');" >> $INJECT_SCRIPT
echo "  }," >> $INJECT_SCRIPT
echo "" >> $INJECT_SCRIPT
echo "  // Helper to check if worker is supported" >> $INJECT_SCRIPT
echo "  checkWorkerSupport: function() {" >> $INJECT_SCRIPT
echo "    if (typeof Worker !== 'undefined') {" >> $INJECT_SCRIPT
echo "      console.log('✅ Web Workers are supported in this browser');" >> $INJECT_SCRIPT
echo "      return true;" >> $INJECT_SCRIPT
echo "    } else {" >> $INJECT_SCRIPT
echo "      console.error('❌ Web Workers are NOT supported in this browser');" >> $INJECT_SCRIPT
echo "      return false;" >> $INJECT_SCRIPT
echo "    }" >> $INJECT_SCRIPT
echo "  }" >> $INJECT_SCRIPT
echo "};" >> $INJECT_SCRIPT

# Create HTML snippet for including the script
HTML_SNIPPET="debug-script-tag.html"
echo "<!-- Add this before closing </body> tag in index.html for development only -->" > $HTML_SNIPPET
echo "<script src=\"${INJECT_SCRIPT}\"></script>" >> $HTML_SNIPPET

# Create React hook for component debugging
REACT_HOOK="useDebugTracking.js"
echo "// Debug tracking hook for React components" > $REACT_HOOK
echo "import { useEffect } from 'react';" >> $REACT_HOOK
echo "" >> $REACT_HOOK
echo "/**" >> $REACT_HOOK
echo " * Hook to track component renders in debug tools" >> $REACT_HOOK
echo " * @param {string} componentName - Name of the component to track" >> $REACT_HOOK
echo " */" >> $REACT_HOOK
echo "export const useDebugTracking = (componentName) => {" >> $REACT_HOOK
echo "  useEffect(() => {" >> $REACT_HOOK
echo "    // Only run in development" >> $REACT_HOOK
echo "    if (process.env.NODE_ENV !== 'production' && window.__EXCEL_WORKOUT_DEBUG__) {" >> $REACT_HOOK
echo "      window.__EXCEL_WORKOUT_DEBUG__.trackComponentRenders(componentName);" >> $REACT_HOOK
echo "    }" >> $REACT_HOOK
echo "  });" >> $REACT_HOOK
echo "};" >> $REACT_HOOK

# Create instructions file
INSTRUCTIONS="debug-tools-instructions.md"
echo "# Excel Workout PWA Debug Tools" > $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "## Setup Instructions" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "### For Development Environment:" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "1. Copy \`${INJECT_SCRIPT}\` to your \`public\` directory" >> $INSTRUCTIONS
echo "2. For local development, add this script tag to \`public/index.html\` before the closing \`</body>\` tag:" >> $INSTRUCTIONS
echo "   \`\`\`html" >> $INSTRUCTIONS
echo "   <script src=\"${INJECT_SCRIPT}\"></script>" >> $INSTRUCTIONS
echo "   \`\`\`" >> $INSTRUCTIONS
echo "3. Copy \`${REACT_HOOK}\` to \`src/hooks/\` directory" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "## Usage" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "### In Browser Console:" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "\`\`\`javascript" >> $INSTRUCTIONS
echo "// Test if Web Workers are supported" >> $INSTRUCTIONS
echo "window.__EXCEL_WORKOUT_DEBUG__.checkWorkerSupport()" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "// Measure performance of any operation" >> $INSTRUCTIONS
echo "const endTimer = window.__EXCEL_WORKOUT_DEBUG__.logPerformance('Operation Name')" >> $INSTRUCTIONS
echo "// ... do something ..." >> $INSTRUCTIONS
echo "endTimer() // Will log the time taken" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "// Test Excel processing worker with a file" >> $INSTRUCTIONS
echo "// First, select a file using file input" >> $INSTRUCTIONS
echo "const fileInput = document.querySelector('input[type=\"file\"]')" >> $INSTRUCTIONS
echo "const file = fileInput.files[0]" >> $INSTRUCTIONS
echo "// Then test the worker" >> $INSTRUCTIONS
echo "window.__EXCEL_WORKOUT_DEBUG__.testWorker(file).then(result => console.log(result))" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "// View component render statistics" >> $INSTRUCTIONS
echo "window.__EXCEL_WORKOUT_DEBUG__.componentTree" >> $INSTRUCTIONS
echo "\`\`\`" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "### In React Components:" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "\`\`\`jsx" >> $INSTRUCTIONS
echo "import { useDebugTracking } from '../hooks/useDebugTracking'" >> $INSTRUCTIONS
echo "" >> $INSTRUCTIONS
echo "const MyComponent = () => {" >> $INSTRUCTIONS
echo "  // Add this to track renders in development" >> $INSTRUCTIONS
echo "  useDebugTracking('MyComponent')" >> $INSTRUCTIONS
echo "  " >> $INSTRUCTIONS
echo "  return <div>My Component</div>" >> $INSTRUCTIONS
echo "}" >> $INSTRUCTIONS
echo "\`\`\`" >> $INSTRUCTIONS

echo "Generated debug tools integration files:"
echo "1. ${INJECT_SCRIPT} - Client-side debug utilities (saved to debug-tools/)"
echo "2. ${HTML_SNIPPET} - HTML snippet for including the script (saved to debug-tools/)"
echo "3. ${REACT_HOOK} - React hook for component debugging (saved to debug-tools/)"
echo "4. ${INSTRUCTIONS} - Instructions for using debug tools (saved to debug-tools/)"
echo ""
echo "Follow the instructions in debug-tools/${INSTRUCTIONS} to set up the debug tools."

# Copy hook to src/hooks if it exists
if [[ -d "../src/hooks" ]]; then
  cp $REACT_HOOK "../src/hooks/"
  echo "✅ Automatically copied ${REACT_HOOK} to src/hooks/ directory"
fi

# Offer to copy script to public directory
if [[ -d "../public" ]]; then
  echo ""
  echo "Would you like to copy ${INJECT_SCRIPT} to the public directory? (y/n)"
  read -r answer
  if [[ "$answer" == "y" ]]; then
    cp $INJECT_SCRIPT "../public/"
    echo "✅ Copied ${INJECT_SCRIPT} to public directory"
  fi
fi