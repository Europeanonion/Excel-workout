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

// Reset component tracking for a specific component
window.__EXCEL_WORKOUT_DEBUG__.resetComponentTracking('ComponentName')

// Reset tracking for all components
window.__EXCEL_WORKOUT_DEBUG__.resetComponentTracking()

// View detailed render history for a component
window.__EXCEL_WORKOUT_DEBUG__.componentTree['ComponentName'].renderHistory

// Check memory usage during worker operations
// (Only available in browsers that support performance.memory API)
```

### In React Components:

```jsx
import { useDebugTracking } from '../hooks/useDebugTracking'

const MyComponent = () => {
  // Basic usage - just track renders
  useDebugTracking('MyComponent')
  
  return <div>My Component</div>
}

// Advanced usage - track props and state changes
const AdvancedComponent = (props) => {
  const [count, setCount] = useState(0)
  
  // Track both props and state
  useDebugTracking('AdvancedComponent', props, { count })
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

## Worker Performance Monitoring

The debug tools now include enhanced worker performance monitoring:

1. **Timeout Protection**: Workers automatically timeout after 60 seconds (configurable)
2. **Memory Usage Tracking**: For browsers that support the Performance API
3. **Detailed Error Reporting**: Stack traces and context information for debugging

Example with custom timeout:

```javascript
// Test worker with a custom timeout (30 seconds)
const file = fileInput.files[0]
window.__EXCEL_WORKOUT_DEBUG__.testWorker(file, progress => {
  console.log(`Progress: ${progress}%`)
}, { timeout: 30000 }).then(result => console.log(result))
```

## Component Render Analysis

The enhanced component tracking provides:

1. **Render Type Detection**: Mount, update, and unmount events
2. **Change Detection**: Identifies which props or state values triggered a re-render
3. **Render History**: Maintains a history of the last 10 renders for each component
4. **Performance Metrics**: Track render counts and patterns to identify optimization opportunities
