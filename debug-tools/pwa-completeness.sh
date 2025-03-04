#!/bin/bash

# Create output file
REPORT_FILE="pwa-completeness-report.txt"
echo "# PWA Implementation Completeness Check" > $REPORT_FILE
echo "Generated on: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Check manifest.json
echo "## Web App Manifest" >> $REPORT_FILE
if [[ -f "./public/manifest.json" ]]; then
  echo "✅ **Found**: manifest.json exists" >> $REPORT_FILE
  
  # Check required fields
  MANIFEST_CONTENT=$(cat ./public/manifest.json)
  
  # Check name
  if echo "$MANIFEST_CONTENT" | grep -q '"name"'; then
    echo "- ✅ Has name field" >> $REPORT_FILE
  else
    echo "- ❌ Missing name field" >> $REPORT_FILE
  fi
  
  # Check icons
  if echo "$MANIFEST_CONTENT" | grep -q '"icons"'; then
    echo "- ✅ Has icons field" >> $REPORT_FILE
    
    # Count icons
    ICON_COUNT=$(echo "$MANIFEST_CONTENT" | grep -o '"src"' | wc -l)
    echo "  - Icon count: $ICON_COUNT" >> $REPORT_FILE
    
    # Check if it has enough icons
    if [[ "$ICON_COUNT" -lt 5 ]]; then
      echo "  - ⚠️ **Warning**: Only $ICON_COUNT icons defined, recommended at least 5 different sizes" >> $REPORT_FILE
    fi
  else
    echo "- ❌ Missing icons field" >> $REPORT_FILE
  fi
  
  # Check start_url
  if echo "$MANIFEST_CONTENT" | grep -q '"start_url"'; then
    echo "- ✅ Has start_url field" >> $REPORT_FILE
  else
    echo "- ❌ Missing start_url field" >> $REPORT_FILE
  fi
  
  # Check display
  if echo "$MANIFEST_CONTENT" | grep -q '"display"'; then
    echo "- ✅ Has display field" >> $REPORT_FILE
  else
    echo "- ❌ Missing display field" >> $REPORT_FILE
  fi
else
  echo "❌ **Missing**: manifest.json not found" >> $REPORT_FILE
  echo "**Action Required**: Create manifest.json in public directory" >> $REPORT_FILE
fi

# Check service worker registration
echo "" >> $REPORT_FILE
echo "## Service Worker" >> $REPORT_FILE
if grep -q "serviceWorker" ./src/index.tsx 2>/dev/null || grep -q "serviceWorker" ./src/index.ts 2>/dev/null; then
  echo "✅ **Found**: Service Worker registration in index file" >> $REPORT_FILE
else
  echo "❌ **Missing**: No Service Worker registration found in index file" >> $REPORT_FILE
  echo "**Action Required**: Add Service Worker registration to index file" >> $REPORT_FILE
fi

if [[ -f "./src/serviceWorkerRegistration.ts" ]]; then
  echo "✅ **Found**: Service Worker registration file exists" >> $REPORT_FILE
  
  # Check for update handling
  if grep -q "onUpdate" ./src/serviceWorkerRegistration.ts; then
    echo "- ✅ Has update handling" >> $REPORT_FILE
  else
    echo "- ❌ Missing update handling" >> $REPORT_FILE
  fi
  
  # Check for security measures
  if grep -q "updateViaCache" ./src/serviceWorkerRegistration.ts; then
    echo "- ✅ Has security measures" >> $REPORT_FILE
  else
    echo "- ⚠️ **Warning**: No updateViaCache setting found" >> $REPORT_FILE
  fi
else
  echo "❌ **Missing**: Service Worker registration file not found" >> $REPORT_FILE
  echo "**Action Required**: Create Service Worker registration file" >> $REPORT_FILE
fi

# Check for iOS PWA meta tags
echo "" >> $REPORT_FILE
echo "## iOS PWA Support" >> $REPORT_FILE
if grep -q "apple-mobile-web-app" ./public/index.html 2>/dev/null; then
  echo "✅ **Found**: iOS PWA meta tags in index.html" >> $REPORT_FILE
  
  # Check specific iOS meta tags
  if grep -q "apple-mobile-web-app-capable" ./public/index.html; then
    echo "- ✅ Has apple-mobile-web-app-capable meta tag" >> $REPORT_FILE
  else
    echo "- ❌ Missing apple-mobile-web-app-capable meta tag" >> $REPORT_FILE
  fi
  
  if grep -q "apple-mobile-web-app-status-bar-style" ./public/index.html; then
    echo "- ✅ Has apple-mobile-web-app-status-bar-style meta tag" >> $REPORT_FILE
  else
    echo "- ❌ Missing apple-mobile-web-app-status-bar-style meta tag" >> $REPORT_FILE
  fi
  
  if grep -q "apple-touch-icon" ./public/index.html; then
    echo "- ✅ Has apple-touch-icon link tags" >> $REPORT_FILE
  else
    echo "- ❌ Missing apple-touch-icon link tags" >> $REPORT_FILE
  fi
else
  echo "❌ **Missing**: No iOS PWA meta tags found in index.html" >> $REPORT_FILE
  echo "**Action Required**: Add iOS PWA meta tags to index.html" >> $REPORT_FILE
fi

# Check for splash screen images
echo "" >> $REPORT_FILE
echo "## Splash Screens" >> $REPORT_FILE
SPLASH_COUNT=$(find ./public -name "*splash*" | wc -l)
if [[ "$SPLASH_COUNT" -gt 0 ]]; then
  echo "✅ **Found**: $SPLASH_COUNT splash screen images" >> $REPORT_FILE
else
  echo "❌ **Missing**: No splash screen images found" >> $REPORT_FILE
  echo "**Action Required**: Create splash screen images for various device sizes" >> $REPORT_FILE
fi

# Check for CSP headers
echo "" >> $REPORT_FILE
echo "## Content Security Policy" >> $REPORT_FILE
if grep -q "Content-Security-Policy" ./public/index.html 2>/dev/null; then
  echo "✅ **Found**: CSP meta tag in index.html" >> $REPORT_FILE
else
  echo "❌ **Missing**: No CSP meta tag found in index.html" >> $REPORT_FILE
  echo "**Action Required**: Add CSP meta tag to index.html" >> $REPORT_FILE
fi

echo "PWA completeness check complete! Report saved to $REPORT_FILE"