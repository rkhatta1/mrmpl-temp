// @ts-nocheck
"use client";
import { useState } from "react";
import { useNavigate } from "@/lib/next-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "./ui/Button";
import { useCategories } from "../hooks/useCategories";

const MobileProductsDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const { categories, subcategories, loading, error, getSubcategoriesForCategory } = useCategories();

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
    onClose();
  };

  const handleSubcategoryClick = (category, subcategory) => {
    navigate(`/products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`);
    onClose();
  };

  const handleAllProductsClick = () => {
    navigate('/products');
    onClose();
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  return (
    <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
      {/* All Products */}
      <Button 
        variant="ghost" 
        onClick={handleAllProductsClick}
        className="justify-start w-full text-sm text-gray-600 hover:text-primary hover:bg-gray-50"
      >
        All Products
      </Button>

      {/* Loading State */}
      {loading && (
        <div className="text-xs text-gray-500 px-2 py-1">
          Loading categories...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-xs text-red-500 px-2 py-1">
          Failed to load categories
        </div>
      )}

      {/* Categories */}
      {!loading && !error && [...categories].sort((a, b) => a.name.localeCompare(b.name)).map((category, index) => {
        const categorySubcategories = getSubcategoriesForCategory(category._id);
        const isExpanded = expandedCategory === category.name;
        
        return (
          <div key={category._id || index}>
            {/* Category Button */}
            <Button 
              variant="ghost" 
              onClick={() => {
                if (categorySubcategories.length > 0) {
                  toggleCategory(category.name);
                } else {
                  handleCategoryClick(category.name);
                }
              }}
              className="justify-between w-full text-sm text-gray-600 hover:text-primary hover:bg-gray-50"
            >
              <span>{category.name}</span>
              {categorySubcategories.length > 0 && (
                <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              )}
            </Button>

            {/* Subcategories */}
            {isExpanded && categorySubcategories.length > 0 && (
              <div className="ml-4 mt-1 space-y-1 border-l border-gray-300 pl-3">
                {categorySubcategories.map((subcategory, subIndex) => (
                  <Button
                    key={subcategory._id || subIndex}
                    variant="ghost"
                    onClick={() => handleSubcategoryClick(category.name, subcategory.name)}
                    className="justify-start w-full text-xs text-gray-500 hover:text-primary hover:bg-gray-50"
                  >
                    {subcategory.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* No categories found */}
      {!loading && !error && categories.length === 0 && (
        <div className="text-xs text-gray-500 px-2 py-1">
          No categories available
        </div>
      )}
    </div>
  );
};

export default MobileProductsDropdown;
