#!/bin/bash

# Create output file
REPORT_FILE="performance-analysis-report.txt"
echo "# Performance Analysis Report" > $REPORT_FILE
echo "Generated on: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Check for lazy loading implementation
echo "## Lazy Loading" >> $REPORT_FILE
LAZY_IMPORTS=$(grep -r "React.lazy" --include="*.ts*" --include="*.js*" ./src 2>/dev/null)
if [[ -z "$LAZY_IMPORTS" ]]; then
  echo "❌ **Missing**: No React.lazy imports found" >> $REPORT_FILE
  echo "**Action Required**: Implement lazy loading for components" >> $REPORT_FILE
else
  echo "✅ **Found**: React.lazy imports" >> $REPORT_FILE
  echo "- Lazy-loaded components:" >> $REPORT_FILE
  echo "$LAZY_IMPORTS" | while read -r line; do
    echo "  - \`$line\`" >> $REPORT_FILE
  done
fi

# Check for Suspense usage
echo "" >> $REPORT_FILE
echo "## Suspense Usage" >> $REPORT_FILE
SUSPENSE_USAGE=$(grep -r "Suspense" --include="*.ts*" --include="*.js*" ./src 2>/dev/null)
if [[ -z "$SUSPENSE_USAGE" ]]; then
  echo "❌ **Missing**: No Suspense usage found" >> $REPORT_FILE
  echo "**Action Required**: Implement Suspense for fallback UI" >> $REPORT_FILE
else
  echo "✅ **Found**: Suspense usage" >> $REPORT_FILE
  echo "- Suspense implementation:" >> $REPORT_FILE
  echo "$SUSPENSE_USAGE" | while read -r line; do
    echo "  - \`$line\`" >> $REPORT_FILE
  done
fi

# Check for lazy image loading
echo "" >> $REPORT_FILE
echo "## Image Loading" >> $REPORT_FILE
if grep -r "loading=\"lazy\"" --include="*.ts*" --include="*.js*" ./src/components 2>/dev/null; then
  echo "✅ **Found**: Native lazy loading for images" >> $REPORT_FILE
else
  echo "⚠️ **Warning**: No native lazy loading for images found" >> $REPORT_FILE
  echo "**Suggestion**: Add loading=\"lazy\" to img tags" >> $REPORT_FILE
fi

# Check for custom LazyImage component
LAZY_IMAGE=$(find ./src -name "*LazyImage*" 2>/dev/null)
if [[ -z "$LAZY_IMAGE" ]]; then
  echo "❌ **Missing**: No LazyImage component found" >> $REPORT_FILE
  echo "**Action Required**: Create LazyImage component with IntersectionObserver" >> $REPORT_FILE
else
  echo "✅ **Found**: LazyImage component at \`$LAZY_IMAGE\`" >> $REPORT_FILE
  
  # Check if it uses IntersectionObserver
  if grep -q "IntersectionObserver" "$LAZY_IMAGE"; then
    echo "- ✅ Uses IntersectionObserver" >> $REPORT_FILE
  else
    echo "- ❌ Does not use IntersectionObserver" >> $REPORT_FILE
    echo "- **Action Required**: Implement IntersectionObserver in LazyImage component" >> $REPORT_FILE
  fi
fi

# Check for bundle size issues
echo "" >> $REPORT_FILE
echo "## Bundle Analysis" >> $REPORT_FILE
if [[ -f "./build/asset-manifest.json" ]]; then
  echo "✅ **Found**: Build assets available" >> $REPORT_FILE
  
  # Find largest JS files
  echo "- Largest JS bundles:" >> $REPORT_FILE
  find ./build/static/js -name "*.js" -exec du -h {} \; | sort -hr | head -5 | while read -r line; do
    echo "  - $line" >> $REPORT_FILE
  done
  
  # Find largest CSS files
  echo "- Largest CSS bundles:" >> $REPORT_FILE
  find ./build/static/css -name "*.css" -exec du -h {} \; | sort -hr | head -5 | while read -r line; do
    echo "  - $line" >> $REPORT_FILE
  done
else
  echo "⚠️ **Warning**: No build assets found" >> $REPORT_FILE
  echo "**Suggestion**: Run \`npm run build\` to analyze bundle sizes" >> $REPORT_FILE
fi

echo "Performance analysis complete! Report saved to $REPORT_FILE"