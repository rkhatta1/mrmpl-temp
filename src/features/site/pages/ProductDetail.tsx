// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@/lib/next-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  Thermometer, Wind, Droplets, Zap, Car, Wrench,
  Gauge, Leaf, Settings, ChevronLeft, ChevronRight,
  ArrowUp, ChevronDown, CheckCircle,
  FileText, Shield, Ruler, BadgeCheck,
  Gauge as GaugeIcon, Waves, Snowflake, Cog
} from 'lucide-react';
import Header from '@/components/Header';
import CompareButton from '@/components/CompareButton';
import { getApplicationsByValues, SECTORS, APPLICATION_OPTIONS } from '@/constants/applications';
import OptimizedImage from '@/components/OptimizedImage';
import LazyImage from '@/components/LazyImage';
import { getProductImageFallbackSrc, getProductImageSources, preferOptimizedProductImage } from '@/lib/image-assets';
import { getPublicApiBaseUrl } from '@/lib/api-base-url';


const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [assemblyProducts, setAssemblyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assemblyLoading, setAssemblyLoading] = useState(false);
  const [assembledWithFormatted, setAssembledWithFormatted] = useState(null);
  const [assembledWithData, setAssembledWithData] = useState([]);
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [isSpecsOpen, setIsSpecsOpen] = useState(true);
  const [isDimensionsOpen, setIsDimensionsOpen] = useState(true);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [isAssembliesOpen, setIsAssembliesOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    companyName: '',
    email: '',
    quantity: '',
    message: ''
  });

  // Helper function to check if a parameter should be hidden
  const shouldHideParameter = (value) => {
    if (!value) return true;
    if (typeof value === 'string') {
      const trimmedValue = value.trim().toLowerCase();
      return trimmedValue === '' ||
        trimmedValue === 'na' ||
        trimmedValue === 'n/a' ||
        trimmedValue === 'not available' ||
        trimmedValue === '—' ||
        trimmedValue === '-' ||
        trimmedValue === 'null' ||
        trimmedValue === 'undefined';
    }
    return false;
  };

  // Helper function to format connections
  const formatConnections = (connections) => {
    if (!connections || shouldHideParameter(connections)) return null;
    
    const trimmed = connections.trim();
    if (!trimmed) return null;

    // Check if it contains semicolon - split and format
    if (trimmed.includes(';')) {
      const parts = trimmed.split(';').map(part => part.trim()).filter(part => part);
      if (parts.length > 0) {
        return parts.map((part, index) => (
          <div key={index} className="mb-1">
            Connection {index + 1}: {part}
          </div>
        ));
      }
    }
    
    // No semicolon - show as Connection 1
    return <div>Connection 1: {trimmed}</div>;
  };

  // Helper function to format assembled with products
  const formatAssembledWith = (assembledData) => {
    if (!assembledData || assembledData.length === 0) return null;
    
    return (
      <div className="space-y-1">
        {assembledData.map((item, index) => (
          <div key={index} className="text-base">
            {item.productName ? (
              <span>
                Part code: <span className="font-semibold">{item.partCode}</span> - {item.productName}
              </span>
            ) : (
              <span>
                Part code: <span className="font-semibold">{item.partCode}</span>
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Fetch and format assembled with product
  const fetchAssembledWithProduct = async (assemblies) => {
    if (!assemblies || shouldHideParameter(assemblies)) {
      setAssembledWithFormatted(null);
      setAssembledWithData([]);
      return;
    }
    
    const trimmed = assemblies.trim();
    if (!trimmed) {
      setAssembledWithFormatted(null);
      setAssembledWithData([]);
      return;
    }

    // Handle multiple part codes separated by semicolons or commas
    // Split by semicolon first, then by comma if no semicolon found
    const separator = trimmed.includes(';') ? ';' : ',';
    const partCodes = trimmed.split(separator).map(code => code.trim()).filter(code => code);
    
    if (partCodes.length === 0) {
      setAssembledWithFormatted(null);
      setAssembledWithData([]);
      return;
    }

    // Fetch product details for all part codes
      const apiUrl = getPublicApiBaseUrl();
    const productPromises = partCodes.map(async (partCode) => {
      try {
      const response = await fetch(`${apiUrl}/products/by-part-code/${encodeURIComponent(partCode)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
            return {
              partCode,
              productName: data.data.productName || null
            };
        }
      }
    } catch (error) {
      console.error(`Error fetching product with part code ${partCode}:`, error);
    }
      return { partCode, productName: null };
    });

    const results = await Promise.all(productPromises);
    setAssembledWithData(results);
    
    // Also keep the formatted string for backward compatibility
    const formattedParts = results.map(({ partCode, productName }) => {
      if (productName) {
        return `${partCode} - ${productName}`;
      }
      return partCode;
    });

    if (formattedParts.length > 0) {
      setAssembledWithFormatted(`Part code: ${formattedParts.join('; ')}`);
    } else {
      setAssembledWithFormatted(`Part code: ${partCodes.join('; ')}`);
    }
  };

  // Degree sign constant for cross-platform compatibility
  const DEGREE_SIGN = '\u00B0';

  // Helper function to format temperature range
  const formatTemperatureRange = (temperatureRange) => {
    if (!temperatureRange) return '';

    // Normalize degree signs in the input string for matching
    const normalizedRange = temperatureRange.replace(/°|&deg;|\u00B0/g, DEGREE_SIGN);

    // Check if it contains semicolon - split and display on new lines
    if (normalizedRange.includes(';')) {
      const parts = normalizedRange.split(';').map(part => part.trim()).filter(part => part);
      if (parts.length > 1) {
        return (
          <div>
            {parts.map((part, index) => (
              <div key={index}>{part}</div>
            ))}
          </div>
        );
      }
    }

    // Check if it contains both Celsius and Fahrenheit
    // Escape the degree sign for regex
    const escapedDegree = DEGREE_SIGN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const celsiusPattern = new RegExp(`${escapedDegree}C`, 'g');
    const fahrenheitPattern = new RegExp(`${escapedDegree}F`, 'g');
    
    if (celsiusPattern.test(normalizedRange) && fahrenheitPattern.test(normalizedRange)) {
      // Use regex to extract Celsius and Fahrenheit ranges separately
      const celsiusMatch = normalizedRange.match(new RegExp(`(-?\\d+(?:\\.\\d+)?${escapedDegree}C\\s*to\\s*[+-]?\\d+(?:\\.\\d+)?${escapedDegree}C)`));
      const fahrenheitMatch = normalizedRange.match(new RegExp(`(-?\\d+(?:\\.\\d+)?${escapedDegree}F\\s*to\\s*[+-]?\\d+(?:\\.\\d+)?${escapedDegree}F)`));

      if (celsiusMatch && fahrenheitMatch) {
        return (
          <div>
            <div>{celsiusMatch[1]}</div>
            <div>{fahrenheitMatch[1]}</div>
          </div>
        );
      }
    }

    // If only Celsius is present, check if we need to add Fahrenheit
    if (celsiusPattern.test(normalizedRange) && !fahrenheitPattern.test(normalizedRange)) {
      // Try to convert Celsius to Fahrenheit if it's a range
      const celsiusMatch = normalizedRange.match(new RegExp(`(-?\\d+(?:\\.\\d+)?)${escapedDegree}C\\s*to\\s*([+-]?\\d+(?:\\.\\d+)?)${escapedDegree}C`));
      if (celsiusMatch) {
        const minC = parseFloat(celsiusMatch[1]);
        const maxC = parseFloat(celsiusMatch[2]);

        // Convert to Fahrenheit
        const minF = Math.round((minC * 9 / 5) + 32);
        const maxF = Math.round((maxC * 9 / 5) + 32);

        return (
          <div>
            <div>{normalizedRange}</div>
            <div>{minF}{DEGREE_SIGN}F to {maxF}{DEGREE_SIGN}F</div>
          </div>
        );
      }
    }

    return normalizedRange;
  };

  // Helper function to format pressure rating
  const formatPressureRating = (pressureRating) => {
    if (!pressureRating) return '';

    // Check if it contains semicolon - split and display on new lines
    // This preserves the original format including "Up to" and maintains case sensitivity
    if (pressureRating.includes(';')) {
      const parts = pressureRating.split(';').map(part => part.trim()).filter(part => part);
      if (parts.length > 1) {
        return (
          <div>
            {parts.map((part, index) => (
              <div key={index}>{part}</div>
            ))}
          </div>
        );
      }
    }

    // Use regex to extract PSI and BAR values separately (case-sensitive)
    // Match full patterns like "Up to 150 PSI" or "150 PSI" or "Up to 10 BAR" or "10 BAR"
    // Case-sensitive matching to preserve original case
    const psiPattern = /([^;]*?\d+(?:\.\d+)?\s*PSI[^;]*?)(?:;|$)/;
    const barPattern = /([^;]*?\d+(?:\.\d+)?\s*BAR[^;]*?)(?:;|$)/;
    
    const psiMatch = pressureRating.match(psiPattern);
    const barMatch = pressureRating.match(barPattern);

    if (psiMatch && barMatch) {
      // If both PSI and BAR are found, display them on separate lines with original format
      return (
        <div>
          <div>{psiMatch[1].trim()}</div>
          <div>{barMatch[1].trim()}</div>
        </div>
      );
    }

    return pressureRating;
  };

  // Fetch real product data from API
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const apiUrl = getPublicApiBaseUrl();
      const response = await fetch(`${apiUrl}/products/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const productData = data.data;

        // Process images - ensure drawing is always second (by URL or by index)
        let processedImages = [];
        if (productData.images && productData.images.length > 0) {
          const getUrl = (img) => typeof img === 'string' ? img : (img?.url || img?.src || img?.path || img?.imageUrl || img?.link || '');
          const rawUrls = productData.images.map(getUrl).filter(Boolean);
          let photos = rawUrls.filter(url => !url.includes('drawing') && !url.includes('technical'));
          let drawings = rawUrls.filter(url => url.includes('drawing') || url.includes('technical'));
          if (drawings.length === 0 && rawUrls.length >= 2) {
            photos = rawUrls.slice(0, 1);
            drawings = rawUrls.slice(1, 2);
          }
          photos.forEach((photo, index) => {
            processedImages.push({ ...getProductImageSources(photo, productData.partCode, index, 'large'), type: 'photo', alt: `${productData.productName} product photo` });
          });
          drawings.forEach((drawing, index) => {
            processedImages.push({ ...getProductImageSources(drawing, productData.partCode, index + 1, 'large'), type: 'drawing', alt: `${productData.productName} technical drawing` });
          });
        }

        // If no images, add placeholder
        if (processedImages.length === 0) {
          processedImages = [
            {
              src: '/src/assets/products/placeholder.jpg',
              type: 'photo',
              alt: 'Product image not available'
            }
          ];
        }

        // Process applications from the API data
        const processedApplications = [];
        if (productData.applications && Array.isArray(productData.applications)) {
          productData.applications.forEach((app, index) => {
            // Handle both old format (string) and new format (object with icon)
            if (typeof app === 'string') {
              // String format - use fallback icons
              const fallbackIcons = [
                { icon: Droplets, color: 'text-blue-600' },
                { icon: Wind, color: 'text-sky-600' },
                { icon: Zap, color: 'text-red-600' },
                { icon: Snowflake, color: 'text-cyan-600' },
                { icon: Cog, color: 'text-green-600' }
              ];
              const iconData = fallbackIcons[index % fallbackIcons.length];
              processedApplications.push({
                name: app,
                icon: iconData.icon,
                color: iconData.color
              });
            } else if (typeof app === 'object' && app.name) {
              // Object format - convert to string and use fallback icons
              const fallbackIcons = [
                { icon: Droplets, color: 'text-blue-600' },
                { icon: Wind, color: 'text-sky-600' },
                { icon: Zap, color: 'text-red-600' },
                { icon: Snowflake, color: 'text-cyan-600' },
                { icon: Cog, color: 'text-green-600' }
              ];
              const iconData = fallbackIcons[index % fallbackIcons.length];
              processedApplications.push({
                name: app.name,
                icon: iconData.icon,
                color: iconData.color
              });
            }
          });
        }

        // Process dimensions
        const processedDimensions = [];
        if (productData.dimensions && Array.isArray(productData.dimensions)) {
          productData.dimensions.forEach(dim => {
            processedDimensions.push({
              parameter: dim.parameter || 'N/A',
              value: dim.value || '—',
              notes: dim.notes || ''
            });
          });
        }

        // Process compliance/certifications
        const processedCompliance = [];
        if (productData.certifications && Array.isArray(productData.certifications)) {
          const complianceIcons = [
            { icon: CheckCircle },
            { icon: FileText },
            { icon: Shield }
          ];

          productData.certifications.forEach((cert, index) => {
            const iconData = complianceIcons[index % complianceIcons.length];
            processedCompliance.push({
              name: cert,
              icon: iconData.icon
            });
          });
        }

        // Create the processed product object
        const processedProduct = {
          id: productData._id,
          name: productData.productName || 'Product Name Not Available',
          category: productData.category?.name || 'Category Not Available',
          categoryId: productData.category?._id || null,
          subCategory: productData.subCategory?.name || 'Subcategory Not Available',
          subCategoryId: productData.subCategory?._id || null,
          size: productData.size || 'Size Not Available',
          catalogueCode: productData.partCode || 'Part Code Not Available',
          grade: productData.grade || 'Grade Not Available',
          material: productData.material || 'Material Not Available',
          type: productData.type,
          plating: productData.finishPlating,
          sealant: productData.sealant,
          temperatureRange: productData.temperature || 'Temperature Range Not Available',
          pressureRating: productData.pressure || 'Pressure Rating Not Available',
          description: productData.description,
          images: processedImages,
          threadStandard: productData.threadStandard,
          connections: productData.connections,
          applications: processedApplications,
          dimensions: processedDimensions,
          compliance: processedCompliance,
          assemblies: productData.assemblies || '',
          additionalNotes: productData.additionalNotes || []
        };

        setProduct(processedProduct);

        // Process related products if available
        if (data.relatedProducts && Array.isArray(data.relatedProducts)) {
          const processedRelatedProducts = data.relatedProducts.map(related => ({
            id: related._id,
            name: related.productName || 'Product Name Not Available',
            image: preferOptimizedProductImage(
              related.images && related.images.length > 0 ? related.images[0] : '/src/assets/products/placeholder.jpg',
              related.partCode,
              0,
              'card'
            ),
            imageFallbackSrc: getProductImageFallbackSrc(
              related.images && related.images.length > 0 ? related.images[0] : '/src/assets/products/placeholder.jpg',
              related.partCode,
              0,
              'card'
            ),
            category: related.category?.name || 'Category Not Available',
            subCategory: related.subCategory?.name || 'Subcategory Not Available',
            partCode: related.partCode || 'Part Code Not Available'
          }));
          setRelatedProducts(processedRelatedProducts);
        } else {
          setRelatedProducts([]);
        }
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      // Clear assembled with data when product ID changes
      setAssembledWithFormatted(null);
      setAssembledWithData([]);
      setAssemblyProducts([]);
      fetchProduct();
    }
  }, [id]);

  // Fetch assembly products when product is loaded
  useEffect(() => {
    if (product && product.assemblies) {
      fetchAssemblyProducts(product.assemblies);
    } else {
      setAssemblyProducts([]);
    }
  }, [product]);

  // Fetch and format assembled with product for display
  useEffect(() => {
    if (product && product.assemblies) {
      fetchAssembledWithProduct(product.assemblies);
    } else {
      setAssembledWithFormatted(null);
      setAssembledWithData([]);
    }
  }, [product]);

  // Dynamic SEO based on product data
  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (product) {
      // Remove existing structured data scripts
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());
      // Build SEO title (max ~60 characters for optimal display)
      const titleParts = [product.name];
      if (product.material && product.material !== 'Material Not Available' && product.name.length < 40) {
        titleParts.push(product.material);
      }
      if (product.size && product.size !== 'Size Not Available' && titleParts.join(' ').length < 50) {
        titleParts.push(product.size);
      }
      titleParts.push('| Mayank Raw Mint');
      let seoTitle = titleParts.join(' ');
      // Truncate if too long (max 70 chars)
      if (seoTitle.length > 70) {
        seoTitle = product.name + ' | Mayank Raw Mint';
      }

      // Build SEO description (optimal: 150-160 characters)
      const descriptionParts = [];
      
      // Start with product name and key specs
      const keySpecs = [];
      if (product.material && product.material !== 'Material Not Available') {
        keySpecs.push(product.material);
      }
      if (product.size && product.size !== 'Size Not Available') {
        keySpecs.push(product.size);
      }
      if (product.category && product.category !== 'Category Not Available') {
        keySpecs.push(product.category);
      }
      
      if (keySpecs.length > 0) {
        descriptionParts.push(`${product.name} - ${keySpecs.join(', ')}.`);
      } else {
        descriptionParts.push(`${product.name}.`);
      }
      
      // Add description if available (truncate to fit)
      if (product.description) {
        const remainingChars = 155 - descriptionParts.join(' ').length - 20; // Reserve space for certification text
        if (remainingChars > 30) {
          const desc = product.description.length > remainingChars 
            ? product.description.substring(0, remainingChars - 3) + '...'
            : product.description;
          descriptionParts.push(desc);
        }
      }
      
      // Add certification
      descriptionParts.push('ISO 9001:2015 & NSF certified.');
      
      let seoDescription = descriptionParts.join(' ');
      
      // Ensure description is within optimal length (155-160 chars)
      if (seoDescription.length > 160) {
        seoDescription = seoDescription.substring(0, 157) + '...';
      }

      // Update SEO
      document.title = seoTitle;
      
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', seoDescription);

      // Add Product Structured Data (JSON-LD)
      const productStructuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description || seoDescription,
        "image": product.images && product.images.length > 0 
          ? product.images.map(img => img.src || img).filter(Boolean)
          : ["https://www.mayankrawmint.com/logo.png"],
        "brand": {
          "@type": "Brand",
          "name": "Mayank Raw Mint"
        },
        "manufacturer": {
          "@type": "Organization",
          "name": "Mayank Raw Mint Pvt. Ltd.",
          "url": "https://www.mayankrawmint.com"
        },
        "category": product.category || "Brass Fittings",
        "sku": product.catalogueCode || product.id,
        "offers": {
          "@type": "Offer",
          "url": `https://www.mayankrawmint.com/products/${product.id}`,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": "Mayank Raw Mint Pvt. Ltd."
          }
        },
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "Material",
            "value": product.material || "Brass"
          },
          {
            "@type": "PropertyValue",
            "name": "Size",
            "value": product.size || "N/A"
          },
          {
            "@type": "PropertyValue",
            "name": "Grade",
            "value": product.grade || "N/A"
          }
        ]
      };

      // Add material and pressure if available
      if (product.material && product.material !== 'Material Not Available') {
        productStructuredData.material = product.material;
      }
      if (product.pressureRating && product.pressureRating !== 'Pressure Rating Not Available') {
        productStructuredData.additionalProperty.push({
          "@type": "PropertyValue",
          "name": "Pressure Rating",
          "value": product.pressureRating
        });
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(productStructuredData);
      document.head.appendChild(script);
    } else {
      // Default SEO when product is loading or not found
      document.title = 'Product Details | Mayank Raw Mint';
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'View detailed specifications and information for our precision brass fittings. ISO 9001:2015 & NSF certified.');
      }
    }
  }, [product]);

  const openInquiryModal = () => {
    setShowInquiryModal(true);
  };

  const closeInquiryModal = () => {
    setShowInquiryModal(false);
    setInquiryForm({
      companyName: '',
      email: '',
      quantity: '',
      message: ''
    });
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the inquiry to your backend
    console.log('Inquiry submitted:', {
      product: product,
      inquiry: inquiryForm
    });

    // Show success message (you can use toast notification here)
    alert('Inquiry submitted successfully! We will contact you soon.');
    closeInquiryModal();
  };

  const handleInquiry = (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email address.');
      return;
    }

    alert('Inquiry sent! Our team will get back to you shortly.');
    setEmail('');
    setCompany('');
  };

  // Fetch assembly products by part codes
  const fetchAssemblyProducts = async (assembliesString) => {
    if (!assembliesString || assembliesString.trim() === '') {
      setAssemblyProducts([]);
      return;
    }

    try {
      setAssemblyLoading(true);
      // Handle both semicolon and comma separated part codes
      // Split by semicolon first, then by comma if no semicolon found
      const separator = assembliesString.includes(';') ? ';' : ',';
      const partCodes = assembliesString.split(separator).map(code => code.trim()).filter(code => code);

      if (partCodes.length === 0) {
        setAssemblyProducts([]);
        return;
      }

      const apiUrl = getPublicApiBaseUrl();
      const promises = partCodes.map(async (partCode) => {
        try {
          const response = await fetch(`${apiUrl}/products/by-part-code/${partCode}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              return data.data;
            }
          }
          return null;
        } catch (error) {
          console.error(`Error fetching product with part code ${partCode}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validProducts = results.filter(product => product !== null);

      // Process assembly products similar to main product
      const processedAssemblyProducts = validProducts.map(productData => {
        let processedImages = [];
        if (productData.images && productData.images.length > 0) {
          const getUrl = (img) => typeof img === 'string' ? img : (img?.url || img?.src || img?.path || img?.imageUrl || img?.link || '');
          const rawUrls = productData.images.map(getUrl).filter(Boolean);
          let photos = rawUrls.filter(url => !url.includes('drawing') && !url.includes('technical'));
          let drawings = rawUrls.filter(url => url.includes('drawing') || url.includes('technical'));
          if (drawings.length === 0 && rawUrls.length >= 2) {
            photos = rawUrls.slice(0, 1);
            drawings = rawUrls.slice(1, 2);
          }
          photos.forEach((photo, index) => {
            processedImages.push({ ...getProductImageSources(photo, productData.partCode, index, 'large'), type: 'photo', alt: `${productData.productName} product photo` });
          });
          drawings.forEach((drawing, index) => {
            processedImages.push({ ...getProductImageSources(drawing, productData.partCode, index + 1, 'large'), type: 'drawing', alt: `${productData.productName} technical drawing` });
          });
        }

        // Process dimensions for assembly products
        const processedDimensions = [];
        if (productData.dimensions && Array.isArray(productData.dimensions)) {
          productData.dimensions.forEach(dim => {
            processedDimensions.push({
              parameter: dim.parameter || 'N/A',
              value: dim.value || '—',
              notes: dim.notes || ''
            });
          });
        }

        return {
          id: productData._id,
          name: productData.productName || 'Product Name Not Available',
          partCode: productData.partCode || 'Part Code Not Available',
          category: productData.category?.name || 'Category Not Available',
          subCategory: productData.subCategory?.name || 'Subcategory Not Available',
          size: productData.size || 'Size Not Available',
          material: productData.material || 'Material Not Available',
          type: productData.type || 'Type Not Available',
          images: processedImages,
          dimensions: processedDimensions
        };
      });

      setAssemblyProducts(processedAssemblyProducts);
    } catch (error) {
      console.error('Error fetching assembly products:', error);
      setAssemblyProducts([]);
    } finally {
      setAssemblyLoading(false);
    }
  };

  const nextImage = () => {
    if (product && product.images && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product && product.images && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading product details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-2xl font-semibold text-gray-900 mb-4">Product Not Found</div>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/products')} variant="outline">
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="md:pt-26 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Breadcrumbs */}
          <nav className="text-sm text-muted-foreground">
            <span
              className="text-primary hover:underline cursor-pointer font-medium hover:text-green-600 transition-colors"
              onClick={() => navigate(`/products?category=${encodeURIComponent(product.category)}`)}
            >
              {product.category}
            </span>
            <span className="mx-2">→</span>
            <span
              className="text-primary hover:underline cursor-pointer font-medium hover:text-green-600 transition-colors"
              onClick={() => navigate(`/products?category=${encodeURIComponent(product.category)}&subcategory=${encodeURIComponent(product.subCategory)}`)}
            >
              {product.subCategory}
            </span>
            <span className="mx-2">→</span>
            <span className="text-foreground font-medium">
              {product.size}
            </span>
          </nav>

          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">

            {/* Left Column - Product Images */}
            <div className="space-y-3">
              {/* Main Image Display */}
              <div className="relative bg-muted/30 rounded-xl p-6 aspect-square">
                {product.images && product.images.length > 0 && product.images[currentImageIndex] ? (
                  <OptimizedImage
                    src={product.images[currentImageIndex].src || product.images[currentImageIndex]}
                    fallbackSrc={product.images[currentImageIndex].fallbackSrc}
                    alt={product.images[currentImageIndex].alt || product.name}
                    className="w-full h-full"
                    aspectRatio="1/1"
                    eager={currentImageIndex === 0}
                    sizes={{
                      mobile: '100vw',
                      tablet: '50vw',
                      desktop: '50vw'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📦</div>
                      <div className="text-sm">No image available</div>
                    </div>
                  </div>
                )}

                {/* Image Navigation */}
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Image Gallery Thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {product.images && product.images.length > 0 ? (
                  product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === index
                        ? 'border-green-600 shadow-md'
                        : 'border-gray-200 hover:border-gray-200-foreground'
                        }`}
                    >
                      <LazyImage
                        src={image.src || image}
                        fallbackSrc={image.fallbackSrc}
                        alt={image.alt || `${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-contain bg-muted/30 p-1"
                        eager={index === 0}
                      />
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded text-[10px]">
                        {index === 0 ? 'P' : 'D'}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="w-20 h-20 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="text-lg mb-1">📷</div>
                      <div className="text-[10px]">No images</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Product Details */}
            <div className="flex flex-col h-full">

              {/* Title & Tags */}
              <div className="bg-card border border-gray-200 rounded-xl p-6">
                <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">
                  {product.name}
                </h1>

                <div className="text-muted-foreground mb-4">
                  Part Code: <span className="font-semibold text-foreground">{product.catalogueCode}</span>
                </div>

                <div className="flex flex-wrap">
                  <div variant="secondary" className="text-[18px] font-medium pr-3 py-1">
                    {product.category}
                  </div>
                  <Badge variant="outline" className="text-xl py-1">
                    {product.material}
                  </Badge>
                </div>
              </div>

              {/* Product Details Card */}
              <div className="bg-card border border-gray-200 rounded-xl p-6 flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-4">Product Details</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {!shouldHideParameter(product.size) && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-base font-medium">Size</span>
                        <div className="text-lg font-semibold text-foreground">{product.size}</div>
                      </div>
                    )}
                    {!shouldHideParameter(product.grade) && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-base font-medium">Grade</span>
                        <div className="text-lg font-semibold text-foreground">{product.grade}</div>
                      </div>
                    )}
                  </div>

                  {(!shouldHideParameter(product.size) || !shouldHideParameter(product.grade)) && (
                    <div className="h-px bg-muted/30"></div>
                  )}

                  {!shouldHideParameter(product.plating) && (
                    <>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-base font-medium">Surface</span>
                        <div className="text-lg font-semibold text-foreground">{product.plating}</div>
                      </div>
                      <div className="h-px bg-muted/30"></div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {!shouldHideParameter(product.temperatureRange) && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground text-base font-medium">Temperature</span>
                        </div>
                        <div className="text-lg font-semibold text-foreground">{formatTemperatureRange(product.temperatureRange)}</div>
                      </div>
                    )}
                    {!shouldHideParameter(product.pressureRating) && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground text-base font-medium">Pressure</span>
                        </div>
                        <div className="text-lg font-semibold text-foreground">{formatPressureRating(product.pressureRating)}</div>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-muted/30"></div>

                  {/* Assembled With */}
                  {assembledWithData.length > 0 && (
                    <>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-base font-medium">Assembled With</span>
                        <div className="text-lg font-semibold text-foreground">
                          {formatAssembledWith(assembledWithData)}
                        </div>
                      </div>
                      <div className="h-px bg-muted/30"></div>
                    </>
                  )}

                  {/* Applications */}
                  <div className="space-y-3">
                    <span className="text-muted-foreground text-base font-medium">Applications</span>
                    <div className="flex flex-wrap gap-2">
                      {product.applications && product.applications.length > 0 ? (
                        product.applications.map((app, index) => {
                          // Handle both string and object formats
                          if (typeof app === 'string') {
                            // If it's a string, try to map it to our constants
                            const appData = getApplicationsByValues([app])[0];
                            if (appData) {
                              return (
                                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-gray-200/50">
                                  <appData.icon className={`h-4 w-4 ${appData.color}`} />
                                  <span className="text-base font-medium">{appData.label}</span>
                                </div>
                              );
                            } else {
                              // Try to find in SECTORS for exact match
                              const sectorData = SECTORS.find(sector => sector.label === app);
                              if (sectorData) {
                                console.log("applications: ", sectorData?.icon, sectorData?.label);
                                return (
                                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-gray-200/50">
                                    <sectorData.icon className="h-4 w-4 text-blue-600" />
                                    <span className="text-base font-medium">{sectorData.label}</span>
                                  </div>
                                );
                              }
                              // Fallback for unmapped strings
                              return (
                                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-gray-200/50">
                                  <span className="text-base font-medium">{app}</span>
                                </div>
                              );
                            }
                          } else if (typeof app === 'object' && app.name) {
                            // If it's an object with name, icon, color properties
                            console.log("applications: ", app);

                            // Try to find the application in our constants first
                            const appData = APPLICATION_OPTIONS.find(option => option.value === app.name);
                            if (appData) {
                              return (
                                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-gray-200/50">
                                  <appData.icon className={`h-4 w-4 ${appData.color}`} />
                                  <span className="text-base font-medium">{appData.label}</span>
                                </div>
                              );
                            }

                            // Try to find in SECTORS
                            const sectorData = SECTORS.find(sector => sector.label === app.name);
                            if (sectorData) {
                              return (
                                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-gray-200/50">
                                  <sectorData.icon className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium">{sectorData.label}</span>
                                </div>
                              );
                            }

                            // Fallback: try to render the icon if it's a component
                            if (typeof app.icon === 'function') {
                              const IconComponent = app.icon;
                              return (
                                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-gray-200/50">
                                  <IconComponent className={`h-4 w-4 ${app.color || 'text-blue-600'}`} />
                                  <span className="text-base font-medium">{app.name}</span>
                                </div>
                              );
                            }

                            // Final fallback: show without icon
                            return (
                              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-gray-200/50">
                                <span className="text-base font-medium">{app.name}</span>
                              </div>
                            );
                          } else if (typeof app === 'object' && app.label) {
                            // If it's an object with label, icon properties (SECTORS format)
                            const IconComponent = app.icon;
                            return (
                              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-gray-200/50">
                                <IconComponent className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">{app.label}</span>
                              </div>
                            );
                          } else {
                            // Fallback for any other format
                            return (
                              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-gray-200/50">
                                <span className="text-base font-medium">{JSON.stringify(app)}</span>
                              </div>
                            );
                          }
                        })
                      ) : (
                        <div className="text-base text-muted-foreground italic">
                          Application information not available
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-muted/30"></div>

                  {/* Product Description */}
                  <div className="space-y-3">
                    <span className="text-muted-foreground text-base font-medium">Product Description</span>
                    <p className="text-base leading-relaxed text-foreground">
                      {product.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Compare Button */}
              <div className="bg-card border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  {/* <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Compare Products</h3>
                    <p className="text-sm text-muted-foreground">Add this product to compare with others</p>
                  </div> */}
                  <div className="flex gap-3">
                    <Button
                      onClick={openInquiryModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg font-medium"
                    >
                      Inquire
                    </Button>
                    <CompareButton product={product} size="lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-muted/30 my-8 md:my-0"></div>

          {/* Modern Accordion Sections */}
          <div className="space-y-6">

            {/* Technical Specifications */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-blue-50/70 transition-all" onClick={() => setIsSpecsOpen(!isSpecsOpen)}>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Technical Specifications</h2>
                    <p className="text-sm text-muted-foreground">
                      Grade: {product.grade} • Material: {product.material} • Material Construction: {product.type}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isSpecsOpen ? 'rotate-180' : ''}`} />
              </div>
              {isSpecsOpen && (
                <div className="px-6 pb-6">
                  <div className="border border-gray-200/20 rounded-lg overflow-hidden bg-background">
                    <div className="bg-muted/10 px-4 py-3 border-b border-gray-200/20 grid grid-cols-2 gap-4 font-medium text-sm">
                      <span>Property</span>
                      <span>Value</span>
                    </div>
                    <div className="divide-y divide-gray-200/20">
                      {!shouldHideParameter(product.catalogueCode) && (
                        <div className="grid grid-cols-2 gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground">Catalogue Code</span>
                          <span className="font-medium">{product.catalogueCode}</span>
                        </div>
                      )}
                      {!shouldHideParameter(product.material) && (
                        <div className="grid grid-cols-2 gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground">Material</span>
                          <span className="font-medium">{product.material}</span>
                        </div>
                      )}
                      {!shouldHideParameter(product.grade) && (
                        <div className="grid grid-cols-2 gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground">Grade</span>
                          <span className="font-medium">{product.grade}</span>
                        </div>
                      )}
                      {!shouldHideParameter(product.threadStandard) && (
                        <div className="grid grid-cols-2 gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground">Thread Standard</span>
                          <span className="font-medium">{product.threadStandard}</span>
                        </div>
                      )}
                      {formatConnections(product.connections) && (
                        <div className="grid grid-cols-2 gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground">Connections</span>
                          <div className="font-medium space-y-1">
                            {formatConnections(product.connections)}
                          </div>
                        </div>
                      )}
                      {!shouldHideParameter(product.type) && (
                        <div className="grid grid-cols-2 gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground">Material Construction</span>
                          <span className="font-medium">{product.type}</span>
                        </div>
                      )}
                      {!shouldHideParameter(product.sealant) && (
                        <div className="grid grid-cols-2 gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground">Sealant</span>
                          <span className="font-medium">{product.sealant}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dimensions */}
            <div className="bg-green-50/50 border border-green-100 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-green-50/70 transition-all" onClick={() => setIsDimensionsOpen(!isDimensionsOpen)}>
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Ruler className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Dimensions (refer to drawing)</h2>
                    <p className="text-sm text-muted-foreground">
                      Size: {product.size} • {product.dimensions.length} parameters available
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isDimensionsOpen ? 'rotate-180' : ''}`} />
              </div>
              {isDimensionsOpen && (
                <div className="px-4 md:px-6 pb-4 md:pb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Dimensions Table</h4>
                      <div className="border border-gray-200/20 rounded-lg overflow-hidden bg-background shadow-sm">
                        <div className="bg-muted/10 px-4 py-3 border-b border-gray-200/20 grid grid-cols-2 gap-4 font-medium text-sm">
                          <span>Parameter</span>
                          <span>Value</span>
                        </div>
                        <div className="divide-y divide-gray-200/20">
                          {product.dimensions && product.dimensions.length > 0 ? (
                            (() => {
                              const validDimensions = product.dimensions.filter(dim =>
                                !shouldHideParameter(dim.parameter) && !shouldHideParameter(dim.value)
                              );
                              return validDimensions.length > 0 ? (
                                validDimensions.map((dim, index) => (
                                  <div key={index} className={`grid grid-cols-2 gap-4 px-4 py-3 transition-colors ${index % 2 === 0 ? 'bg-muted/10 hover:bg-muted/20' : 'hover:bg-muted/10'}`}>
                                    <span className="text-muted-foreground font-medium">{dim.parameter}</span>
                                    <span className="font-semibold text-foreground">{dim.value}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-8 text-center text-muted-foreground">
                                  <div className="text-2xl mb-2">📏</div>
                                  <div className="text-sm">No valid dimension information available</div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="px-4 py-8 text-center text-muted-foreground">
                              <div className="text-2xl mb-2">📏</div>
                              <div className="text-sm">Dimension information not available</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-center">Technical Drawing</h4>
                      <div className="border border-gray-200/20 rounded-lg overflow-hidden bg-background shadow-sm">
                        {product.images && product.images.length > 1 && product.images[1] ? (
                          (() => {
                            const drawingSrc = typeof product.images[1] === 'string' ? product.images[1] : (product.images[1].src || product.images[1].url || '');
                            const drawingAlt = typeof product.images[1] === 'object' && product.images[1].alt ? product.images[1].alt : `${product.name} - Technical Drawing`;
                            if (!drawingSrc) return (
                              <div className="aspect-square bg-muted/30 flex items-center justify-center">
                                <div className="text-center space-y-2">
                                  <div className="w-16 h-16 mx-auto bg-muted/50 rounded-lg flex items-center justify-center">
                                    <Ruler className="h-8 w-8" />
                                  </div>
                                  <p className="text-sm font-medium">Drawing not available</p>
                                  <p className="text-xs">Technical drawing will be provided upon request</p>
                                </div>
                              </div>
                            );
                            return (
                              <div className="aspect-square bg-white p-3 md:p-4 lg:p-6 flex items-center justify-center w-full max-w-full min-w-0 min-h-0">
                                <img
                                  src={drawingSrc}
                                  alt={drawingAlt}
                                  loading="eager"
                                  decoding="async"
                                  className="filter drop-shadow-sm hover:scale-105 transition-transform duration-300 ease-out max-w-full max-h-full w-auto h-auto object-contain"
                                  style={{ aspectRatio: '1/1' }}
                                />
                              </div>
                            );
                          })()
                        ) : (
                          <div className="aspect-square bg-muted/30 flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <div className="w-16 h-16 mx-auto bg-muted/50 rounded-lg flex items-center justify-center">
                                <Ruler className="h-8 w-8" />
                              </div>
                              <p className="text-sm font-medium">Drawing not available</p>
                              <p className="text-xs">Technical drawing will be provided upon request</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Assemblies */}
            {product.assemblies && product.assemblies.trim() !== '' && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-blue-50/70 transition-all" onClick={() => setIsAssembliesOpen(!isAssembliesOpen)}>
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Settings className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Assembly Components</h2>
                      <p className="text-sm text-muted-foreground">
                        {assemblyLoading ? 'Loading assembly components...' :
                          assemblyProducts.length > 0 ? `${assemblyProducts.length} component${assemblyProducts.length > 1 ? 's' : ''} available` :
                            'No assembly components found'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isAssembliesOpen ? 'rotate-180' : ''}`} />
                </div>
                {isAssembliesOpen && (
                  <div className="px-6 pb-6">
                    {assemblyLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-muted-foreground">Loading assembly components...</span>
                      </div>
                    ) : assemblyProducts.length > 0 ? (
                      <div className="space-y-6">
                        {assemblyProducts.map((assemblyProduct, index) => (
                          <div key={assemblyProduct.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{assemblyProduct.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    Part Code: {assemblyProduct.partCode} • {assemblyProduct.category} • {assemblyProduct.subCategory}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/products/${assemblyProduct.id}`)}
                                  className="text-blue-600 hover:bg-blue-50"
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                              {/* Assembly Product Dimensions */}
                              <div className="space-y-4">
                                <h4 className="text-md font-semibold text-gray-900">Dimensions</h4>
                                {assemblyProduct.dimensions && assemblyProduct.dimensions.length > 0 ? (
                                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 grid grid-cols-2 gap-4 font-medium text-sm">
                                      <span>Parameter</span>
                                      <span>Value</span>
                                    </div>
                                    <div className="divide-y divide-gray-200">
                                      {(() => {
                                        const validDimensions = assemblyProduct.dimensions.filter(dim =>
                                          !shouldHideParameter(dim.parameter) && !shouldHideParameter(dim.value)
                                        );
                                        return validDimensions.length > 0 ? (
                                          validDimensions.map((dim, dimIndex) => (
                                            <div key={dimIndex} className={`grid grid-cols-2 gap-4 px-3 py-2 text-sm ${dimIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                              <span className="text-gray-600 font-medium">{dim.parameter}</span>
                                              <span className="font-semibold text-gray-900">{dim.value}</span>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-3 py-4 text-center text-gray-500">
                                            <div className="text-sm">No valid dimensions available</div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500">
                                    <Ruler className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">No dimensions available</p>
                                  </div>
                                )}
                              </div>

                              {/* Assembly Product Drawing - second image is technical drawing, native img to avoid lazy-load issues */}
                              <div className="space-y-4">
                                <h4 className="text-md font-semibold text-gray-900 text-center">Technical Drawing</h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                  {assemblyProduct.images && assemblyProduct.images.length > 1 && assemblyProduct.images[1] ? (
                                    (() => {
                                      const img = assemblyProduct.images[1];
                                      const src = typeof img === 'string' ? img : (img.src || img.url || '');
                                      const alt = typeof img === 'object' && img.alt ? img.alt : `${assemblyProduct.name} - Technical Drawing`;
                                      if (!src) return (
                                        <div className="aspect-square bg-gray-50 flex items-center justify-center text-gray-500 mx-auto">
                                          <div className="text-center space-y-2">
                                            <div className="w-12 h-12 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                                              <Ruler className="h-6 w-6" />
                                            </div>
                                            <p className="text-sm font-medium">Drawing not available</p>
                                            <p className="text-xs">Technical drawing will be provided upon request</p>
                                          </div>
                                        </div>
                                      );
                                      return (
                                        <div className="aspect-square bg-white p-4 flex items-center justify-center w-full max-w-full min-w-0 min-h-0 mx-auto">
                                          <img
                                            src={src}
                                            alt={alt}
                                            loading="eager"
                                            decoding="async"
                                            className="filter drop-shadow-sm hover:scale-105 transition-transform duration-300 ease-out max-w-full max-h-full w-auto h-auto object-contain"
                                            style={{ aspectRatio: '1/1' }}
                                          />
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <div className="aspect-square bg-gray-50 flex items-center justify-center text-gray-500 mx-auto">
                                      <div className="text-center space-y-2">
                                        <div className="w-12 h-12 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                                          <Ruler className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-medium">Drawing not available</p>
                                        <p className="text-xs">Technical drawing will be provided upon request</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">No Assembly Components Found</p>
                        <p className="text-sm">The part codes in the assemblies field could not be found or are invalid.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Compliance & Notes */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50/70 transition-all" onClick={() => setIsComplianceOpen(!isComplianceOpen)}>
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <BadgeCheck className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Compliance & Notes</h2>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isComplianceOpen ? 'rotate-180' : ''}`} />
              </div>
              {isComplianceOpen && (
                <div className="px-6 pb-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Certifications</h4>
                      <div className="flex flex-wrap gap-3">
                        {product.compliance && product.compliance.length > 0 ? (
                          product.compliance.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20 text-sm font-medium">
                              <item.icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            Certification information not available
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-3">Additional Notes</h4>
                      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed bg-muted/30 rounded-lg p-4">
                        {product.additionalNotes && product.additionalNotes.length > 0 ? (
                          product.additionalNotes.map((note, index) => (
                            <p key={index}>• {note}</p>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <div className="text-2xl mb-2">📝</div>
                            <div className="text-sm">No additional notes available</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customization disclaimer */}
            <div className="mt-6 bg-slate-50/50 border border-slate-100 rounded-xl shadow-sm overflow-hidden">
              <div className="flex gap-3 sm:gap-4 p-4 sm:p-5 md:p-6">
                <div className="shrink-0 bg-slate-100 p-2 rounded-lg h-fit">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-0.5">
                  Parts can be customized to meet your specific requirements, with multiple options available for surface finish, thread sealant, thread protection, and product marking.
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-muted/30 my-12"></div>

          {/* Quick Inquiry Form
          <div className="bg-muted/20 rounded-2xl p-8 mb-12 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Quick Inquiry</h2>
            </div>
            
            <form onSubmit={handleInquiry} className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="text-base font-medium">Email Address *</label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@company.com"
                    required
                    className="mt-2 h-12"
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="text-base font-medium">Company</label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Your Company Name"
                    className="mt-2 h-12"
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-between">
                <div className="text-sm text-muted-foreground mb-6">
                  <p className="font-medium mb-2 text-base">Product Details:</p>
                  <p className="text-foreground font-medium">{product.name}</p>
                  <p>Code: {product.catalogueCode}</p>
                </div>
                
                <Button type="submit" className="h-12 text-base font-medium w-full">
                  Send Inquiry
                </Button>
              </div>
            </form>
          </div> */}

          {/* Related Products */}
          <div className="bg-muted/20 rounded-2xl p-8 border border-gray-200">
            <h2 className="text-2xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts && relatedProducts.length > 0 ? (
                relatedProducts.map((related) => (
                  <div key={related.id} className="group bg-background rounded-xl overflow-hidden border border-gray-200/50 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/products/${related.id}`)}>
                    <div className="aspect-square bg-muted/30 overflow-hidden">
                      <OptimizedImage
                        src={related.image}
                        fallbackSrc={related.imageFallbackSrc}
                        alt={related.name}
                        className="group-hover:scale-105 transition-transform p-4"
                        aspectRatio="1/1"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-medium mb-2 text-sm leading-relaxed">{related.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{related.category} • {related.subCategory}</p>
                      <p className="text-xs text-muted-foreground mb-4">Code: {related.partCode}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">🔗</div>
                  <div className="text-sm">Related products not available</div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Mobile CTA */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 lg:hidden z-40">
            <Button
              className="w-full h-12 text-base font-medium"
              onClick={openInquiryModal}
            >
              Send Inquiry
            </Button>
          </div>
        </div>
      </main>

      {/* Inquiry Modal */}
      <Modal
        isOpen={showInquiryModal}
        onClose={closeInquiryModal}
        title="Product Inquiry"
        className="max-w-lg"
      >
        {product && (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
              <p className="text-sm text-gray-600">Part Code: {product.catalogueCode}</p>
            </div>

            {/* Inquiry Form */}
            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <Input
                  type="text"
                  value={inquiryForm.companyName}
                  onChange={(e) => setInquiryForm(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Enter your company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={inquiryForm.email}
                  onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <Input
                  type="number"
                  value={inquiryForm.quantity}
                  onChange={(e) => setInquiryForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity needed"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Message
                </label>
                <textarea
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Any specific requirements or questions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeInquiryModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Submit Inquiry
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductDetail;
