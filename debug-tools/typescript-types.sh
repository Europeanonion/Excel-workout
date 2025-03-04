#!/bin/bash

REPORT_FILE="typescript-types-report.txt"
echo "# TypeScript Type Check Report" > $REPORT_FILE
echo "Generated on: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Run TypeScript compiler in noEmit mode to check types
echo "Running TypeScript type check..."
TYPE_CHECK_OUTPUT=$(npx tsc --noEmit 2>&1)
TYPE_CHECK_EXIT_CODE=$?

if [ $TYPE_CHECK_EXIT_CODE -eq 0 ]; then
  echo "## TypeScript Type Check" >> $REPORT_FILE
  echo "✅ **Success**: No TypeScript errors found" >> $REPORT_FILE
else
  echo "## TypeScript Type Check" >> $REPORT_FILE
  echo "❌ **Errors found**: TypeScript compilation failed" >> $REPORT_FILE
  echo "" >> $REPORT_FILE
  echo "### Error Details" >> $REPORT_FILE
  echo "```" >> $REPORT_FILE
  echo "$TYPE_CHECK_OUTPUT" >> $REPORT_FILE
  echo "```" >> $REPORT_FILE
  
  # Extract common error patterns
  echo "" >> $REPORT_FILE
  echo "### Common Error Patterns" >> $REPORT_FILE
  
  # Count 'any' types
  ANY_COUNT=$(echo "$TYPE_CHECK_OUTPUT" | grep -c "Type 'any'")
  echo "- 'any' type issues: $ANY_COUNT" >> $REPORT_FILE
  
  # Count missing properties
  MISSING_PROP_COUNT=$(echo "$TYPE_CHECK_OUTPUT" | grep -c "Property.*does not exist on type")
  echo "- Missing property issues: $MISSING_PROP_COUNT" >> $REPORT_FILE
  
  # Count null/undefined issues
  NULL_COUNT=$(echo "$TYPE_CHECK_OUTPUT" | grep -c "null" | grep -c "undefined")
  echo "- Null/undefined issues: $NULL_COUNT" >> $REPORT_FILE
fi

echo "TypeScript type check complete! Report saved to $REPORT_FILE"