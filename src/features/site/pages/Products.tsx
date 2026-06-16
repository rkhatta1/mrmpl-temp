// @ts-nocheck
"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Filter, X, ChevronDown, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import Header from "@/components/Header";
import CompareButton from "@/components/CompareButton";
import { useCompare } from "@/contexts/CompareContext";
import { useSearchParams, useNavigate } from "@/lib/next-router";
import { useSEO } from "@/hooks/useSEO";
import OptimizedImage from "@/components/OptimizedImage";
import { preferOptimizedProductImage } from "@/lib/image-assets";
import { getPublicApiBaseUrl } from "@/lib/api-base-url";

const Products = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useSEO(
    "Brass Fittings Catalog | Compression & Pipe Fittings",
    "Explore compression, flare, pipe & hose barb fittings. Lead-free options and custom solutions for HVAC, plumbing & industrial use."
  );
  const { addToCompare, isInCompareList } = useCompare();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: [],
    subcategory: [],
    material: [],
    type: [],
    plating: [],
    size: [],
    grade: []
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingRef = useRef(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({
    companyName: '',
    email: '',
    quantity: '',
    message: ''
  });
  const [showSearchBar, setShowSearchBar] = useState(searchParams.get('search') === 'true');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Remove totalPages state as we'll calculate it from filtered products
  // Remove totalProducts state as we'll calculate it from filtered products
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Handle URL parameters for search and filtering
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');

    // Handle search parameter
    if (searchParam) {
      if (searchParam === 'true') {
        // Just show search bar, don't set search query
        setShowSearchBar(true);
      } else {
        // Actual search query - show search bar AND set the query
        setShowSearchBar(true);
        setSearchQuery(decodeURIComponent(searchParam));
      }
    }

    if (categoryParam) {
      setFilters(prev => ({
        ...prev,
        category: [categoryParam]
      }));
    }

    if (subcategoryParam) {
      setFilters(prev => ({
        ...prev,
        subcategory: [subcategoryParam]
      }));
    }
  }, [searchParams]);

  // Fetch all products from API (no filtering on backend)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const apiUrl = getPublicApiBaseUrl();
      // Fetch all active products with a high limit to get all products
      const response = await fetch(`${apiUrl}/products?limit=10000`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        console.error('Failed to fetch products:', data.message);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); // Only fetch once on component mount

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-dropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const FILTER_TYPES = useMemo(
    () => (["category", "subcategory", "size", "material", "type", "plating", "grade"]),
    []
  );

  const getProductValue = (product, filterType) => {
    switch (filterType) {
      case "category":
        return (product.category?.name || product.category || "").toString().trim();
      case "subcategory":
        return (product.subCategory?.name || product.subCategory || "").toString().trim();
      case "material":
        return (product.material || "").toString().trim();
      case "type":
        return (product.type || "").toString().trim();
      case "plating":
        return (product.finishPlating || "").toString().trim();
      case "size":
        return (product.size || "").toString().trim();
      case "grade":
        return (product.grade || "").toString().trim();
      default:
        return "";
    }
  };

  const matchesSearch = (product) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      product.productName?.toLowerCase().includes(searchLower) ||
      product.partCode?.toLowerCase().includes(searchLower) ||
      product.material?.toLowerCase().includes(searchLower) ||
      product.type?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    );
  };

  const compareStringsAsc = (a, b) => {
    const aa = (a || "").toString();
    const bb = (b || "").toString();
    return aa.localeCompare(bb, undefined, { sensitivity: "base", numeric: true });
  };

  // Faceted options: for each dropdown, compute options based on products matching
  // all *other* selected filters (excluding the current filter).
  const availableOptions = useMemo(() => {
    const filterProductsExcluding = (excludeFilterType) => {
      return products.filter((product) => {
        if (!matchesSearch(product)) return false;

        for (const filterType of FILTER_TYPES) {
          if (filterType === excludeFilterType) continue;

          const selectedValues = filters[filterType] || [];
          if (!selectedValues.length) continue;

          const productValue = getProductValue(product, filterType);
          if (!productValue) return false;
          if (!selectedValues.includes(productValue)) return false;
        }

        return true;
      });
    };

    const buildOptionsFor = (filterType) => {
      const scoped = filterProductsExcluding(filterType);
      const unique = new Set();
      for (const p of scoped) {
        const v = getProductValue(p, filterType);
        if (v) unique.add(v);
      }
      return Array.from(unique).sort(compareStringsAsc);
    };

    return {
      category: buildOptionsFor("category"),
      subcategory: buildOptionsFor("subcategory"),
      size: buildOptionsFor("size"),
      material: buildOptionsFor("material"),
      type: buildOptionsFor("type"),
      plating: buildOptionsFor("plating"),
      grade: buildOptionsFor("grade"),
    };
  }, [products, filters, searchQuery, FILTER_TYPES]);

  // If a selection becomes impossible given the other selected filters, drop it automatically.
  useEffect(() => {
    if (!products.length) return;

    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const filterType of FILTER_TYPES) {
        const allowed = availableOptions?.[filterType] || [];
        if (!prev[filterType]?.length) continue;

        const kept = prev[filterType].filter((v) => allowed.includes(v));
        if (kept.length !== prev[filterType].length) {
          next[filterType] = kept;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [products, availableOptions, FILTER_TYPES]);

  // Frontend filtering logic
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        product.productName?.toLowerCase().includes(searchLower) ||
        product.partCode?.toLowerCase().includes(searchLower) ||
        product.material?.toLowerCase().includes(searchLower) ||
        product.type?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.category.length > 0) {
      const categoryMatch = filters.category.some(cat =>
        product.category?.name === cat || product.category === cat
      );
      if (!categoryMatch) return false;
    }

    // Subcategory filter
    if (filters.subcategory.length > 0) {
      const subcategoryMatch = filters.subcategory.some(subcat =>
        product.subCategory?.name === subcat || product.subCategory === subcat
      );
      if (!subcategoryMatch) return false;
    }

    // Material filter
    if (filters.material.length > 0) {
      if (!filters.material.includes(product.material)) return false;
    }

    // Type filter
    if (filters.type.length > 0) {
      if (!filters.type.includes(product.type)) return false;
    }

    // Plating filter
    if (filters.plating.length > 0) {
      if (!filters.plating.includes(product.finishPlating)) return false;
    }

    // Size filter
    if (filters.size.length > 0) {
      if (!filters.size.includes(product.size)) return false;
    }

    // Grade filter
    if (filters.grade.length > 0) {
      if (!filters.grade.includes(product.grade)) return false;
    }

    return true;
  });

  // Infinite scroll logic
  const sortedFilteredProducts = useMemo(() => {
    // Sort by part code (A→Z), case-insensitive, natural numeric order
    return [...filteredProducts].sort((a, b) => compareStringsAsc(a?.partCode, b?.partCode));
  }, [filteredProducts]);

  const totalFilteredProducts = sortedFilteredProducts.length;
  const currentProducts = sortedFilteredProducts.slice(0, itemsToShow);
  const hasMore = itemsToShow < totalFilteredProducts;

  // Reset items to show when filters change
  useEffect(() => {
    setItemsToShow(12);
  }, [searchQuery, filters]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      // Prevent multiple simultaneous loads
      if (isLoadingRef.current) return;
      
      // Check if user has scrolled near the bottom (within 200px)
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const documentHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      
      // Check if we're near the bottom (reduced threshold for easier triggering)
      const threshold = 200;
      const isNearBottom = scrollTop + windowHeight >= documentHeight - threshold;
      
      if (isNearBottom) {
        // Use functional update to get latest state
        setItemsToShow(prev => {
          const currentTotal = filteredProducts.length;
          if (prev < currentTotal) {
            isLoadingRef.current = true;
            setIsLoadingMore(true);
            // Load more items immediately
            const newValue = Math.min(prev + 12, currentTotal);
            setTimeout(() => {
              setIsLoadingMore(false);
              isLoadingRef.current = false;
            }, 300);
            return newValue;
          }
          return prev;
        });
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    window.addEventListener('resize', throttledHandleScroll, { passive: true });
    
    // Check immediately and after a short delay to catch initial load
    handleScroll();
    const timeoutId = setTimeout(handleScroll, 500);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', throttledHandleScroll);
      window.removeEventListener('resize', throttledHandleScroll);
    };
  }, [filteredProducts.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is automatically triggered by filteredProducts
  };

  const openInquiryModal = (product) => {
    setSelectedProduct(product);
    setShowInquiryModal(true);
  };

  const closeInquiryModal = () => {
    setShowInquiryModal(false);
    setSelectedProduct(null);
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
      product: selectedProduct,
      inquiry: inquiryForm
    });

    // Show success message (you can use toast notification here)
    alert('Inquiry submitted successfully! We will contact you soon.');
    closeInquiryModal();
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({
      category: [],
      subcategory: [],
      material: [],
      type: [],
      plating: [],
      size: [],
      grade: []
    });
  };

  // Check if any filters are applied
  const hasActiveFilters = () => {
    const hasSearchQuery = searchQuery && searchQuery.trim() !== '';
    const hasFilterSelections = Object.values(filters).some(filterArray => filterArray.length > 0);
    return hasSearchQuery || hasFilterSelections;
  };

  // Product selection functions
  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p._id === product._id);

      if (isSelected) {
        // Remove from selection
        return prev.filter(p => p._id !== product._id);
      } else {
        // Add to selection (max 3 products)
        if (prev.length >= 3) {
          alert('You can select maximum 3 products at a time. Please deselect a product first.');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  const isProductSelected = (productId) => {
    return selectedProducts.some(p => p._id === productId);
  };

  const addSelectedToCompare = () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to compare.');
      return;
    }

    let addedCount = 0;

    // Add all selected products to compare list
    selectedProducts.forEach(product => {
      // Check if product is already in compare list
      if (!isInCompareList(product._id)) {
        addToCompare(product);
        addedCount++;
      }
    });

    // Show success message
    if (addedCount > 0) {
      alert(`${addedCount} product${addedCount > 1 ? 's' : ''} added to compare list!`);
    } else {
      alert('All selected products are already in the compare list.');
    }

    // Clear selection after adding to compare
    setSelectedProducts([]);
  };

  // Generate breadcrumb
  const generateBreadcrumb = () => {
    const items = [];

    if (filters.category.length === 1) {
      items.push(filters.category[0]);
    } else if (filters.category.length > 1) {
      items.push(`${filters.category.length} Categories`);
    }

    if (filters.subcategory.length === 1) {
      items.push(filters.subcategory[0]);
    } else if (filters.subcategory.length > 1) {
      items.push(`${filters.subcategory.length} Subcategories`);
    }

    if (filters.size.length === 1) {
      items.push(filters.size[0]);
    } else if (filters.size.length > 1) {
      items.push(`${filters.size.length} Sizes`);
    }

    return items;
  };

  const FilterDropdown = ({
    filterType,
    options,
    placeholder,
    isMobile = false
  }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const isOpen = openDropdown === filterType;

    const filteredOptions = options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = () => {
      if (isOpen) {
        setOpenDropdown(null);
      } else {
        setOpenDropdown(filterType);
        setSearchTerm(''); // Reset search when opening
      }
    };

    const handleOptionClick = (option) => {
      toggleFilter(filterType, option);
      // Don't close dropdown on mobile to allow multiple selections easily
      if (!isMobile) {
      setOpenDropdown(null);
      }
    };

    return (
      <div className={`relative filter-dropdown ${isMobile ? 'w-full' : ''}`}>
        <Button
          variant="outline"
          onClick={handleToggle}
          className={`h-10 justify-between text-left font-normal ${isMobile ? 'w-full' : 'min-w-[150px]'} bg-background text-black border-gray-200 hover:bg-green-200 hover:text-green-700 cursor-pointer transition-colors`}
        >
          {filters[filterType].length > 0
            ? `${filters[filterType].length} selected`
            : placeholder}
          <ChevronDown className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className={`absolute ${isMobile ? 'top-full left-0 right-0 mt-1 w-full' : 'top-full left-0 mt-1 w-80'} bg-white border border-gray-200 rounded-md shadow-lg z-50`}>
            <div className="p-2">
              <Input
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                className="mb-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className={`${isMobile ? 'max-h-48' : 'max-h-60'} overflow-y-auto`}>
                {filteredOptions.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No options found</div>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => handleOptionClick(option)}
                      className="flex items-center p-2 hover:bg-green-50 cursor-pointer transition-colors rounded"
                    >
                      <Checkbox
                        checked={filters[filterType].includes(option)}
                        className="mr-2"
                      />
                      <span className="text-sm">{option}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Sticky Filter Bar - positioned right after header */}
      <div className="sticky top-20 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-b-gray-300 shadow-sm">
        <div className="bg-green-50">
          <div className="container mx-auto px-4 pt-8 pb-4 lg:pt-10">
            {/* Helper Text */}
            <p className="text-sm text-muted-foreground italic mb-4 text-center lg:text-left pt-4">
              search for your desired products
            </p>

            <div className="pb-4">
                <div className="flex items-center gap-4">
                  {/* Search bar */}
                  <form onSubmit={handleSearch} className="flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="Search products, categories, materials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                      autoFocus
                    />
                  </form>
                </div>
            </div>

            {/* Desktop Horizontal Filters */}
            <div className="hidden lg:flex flex-wrap items-center gap-4 mb-3">
                <FilterDropdown
                  filterType="category"
                  options={availableOptions.category || []}
                  placeholder="Category"
                />
                <FilterDropdown
                  filterType="subcategory"
                  options={availableOptions.subcategory || []}
                  placeholder="Subcategory"
                />
                <FilterDropdown
                  filterType="size"
                  options={availableOptions.size || []}
                  placeholder="Size"
                />
                <FilterDropdown
                  filterType="material"
                  options={availableOptions.material || []}
                  placeholder="Material"
                />
                <FilterDropdown
                  filterType="type"
                  options={availableOptions.type || []}
                  placeholder="Material Construction"
                />
                <FilterDropdown
                  filterType="plating"
                  options={availableOptions.plating || []}
                  placeholder="Surface Finish"
                />
                <FilterDropdown
                  filterType="grade"
                  options={availableOptions.grade || []}
                  placeholder="Grade"
                />
                {hasActiveFilters() && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="h-10 justify-center text-center font-normal min-w-[150px] bg-background text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors ml-2"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Mobile Filter Button */}
              <div className="lg:hidden mb-4 bg-green-50">
                <Button
                  variant="outline"
                  className="gap-2 w-full hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 cursor-pointer"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {Object.values(filters).some(arr => arr.length > 0) && (
                    <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800">
                      {Object.values(filters).reduce((acc, arr) => acc + arr.length, 0)}
                    </Badge>
                  )}
                </Button>

                {showMobileFilters && (
                  <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pb-4">
                    {/* Header with Close Button */}
                    <div className="flex items-center justify-between mb-2 sticky top-0 bg-green-50 pb-2 z-10">
                      <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowMobileFilters(false);
                          setOpenDropdown(null);
                        }}
                        className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    {/* Grid layout for filters - 2 columns on mobile */}
                    <div className="grid grid-cols-2 gap-3">
                    <FilterDropdown
                      filterType="category"
                      options={availableOptions.category || []}
                      placeholder="Category"
                        isMobile={true}
                    />
                    <FilterDropdown
                      filterType="subcategory"
                      options={availableOptions.subcategory || []}
                      placeholder="Subcategory"
                        isMobile={true}
                    />
                    <FilterDropdown
                      filterType="size"
                      options={availableOptions.size || []}
                      placeholder="Size"
                        isMobile={true}
                    />
                    <FilterDropdown
                      filterType="material"
                      options={availableOptions.material || []}
                      placeholder="Material"
                        isMobile={true}
                    />
                    <FilterDropdown
                      filterType="type"
                      options={availableOptions.type || []}
                      placeholder="Material Construction"
                        isMobile={true}
                    />
                    <FilterDropdown
                      filterType="plating"
                      options={availableOptions.plating || []}
                        placeholder="Surface Finish"
                        isMobile={true}
                    />
                    <FilterDropdown
                      filterType="grade"
                      options={availableOptions.grade || []}
                      placeholder="Grade"
                        isMobile={true}
                    />
                    </div>
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="w-full mt-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 cursor-pointer"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Breadcrumb Navigation */}
              {generateBreadcrumb().length > 0 && (
                <div className="mt-4 mb-4">
                  <nav className="flex items-center space-x-2 text-sm">
                    <span
                      onClick={() => navigate('/products')}
                      className="flex items-center gap-1 text-blue-600 hover:text-green-600 transition-colors cursor-pointer"
                    >
                      <Home className="h-4 w-4" />
                      Products
                    </span>
                    {generateBreadcrumb().map((item, index) => {
                      const breadcrumbItems = generateBreadcrumb();
                      const isLast = index === breadcrumbItems.length - 1;

                      return (
                        <div key={index} className="flex items-center">
                          <span className="mx-2 text-gray-400">/</span>
                          {isLast ? (
                            <span className="font-medium text-gray-900">{item}</span>
                          ) : (
                            <span
                              onClick={() => {
                                // Create URL based on current filters up to this point
                                const currentFilters = { ...filters };

                                // Remove filters after this breadcrumb item
                                if (index === 0 && filters.category.length > 0) {
                                  // Keep only the first category
                                  currentFilters.category = [filters.category[0]];
                                  currentFilters.subcategory = [];
                                  currentFilters.size = [];
                                } else if (index === 1 && filters.subcategory.length > 0) {
                                  // Keep category and first subcategory
                                  currentFilters.subcategory = [filters.subcategory[0]];
                                  currentFilters.size = [];
                                }

                                // Build URL with remaining filters
                                const params = new URLSearchParams();
                                if (currentFilters.category.length > 0) {
                                  params.set('category', currentFilters.category[0]);
                                }
                                if (currentFilters.subcategory.length > 0) {
                                  params.set('subcategory', currentFilters.subcategory[0]);
                                }
                                if (currentFilters.size.length > 0) {
                                  params.set('size', currentFilters.size[0]);
                                }

                                navigate(`/products?${params.toString()}`);
                              }}
                              className="font-medium text-green-600 hover:text-green-800 hover:underline cursor-pointer transition-colors"
                            >
                              {item}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </nav>
                </div>
              )}

              {/* Selected Filter Pills */}
              {Object.entries(filters).some(([_, values]) => values.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4 mt-2">
                  {Object.entries(filters).map(([filterType, selectedValues]) =>
                    selectedValues.map(value => (
                      <Badge key={`${filterType}-${value}`} variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-default">
                        {value.length > 20 ? `${value.substring(0, 20)}...` : value}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-green-300 hover:text-green-900 transition-all duration-200 cursor-pointer rounded-full"
                          onClick={() => toggleFilter(filterType, value)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Main Content Area */}
      <div className=" pt-24">
        <div className="container mx-auto px-4 pb-0">


        {/* Main Content */}
        <div className="space-y-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {loading ? 'Loading products...' : (
                totalFilteredProducts > 0 ? (
                  `Showing ${currentProducts.length} of ${totalFilteredProducts} products`
                ) : 'No products found'
              )}
            </div>
            {selectedProducts.length > 0 && (
              <Button
                onClick={addSelectedToCompare}
                className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 cursor-pointer"
                size="sm"
              >
                Compare ({selectedProducts.length})
              </Button>
            )}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="text-center py-16">
              <div className="text-muted-foreground text-lg mb-4">Loading products...</div>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-muted-foreground text-lg mb-4">No products found</div>
              <p className="text-sm text-muted-foreground mb-6">
                {products.length === 0 ?
                  'Unable to connect to the server. Please make sure the backend is running.' :
                  'Try adjusting your search terms or clearing some filters.'
                }
              </p>
              {products.length === 0 ? (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 cursor-pointer"
                >
                  Retry
                </Button>
              ) : (
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 cursor-pointer"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentProducts.map((product) => (
                <Card key={product._id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative">
                  <CardHeader className="p-4">
                    {/* Selection Icon */}
                    <div className="absolute top-3 right-3 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProductSelection(product);
                        }}
                        disabled={!isProductSelected(product._id) && selectedProducts.length >= 3}
                        title={
                          isProductSelected(product._id)
                            ? 'Click to deselect'
                            : selectedProducts.length >= 3
                              ? 'Maximum 3 products can be selected'
                              : 'Click to select for comparison'
                        }
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isProductSelected(product._id)
                          ? 'bg-green-500 border-green-500 text-white'
                          : selectedProducts.length >= 3
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                            : 'border-green-500 bg-white hover:bg-green-50'
                          }`}
                      >
                        {isProductSelected(product._id) && (
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <CardTitle
                      className="text-sm font-medium line-clamp-2 mb-3 group-hover:text-green-600 transition-colors pr-8 leading-relaxed cursor-pointer hover:underline"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      {product.productName}
                    </CardTitle>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded hover:bg-green-200 transition-colors cursor-default">
                        {product.partCode}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded hover:bg-blue-200 transition-colors cursor-default">
                        {product.grade}
                      </span>
                    </div>

                    <div className="aspect-square bg-muted/20 rounded-lg overflow-hidden group-hover:bg-green-50 transition-colors">
                      {product.images && product.images.length > 0 ? (
                        <OptimizedImage
                          src={preferOptimizedProductImage(product.images[0], product.partCode, 0, "card")}
                          alt={product.productName}
                          className="cursor-pointer group-hover:scale-105 transition-transform duration-300"
                          aspectRatio="1/1"
                          sizes={{
                            mobile: '100vw',
                            tablet: '50vw',
                            desktop: '25vw'
                          }}
                          onClick={() => navigate(`/products/${product._id}`)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground group-hover:text-green-600 transition-colors">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📦</div>
                            <div className="text-xs">No Image</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {/* <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Part Code:</span>
                        <div className="font-medium">{product.partCode}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span>
                        <div className="font-medium">{product.size}</div>
                      </div>
                    </div> */}

                    <div className="space-y-2 mt-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 cursor-pointer"
                          onClick={() => window.location.href = `/products/${product._id}`}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white transition-all duration-200 cursor-pointer hover:shadow-md"
                          onClick={() => openInquiryModal(product)}
                        >
                          Inquiry
                        </Button>
                      </div>
                      <CompareButton
                        product={product}
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Infinite Scroll Loading Indicator */}
          {hasMore && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more products...</span>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    Scroll down to load more products
                  </div>
                  <Button
                    onClick={() => {
                      if (!isLoadingRef.current) {
                        isLoadingRef.current = true;
                        setIsLoadingMore(true);
                        setItemsToShow(prev => {
                          const newValue = Math.min(prev + 12, totalFilteredProducts);
                          setTimeout(() => {
                            setIsLoadingMore(false);
                            isLoadingRef.current = false;
                          }, 300);
                          return newValue;
                        });
                      }
                    }}
                    variant="outline"
                    className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 cursor-pointer"
                  >
                    Load More Products
                  </Button>
                </>
              )}
            </div>
          )}

          {/* End of Results Message */}
          {!hasMore && totalFilteredProducts > 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                You've reached the end of the results
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      <Modal
        isOpen={showInquiryModal}
        onClose={closeInquiryModal}
        title="Product Inquiry"
        className="max-w-lg"
      >
        {selectedProduct && (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-3">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <OptimizedImage
                    src={preferOptimizedProductImage(selectedProduct.images[0], selectedProduct.partCode, 0, "thumb")}
                    alt={selectedProduct.productName}
                    className="w-16 h-16 rounded"
                    aspectRatio="1/1"
                    eager={true}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    No Image
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{selectedProduct.productName}</h3>
                  <p className="text-sm text-gray-600">{selectedProduct.category?.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedProduct.material} • {selectedProduct.size} • {selectedProduct.partCode}
                  </p>
                </div>
              </div>
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

export default Products;
