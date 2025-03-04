#!/bin/bash

# Create output file
REPORT_FILE="webworker-analysis-report.txt"
echo "# Web Worker Implementation Analysis" > $REPORT_FILE
echo "Generated on: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Check if workers directory exists
if [[ ! -d "./src/workers" ]]; then
  echo "## Worker Directory" >> $REPORT_FILE
  echo "❌ **Missing directory**: Web Workers directory not found" >> $REPORT_FILE
  echo "**Action Required**: Create \`/src/workers/\` directory" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
else
  echo "## Worker Directory" >> $REPORT_FILE
  echo "✅ **Found**: Web Workers directory exists" >> $REPORT_FILE
  
  # Count worker files
  WORKER_COUNT=$(find ./src/workers -name "*.ts" -o -name "*.js" | wc -l)
  echo "- Worker files found: $WORKER_COUNT" >> $REPORT_FILE
  
  # List worker files
  echo "- Worker files:" >> $REPORT_FILE
  find ./src/workers -name "*.ts" -o -name "*.js" | while read -r file; do
    echo "  - \`$file\`" >> $REPORT_FILE
  done
  echo "" >> $REPORT_FILE
fi

# Check for Excel worker implementation
echo "## Excel Processing Worker" >> $REPORT_FILE
EXCEL_WORKER=$(find ./src -name "*excel*worker*.ts" -o -name "*excel*worker*.js" 2>/dev/null)

if [[ -z "$EXCEL_WORKER" ]]; then
  echo "❌ **Missing**: Excel worker implementation not found" >> $REPORT_FILE
  echo "**Action Required**: Create Excel worker at \`/src/workers/excelWorker.ts\`" >> $REPORT_FILE
else
  echo "✅ **Found**: Excel worker at \`$EXCEL_WORKER\`" >> $REPORT_FILE
  
  # Check if worker has message handlers
  if grep -q "addEventListener.*message" "$EXCEL_WORKER"; then
    echo "- ✅ Has message event listener" >> $REPORT_FILE
  else
    echo "- ❌ Missing message event listener" >> $REPORT_FILE
    echo "- **Action Required**: Add message event listener to worker" >> $REPORT_FILE
  fi
  
  # Check if worker has error handlers
  if grep -q "postMessage.*error\|error.*postMessage" "$EXCEL_WORKER"; then
    echo "- ✅ Has error handling" >> $REPORT_FILE
  else
    echo "- ❌ Missing error handling" >> $REPORT_FILE
    echo "- **Action Required**: Add error handling to worker" >> $REPORT_FILE
  fi
  
  # Check if worker has progress reporting
  if grep -q "progress" "$EXCEL_WORKER"; then
    echo "- ✅ Has progress reporting" >> $REPORT_FILE
  else
    echo "- ❌ Missing progress reporting" >> $REPORT_FILE
    echo "- **Action Required**: Add progress reporting to worker" >> $REPORT_FILE
  fi
fi

# Check for integration with UI components
echo "" >> $REPORT_FILE
echo "## UI Integration" >> $REPORT_FILE
WORKER_USAGE=$(grep -r "new Worker" --include="*.ts*" --include="*.js*" ./src/components 2>/dev/null)

if [[ -z "$WORKER_USAGE" ]]; then
  echo "❌ **Missing**: No worker usage found in components" >> $REPORT_FILE
  echo "**Action Required**: Integrate worker with ExcelUploader component" >> $REPORT_FILE
else
  echo "✅ **Found**: Worker usage in components" >> $REPORT_FILE
  echo "\`\`\`" >> $REPORT_FILE
  echo "$WORKER_USAGE" >> $REPORT_FILE
  echo "\`\`\`" >> $REPORT_FILE
fi

echo "Analysis complete! Report saved to $REPORT_FILE"