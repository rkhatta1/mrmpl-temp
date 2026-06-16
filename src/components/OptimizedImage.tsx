// @ts-nocheck
"use client";
import { useState } from 'react';
import LazyImage from './LazyImage';

/**
 * OptimizedImage component with responsive image support and optimization
 * Automatically generates srcset for different screen sizes
 * 
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text
 * @param {string} className - CSS classes
 * @param {boolean} eager - Load immediately (for above-fold content)
 * @param {string} aspectRatio - Aspect ratio (e.g., "16/9", "1/1")
 * @param {string} objectFit - CSS object-fit property (default: 'cover', can be 'contain')
 * @param {object} sizes - Object with breakpoints and sizes
 */
const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  eager = false,
  aspectRatio,
  objectFit = 'cover',
  sizes = {
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw'
  },
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  // Generate srcset for responsive images (if needed in future)
  // For now, we'll use the single src with proper lazy loading
  const handleError = (e) => {
    setImageError(true);
    if (props.onError) {
      props.onError(e);
    }
  };

  const containerStyle = aspectRatio
    ? {
        aspectRatio: aspectRatio,
        overflow: 'hidden'
      }
    : {};

  // If objectFit is 'contain' and no aspectRatio, don't force full width/height
  const wrapperClassName = aspectRatio 
    ? `relative ${className}`
    : objectFit === 'contain' 
      ? `relative ${className} w-auto h-auto`
      : `relative ${className}`;

  return (
    <div className={wrapperClassName} style={containerStyle}>
      {!imageError ? (
        <LazyImage
          src={src}
          alt={alt}
          className={`w-full h-full object-${objectFit}`}
          eager={eager}
          sizes={sizes ? `${sizes.mobile}, (min-width: 768px) ${sizes.tablet}, (min-width: 1024px) ${sizes.desktop}` : undefined}
          onError={handleError}
          {...props}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-xs">Image not available</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

