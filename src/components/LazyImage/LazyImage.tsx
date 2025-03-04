import React, { useState, useEffect } from 'react';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import './LazyImage.css';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholderSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

/**
 * LazyImage component that only loads images when they enter the viewport
 * Uses the IntersectionObserver API for efficient lazy loading
 */
const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  placeholderSrc, 
  className,
  style,
  width,
  height
}) => {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const { targetRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '200px' // Pre-load when image is within 200px of viewport
  });
  
  useEffect(() => {
    if (isIntersecting) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        // Keep showing placeholder if there is one
      };
    }
  }, [isIntersecting, src]);
  
  return (
    <div 
      ref={targetRef as React.RefObject<HTMLDivElement>} 
      className={`lazy-image-container ${!isLoaded ? 'loading' : ''}`}
      style={{ 
        width: width || 'auto',
        height: height || 'auto',
        background: '#f0f0f0'
      }}
    >
      {!isLoaded && !placeholderSrc && (
        <div className="lazy-image-placeholder" />
      )}
      
      <img 
        src={imageSrc || placeholderSrc} 
        alt={alt} 
        className={`${className || ''} ${isLoaded ? 'loaded' : ''}`}
        style={{
          ...style,
          opacity: isLoaded ? 1 : (placeholderSrc ? 0.5 : 0)
        }}
      />
    </div>
  );
};

export default LazyImage;