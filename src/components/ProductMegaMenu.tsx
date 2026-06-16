// @ts-nocheck
"use client";
import { useState } from "react";
import { useNavigate } from "@/lib/next-router";
import { Search, Package, Grid3x3, Loader2 } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useCategories } from "../hooks/useCategories";

const ProductMegaMenu = ({ 
  isOpen, 
  onClose,
  onMouseEnter,
  onMouseLeave
}) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use the custom hook to get categories and subcategories
  const { categories, subcategories, loading, error, getSubcategoriesForCategory } = useCategories();

  // Filter categories based on search query (no limit - show all categories)
  // Sort categories alphabetically in ascending order
  const filteredCategories = categories
    .filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${encodeURIComponent(category.name)}`);
    onClose();
  };

  const handleSubcategoryClick = (category, subcategory) => {
    navigate(`/products?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(subcategory.name)}`);
    onClose();
  };

  const handleAllCategoriesClick = () => {
    navigate('/products');
    onClose();
  };

  const handleCategoryHover = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="absolute left-0 mt-2 z-[100] overflow-hidden"
      style={{ 
        width: 'min(1040px, 92vw)',
        maxHeight: '70vh'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[320px_1fr] h-full">
          {/* Left Panel - Categories */}
          <div className="border-r border-gray-200 overflow-y-auto" style={{ maxHeight: '70vh' }}>
            <div className="p-5 space-y-4">
              {/* All Categories */}
              <button
                onClick={handleAllCategoriesClick}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <Grid3x3 className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">All Categories</div>
                  <div className="text-xs text-gray-500">Browse all products</div>
                </div>
              </button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search categories…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 text-sm border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-gray-600">Loading categories...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500 mb-2">Failed to load categories</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Categories List */}
              {!loading && !error && (
                <div className="space-y-1">
                  {filteredCategories.map((category, index) => (
                    <button
                      key={category._id || index}
                      onClick={() => handleCategoryClick(category)}
                      onMouseEnter={() => handleCategoryHover(category.name)}
                      className={`w-full text-left p-3 rounded-lg transition-colors text-sm hover:bg-gray-50 ${
                        selectedCategory === category.name 
                          ? "bg-green-50 border-l-4 border-green-500 text-green-900 font-medium" 
                          : "text-gray-700"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}

              {/* No categories found */}
              {!loading && !error && filteredCategories.length === 0 && searchQuery && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No categories found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Subcategories */}
          <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
            <div className="p-5">
              {selectedCategory ? (
                <>
                  <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {selectedCategory} Types
                  </h3>
                  <div className="space-y-1">
                    {getSubcategoriesForCategory(
                      categories.find(cat => cat.name === selectedCategory)?._id
                    ).map((subcategory, index) => (
                      <button
                        key={subcategory._id || index}
                        onClick={() => handleSubcategoryClick(
                          categories.find(cat => cat.name === selectedCategory), 
                          subcategory
                        )}
                        className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary rounded transition-colors"
                      >
                        {subcategory.name}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 mt-12">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a category to view subcategories</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductMegaMenu;
