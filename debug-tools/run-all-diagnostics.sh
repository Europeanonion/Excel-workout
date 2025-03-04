#!/bin/bash

# Create directory for debug tools if it doesn't exist
mkdir -p ./debug-tools

# Copy individual scripts if they don't already exist
if [[ ! -f ./debug-tools/analyze-imports.sh ]]; then
  cp ./analyze-imports.sh ./debug-tools/analyze-imports.sh
  chmod +x ./debug-tools/analyze-imports.sh
fi

# Create timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MASTER_REPORT="diagnostic-report-${TIMESTAMP}.md"

# Header
echo "# Excel Workout PWA Diagnostic Report" > $MASTER_REPORT
echo "Generated on: $(date)" >> $MASTER_REPORT
echo "" >> $MASTER_REPORT

echo "## Running Import Analysis..."
cd ./debug-tools && ./analyze-imports.sh
echo "## Import Analysis" >> ../$MASTER_REPORT
cat missing-imports-report.txt >> ../$MASTER_REPORT

echo "## Running Web Worker Analysis..."
cd ./debug-tools && ./analyze-webworkers.sh
echo "" >> ../$MASTER_REPORT
echo "## Web Worker Analysis" >> ../$MASTER_REPORT
cat webworker-analysis-report.txt >> ../$MASTER_REPORT

echo "## Running PWA Completeness Check..."
cd ./debug-tools && ./check-pwa-completeness.sh
echo "" >> ../$MASTER_REPORT
echo "## PWA Completeness Check" >> ../$MASTER_REPORT
cat pwa-completeness-report.txt >> ../$MASTER_REPORT

echo "## Running Performance Analysis..."
cd ./debug-tools && ./analyze-performance.sh
echo "" >> ../$MASTER_REPORT
echo "## Performance Analysis" >> ../$MASTER_REPORT
cat performance-analysis-report.txt >> ../$MASTER_REPORT

echo "" >> ../$MASTER_REPORT
echo "## Summary of Required Actions" >> ../$MASTER_REPORT
echo "" >> ../$MASTER_REPORT
echo "### Critical Actions" >> ../$MASTER_REPORT
grep -h "**Action Required**:" *.txt | sort | uniq >> ../$MASTER_REPORT
echo "" >> ../$MASTER_REPORT
echo "### Suggested Improvements" >> ../$MASTER_REPORT
grep -h "**Suggestion**:" *.txt | sort | uniq >> ../$MASTER_REPORT

echo "All diagnostics complete! Master report saved to $MASTER_REPORT"