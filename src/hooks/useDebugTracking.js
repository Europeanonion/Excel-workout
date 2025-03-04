// Debug tracking hook for React components
import { useEffect, useRef } from 'react';

/**
 * Hook to track component renders in debug tools
 * @param {string} componentName - Name of the component to track
 * @param {Object} props - Component props to track changes
 * @param {Object} state - Component state to track changes (from useState)
 */
export const useDebugTracking = (componentName, props = {}, state = {}) => {
  // Store previous props and state for comparison
  const prevPropsRef = useRef(props);
  const prevStateRef = useRef(state);
  
  // Track initial mount
  const mountedRef = useRef(false);
  
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'production' && window.__EXCEL_WORKOUT_DEBUG__) {
      if (!mountedRef.current) {
        // First render (mount)
        window.__EXCEL_WORKOUT_DEBUG__.trackComponentRenders(componentName, {
          type: 'mount',
          props,
          state
        });
        mountedRef.current = true;
      } else {
        // Subsequent renders
        const propChanges = getObjectChanges(prevPropsRef.current, props);
        const stateChanges = getObjectChanges(prevStateRef.current, state);
        
        window.__EXCEL_WORKOUT_DEBUG__.trackComponentRenders(componentName, {
          type: 'update',
          propChanges: propChanges.length > 0 ? propChanges : null,
          stateChanges: stateChanges.length > 0 ? stateChanges : null,
          props,
          state
        });
      }
      
      // Update refs with current values
      prevPropsRef.current = props;
      prevStateRef.current = state;
    }
    
    // Cleanup on unmount
    return () => {
      if (process.env.NODE_ENV !== 'production' && window.__EXCEL_WORKOUT_DEBUG__ && mountedRef.current) {
        window.__EXCEL_WORKOUT_DEBUG__.trackComponentRenders(componentName, {
          type: 'unmount'
        });
      }
    };
  }, [componentName, props, state]); // Track changes to props and state
};

/**
 * Helper to detect changes between objects
 * @param {Object} prev - Previous object
 * @param {Object} current - Current object
 * @returns {Array} Array of changes with property names and values
 */
function getObjectChanges(prev, current) {
  const changes = [];
  
  // Check for added or changed properties
  Object.keys(current).forEach(key => {
    if (prev[key] !== current[key]) {
      changes.push({
        property: key,
        previous: prev[key],
        current: current[key],
        type: prev.hasOwnProperty(key) ? 'changed' : 'added'
      });
    }
  });
  
  // Check for removed properties
  Object.keys(prev).forEach(key => {
    if (!current.hasOwnProperty(key)) {
      changes.push({
        property: key,
        previous: prev[key],
        current: undefined,
        type: 'removed'
      });
    }
  });
  
  return changes;
}
