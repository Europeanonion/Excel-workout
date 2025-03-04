// Debug tracking hook for React components
import { useEffect } from 'react';

/**
 * Hook to track component renders in debug tools
 * @param {string} componentName - Name of the component to track
 */
export const useDebugTracking = (componentName) => {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'production' && window.__EXCEL_WORKOUT_DEBUG__) {
      window.__EXCEL_WORKOUT_DEBUG__.trackComponentRenders(componentName);
    }
  });
};
