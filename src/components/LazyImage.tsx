// @ts-nocheck
"use client";
import { useState, useRef, useEffect, type ImgHTMLAttributes } from 'react';
import { useSiteMediaUrl } from "@/contexts/SiteMediaContext";
import { DEFAULT_IMAGE_PLACEHOLDER } from "@/generated/default-image-placeholder";

type LazyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  blurDataURL?: string;
  eager?: boolean;
  fallbackSrc?: string;
  placeholder?: string;
  src?: string;
};

/**
 * Skeleton placeholder that clearly indicates an image is loading.
 */
const ImageSkeleton = ({
  blurDataURL = DEFAULT_IMAGE_PLACEHOLDER,
  className = '',
}) => (
  <div
    data-image-placeholder=""
    className={`absolute inset-0 overflow-hidden bg-gray-100 rounded-[inherit] ${className}`}
    aria-hidden="true"
  >
    <div
      className="absolute -inset-1 scale-110 bg-cover bg-center blur-md"
      style={{ backgroundImage: `url("${blurDataURL}")` }}
    />
    <div className="absolute inset-0 animate-pulse bg-white/10" />
  </div>
);

/**
 * Optimized LazyImage component with lazy loading and error handling.
 * Uses a Bun-generated low-quality placeholder while loading.
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
  blurDataURL = DEFAULT_IMAGE_PLACEHOLDER,
  fallbackSrc = undefined,
  eager = false,
  sizes = undefined,
  style = {},
  onLoad = undefined,
  onError = undefined,
  ...props
}: LazyImageProps) => {
  const resolvedSrc = useSiteMediaUrl(src);
  const resolvedFallbackSrc = useSiteMediaUrl(fallbackSrc);
  const [imageSrc, setImageSrc] = useState(eager && resolvedSrc ? resolvedSrc : '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setImageSrc(eager && resolvedSrc ? resolvedSrc : '');
    if (!resolvedSrc) return;

    // If eager loading is enabled, load immediately
    if (eager) {
      setImageSrc(resolvedSrc);
      return;
    }

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      setImageSrc(resolvedSrc);
      return;
    }

    // Observe the container (always in DOM); when visible, set src so the img loads
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(resolvedSrc);
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
  }, [resolvedSrc, eager]);

  useEffect(() => {
    const image = imageRef.current;

    // Eager or cached images can finish before React attaches the load handler.
    if (imageSrc && image?.complete && image.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [imageSrc]);

  const handleLoad = (event) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(event);
    }
  };

  const handleError = (e) => {
    if (resolvedFallbackSrc && imageSrc !== resolvedFallbackSrc) {
      setIsLoaded(false);
      setImageSrc(resolvedFallbackSrc);
      return;
    }

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

  const intrinsicWidth = Number(props.width);
  const intrinsicHeight = Number(props.height);
  const containerStyle = intrinsicWidth > 0 && intrinsicHeight > 0
    ? { aspectRatio: `${intrinsicWidth} / ${intrinsicHeight}`, ...style }
    : style;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} style={containerStyle}>
      {/* Skeleton visible until image is loaded */}
      {!isLoaded && <ImageSkeleton blurDataURL={blurDataURL} />}
      {imageSrc && (
        <img
          ref={imageRef}
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
      )}
    </div>
  );
};

export default LazyImage;
