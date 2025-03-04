import { useEffect, useRef, useState } from 'react';

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Custom hook that uses the Intersection Observer API to detect when an element enters the viewport
 * 
 * @param options - IntersectionObserver options
 * @returns Object containing a ref to attach to the target element and a boolean indicating if it's in view
 */
export const useIntersectionObserver = (
  options: IntersectionObserverOptions = {}
) => {
  const targetRef = useRef<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    // Skip if IntersectionObserver is not supported
    if (!('IntersectionObserver' in window)) {
      // Fallback - just assume the element is visible
      setIsIntersecting(true);
      return;
    }
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
    
    const currentTarget = targetRef.current;
    
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [options.root, options.rootMargin, options.threshold]);
  
  return { targetRef, isIntersecting };
};

export default useIntersectionObserver;