# Excel Workout PWA Debug Tools

## Setup Instructions

### For Development Environment:

1. Copy `window-debug-tools.js` to your `public` directory
2. For local development, add this script tag to `public/index.html` before the closing `</body>` tag:
   ```html
   <script src="window-debug-tools.js"></script>
   ```
3. Copy `useDebugTracking.js` to `src/hooks/` directory

## Usage

### In Browser Console:

```javascript
// Test if Web Workers are supported
window.__EXCEL_WORKOUT_DEBUG__.checkWorkerSupport()

// Measure performance of any operation
const endTimer = window.__EXCEL_WORKOUT_DEBUG__.logPerformance('Operation Name')
// ... do something ...
endTimer() // Will log the time taken

// Test Excel processing worker with a file
// First, select a file using file input
const fileInput = document.querySelector('input[type="file"]')
const file = fileInput.files[0]
// Then test the worker
window.__EXCEL_WORKOUT_DEBUG__.testWorker(file).then(result => console.log(result))

// View component render statistics
window.__EXCEL_WORKOUT_DEBUG__.componentTree
```

### In React Components:

```jsx
import { useDebugTracking } from '../hooks/useDebugTracking'

const MyComponent = () => {
  // Add this to track renders in development
  useDebugTracking('MyComponent')
  
  return <div>My Component</div>
}
```
