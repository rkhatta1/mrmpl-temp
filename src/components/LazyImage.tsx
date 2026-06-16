// @ts-nocheck
"use client";
import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Skeleton placeholder that clearly indicates an image is loading.
 */
const ImageSkeleton = ({ className = '' }) => (
  <div
    className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100 animate-pulse rounded-[inherit] ${className}`}
    aria-hidden="true"
  >
    <Loader2 className="h-8 w-8 text-gray-300 animate-spin" aria-hidden />
    <span className="text-xs text-gray-400 font-medium">Loading image…</span>
  </div>
);

/**
 * Optimized LazyImage component with lazy loading and error handling.
 * Uses a neutral skeleton placeholder while loading (no logo) for a cleaner look.
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - Additional CSS classes
 * @param {string} placeholder - Placeholder image URL for error fallback only (optional)
 * @param {boolean} eager - Load immediately (for above-fold images)
 * @param {string} sizes - Responsive image sizes attribute
 * @param {object} style - Inline styles
 */
const LazyImage = ({
  src,
  alt = '',
  className = '',
  placeholder = '/optimized/site/logo-86.webp',
  eager = false,
  sizes,
  style = {},
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(eager && src ? src : '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // If eager loading is enabled, load immediately
    if (eager) {
      setImageSrc(src);
      return;
    }

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      setImageSrc(src);
      return;
    }

    // Observe the container (always in DOM); when visible, set src so the img loads
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, [src, eager]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) {
      onError(e);
    } else {
      setImageSrc(placeholder);
    }
  };

  // Error state: show neutral "image unavailable" instead of stretched logo
  if (hasError && imageSrc === placeholder) {
    return (
      <div
        className={`relative flex items-center justify-center bg-gray-100 ${className}`}
        style={style}
      >
        <div className="text-center text-gray-400 p-4">
          <div className="text-2xl mb-1 opacity-60">🖼️</div>
          <div className="text-xs">Image unavailable</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} style={style}>
      {/* Skeleton visible until image is loaded */}
      {!isLoaded && <ImageSkeleton />}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className={`relative z-10 block ${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          style={style}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      ) : (
        <ImageSkeleton />
      )}
    </div>
  );
};

export default LazyImage;
