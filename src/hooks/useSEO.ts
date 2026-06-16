// @ts-nocheck
import { useEffect } from 'react';

const BASE_URL = 'https://www.mayankrawmint.com';
const DEFAULT_IMAGE = '/optimized/site/logo-86.webp';
const SITE_NAME = 'Mayank Raw Mint';

/**
 * Helper function to get or create a meta tag
 */
const getOrCreateMetaTag = (attribute, value, content) => {
  let tag = document.querySelector(`meta[${attribute}="${value}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, value);
    document.head.appendChild(tag);
  }
  return tag;
};

/**
 * Helper function to get or create a link tag
 */
const getOrCreateLinkTag = (rel) => {
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  return tag;
};

/**
 * Custom hook to set comprehensive SEO meta tags
 * @param {string} title - Page title
 * @param {string} description - Meta description
 * @param {object} options - Additional SEO options
 * @param {string} options.image - Open Graph image URL
 * @param {string} options.url - Canonical URL (defaults to current path)
 * @param {string} options.type - Open Graph type (default: 'website')
 * @param {object} options.structuredData - JSON-LD structured data object
 */
export const useSEO = (title, description, options = {}) => {
  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const {
      image = DEFAULT_IMAGE,
      url = window.location.pathname,
      type = 'website',
      structuredData = null
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

    // Set document title
    document.title = title;

    // Meta Description
    const metaDescription = getOrCreateMetaTag('name', 'description', description);
    metaDescription.setAttribute('content', description);

    // Open Graph Tags
    getOrCreateMetaTag('property', 'og:title', title).setAttribute('content', title);
    getOrCreateMetaTag('property', 'og:description', description).setAttribute('content', description);
    getOrCreateMetaTag('property', 'og:image', imageUrl).setAttribute('content', imageUrl);
    getOrCreateMetaTag('property', 'og:url', fullUrl).setAttribute('content', fullUrl);
    getOrCreateMetaTag('property', 'og:type', type).setAttribute('content', type);
    getOrCreateMetaTag('property', 'og:site_name', SITE_NAME).setAttribute('content', SITE_NAME);

    // Twitter Card Tags
    getOrCreateMetaTag('name', 'twitter:card', 'summary_large_image').setAttribute('content', 'summary_large_image');
    getOrCreateMetaTag('name', 'twitter:title', title).setAttribute('content', title);
    getOrCreateMetaTag('name', 'twitter:description', description).setAttribute('content', description);
    getOrCreateMetaTag('name', 'twitter:image', imageUrl).setAttribute('content', imageUrl);

    // Canonical URL
    const canonicalLink = getOrCreateLinkTag('canonical');
    canonicalLink.setAttribute('href', fullUrl);

    // Structured Data (JSON-LD)
    if (structuredData) {
      // Remove existing structured data script if any
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      document.title = 'Mayank Raw Mint';
    };
  }, [title, description, options]);
};
