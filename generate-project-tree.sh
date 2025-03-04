#!/bin/bash
# filepath: /workspaces/Excel-workout/generate-project-tree.sh

# Create output directory
mkdir -p project-docs

echo "Generating project structure analysis..."

# Basic tree without node_modules, .git, build
echo "# Excel Workout PWA - Project Structure" > project-docs/project-structure.md
echo "Generated on $(date)" >> project-docs/project-structure.md
echo -e "\n## Directory Tree\n" >> project-docs/project-structure.md
echo "\`\`\`" >> project-docs/project-structure.md

# Try to use tree if available, otherwise use find
if command -v tree &> /dev/null; then
  tree -I "node_modules|.git|build" -L 5 >> project-docs/project-structure.md
else
  find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/build/*" | sort >> project-docs/project-structure.md
fi
echo "\`\`\`" >> project-docs/project-structure.md

# Add file counts
echo -e "\n## File Counts by Directory\n" >> project-docs/project-structure.md
echo "\`\`\`" >> project-docs/project-structure.md
find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/build/*" -print0 | while IFS= read -r -d '' dir; do
  count=$(find "$dir" -maxdepth 1 -type f | wc -l)
  echo "$dir: $count files" >> project-docs/project-structure.md
done
echo "\`\`\`" >> project-docs/project-structure.md

# Add file type statistics
echo -e "\n## File Types\n" >> project-docs/project-structure.md
echo "\`\`\`" >> project-docs/project-structure.md
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/build/*" | grep -v "^\./\." | sed 's/.*\.//' | sort | uniq -c | sort -nr >> project-docs/project-structure.md
echo "\`\`\`" >> project-docs/project-structure.md

# React component analysis
echo -e "\n## React Components\n" >> project-docs/project-structure.md
echo "\`\`\`" >> project-docs/project-structure.md
find ./src -type f -name "*.tsx" | grep -v "test\|spec" | sort >> project-docs/project-structure.md
echo "\`\`\`" >> project-docs/project-structure.md

# Performance optimization analysis
echo -e "\n## Performance Optimizations\n" >> project-docs/project-structure.md
echo "\`\`\`" >> project-docs/project-structure.md
echo "Lazy Loaded Components:" >> project-docs/project-structure.md
grep -r "React.lazy\|lazy(" --include="*.tsx" --include="*.ts" ./src | wc -l >> project-docs/project-structure.md

echo -e "\nDynamic Imports:" >> project-docs/project-structure.md
grep -r "import(" --include="*.tsx" --include="*.ts" ./src | wc -l >> project-docs/project-structure.md

echo -e "\nMemoized Components:" >> project-docs/project-structure.md
grep -r "React.memo\|memo(" --include="*.tsx" --include="*.ts" ./src | wc -l >> project-docs/project-structure.md

echo -e "\nuseCallback Hooks:" >> project-docs/project-structure.md
grep -r "useCallback" --include="*.tsx" --include="*.ts" ./src | wc -l >> project-docs/project-structure.md
echo "\`\`\`" >> project-docs/project-structure.md

# PWA features analysis
echo -e "\n## PWA Features\n" >> project-docs/project-structure.md
echo "Service Worker Implementation:" >> project-docs/project-structure.md
echo "\`\`\`" >> project-docs/project-structure.md
if [ -f "./src/serviceWorker.ts" ] || [ -f "./src/serviceWorkerRegistration.js" ]; then
  echo "✅ Service Worker implementation found" >> project-docs/project-structure.md
else
  echo "❌ No Service Worker implementation found" >> project-docs/project-structure.md
fi
echo "\`\`\`" >> project-docs/project-structure.md

echo -e "\nWeb App Manifest:" >> project-docs/project-structure.md
echo "\`\`\`" >> project-docs/project-structure.md
if [ -f "./public/manifest.json" ]; then
  echo "✅ Web App Manifest found" >> project-docs/project-structure.md
  echo -e "\nManifest Contents:" >> project-docs/project-structure.md
  cat ./public/manifest.json >> project-docs/project-structure.md
else
  echo "❌ No Web App Manifest found" >> project-docs/project-structure.md
fi
echo "\`\`\`" >> project-docs/project-structure.md

echo "Project structure analysis completed. See project-docs/project-structure.md"