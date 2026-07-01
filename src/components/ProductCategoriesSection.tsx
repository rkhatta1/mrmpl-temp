// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "@/lib/next-router";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { AspectRatio } from "./ui/AspectRatio";
import { categoryService } from "../services/categoryService";

// Allowed categories to display in home page and footer (order defines display order)
const ALLOWED_CATEGORIES = [
  "COMPRESSION FITTING",
  "PIPE FITTING",
  "FLARE FITTING",
  "HOSE BARB FITTING",
  "PUSH ON HOSE BARB FITTING",
  "GARDEN HOSE FITTING",
  "BULKHEAD FITTING",
  "PUSH IN FITTING",
  "DOT FITTING"
];

const HOME_CATEGORY_IMAGES = {
  "COMPRESSION FITTING": "/optimized/home-categories/compression-fitting.webp",
  "PIPE FITTING": "/optimized/home-categories/pipe-fitting.webp",
  "FLARE FITTING": "/optimized/home-categories/flare-fitting.webp",
  "HOSE BARB FITTING": "/optimized/home-categories/hose-barb-fitting.webp",
  "PUSH ON HOSE BARB FITTING": "/optimized/home-categories/push-on-hose-barb-fitting.webp",
  "GARDEN HOSE FITTING": "/optimized/home-categories/garden-hose-fitting.webp",
  "BULKHEAD FITTING": "/optimized/home-categories/bulkhead-fitting.webp",
  "PUSH IN FITTING": "/optimized/home-categories/push-in-fitting.webp",
  "DOT FITTING": "/optimized/home-categories/dot-fitting.webp",
};

function getHomeCategoryImage(categoryName) {
  const normalizedName = categoryName.toUpperCase().trim();
  return HOME_CATEGORY_IMAGES[normalizedName] || "/optimized/site/logo-86.webp";
}

const ProductCategoriesSection = () => {
  const navigate = useNavigate();
  const { elementRef, isVisible } = useScrollAnimation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await categoryService.getCategories();
        
        // Handle different possible response structures
        let categoriesData = [];
        if (Array.isArray(data)) {
          categoriesData = data;
        } else if (data && Array.isArray(data.categories)) {
          categoriesData = data.categories;
        } else if (data && Array.isArray(data.data)) {
          categoriesData = data.data;
        } else {
          console.warn('Unexpected API response structure:', data);
          categoriesData = [];
        }
        
        // Filter categories to only show allowed ones (exact match only, case-insensitive)
        const allowedCategories = categoriesData.filter(category => {
          const categoryNameUpper = category.name.toUpperCase().trim();
          return ALLOWED_CATEGORIES.some(allowed => {
            const allowedUpper = allowed.toUpperCase().trim();
            // Exact match only (case-insensitive) - this prevents "JIC FLARE FITTING" from matching "FLARE FITTING"
            return categoryNameUpper === allowedUpper;
          });
        });

        // Sort categories according to the display order defined in ALLOWED_CATEGORIES
        allowedCategories.sort((a, b) => {
          const indexA = ALLOWED_CATEGORIES.findIndex(allowed => a.name.toUpperCase().trim() === allowed.toUpperCase().trim());
          const indexB = ALLOWED_CATEGORIES.findIndex(allowed => b.name.toUpperCase().trim() === allowed.toUpperCase().trim());
          return indexA - indexB;
        });
        
        setCategories(allowedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to static data if API fails
        setCategories([
          {
            _id: "1",
            name: "Compression Fittings",
            description: "For instrumentation, hydraulic, and pneumatic systems; designed for aluminium, copper, and plastic tubing.",
            image: getHomeCategoryImage("COMPRESSION FITTING")
          },
          {
            _id: "2",
            name: "Flare Fittings", 
            description: "For fuel, oil, LP/natural gas, and air lines; works with copper, brass, aluminium, and steel tubing.",
            image: getHomeCategoryImage("FLARE FITTING")
          },
          {
            _id: "3",
            name: "Pipe Fittings",
            description: "For water, fuels, refrigeration, instrumentation, and hydraulics; connects brass, copper, and iron pipe.",
            image: getHomeCategoryImage("PIPE FITTING")
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section ref={elementRef} className="pt-10 pb-4 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className={`text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Explore Our Product Categories</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A complete range of fittings designed for durability, compliance, and performance across industries.
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((index) => (
              <Card key={index} className="group overflow-hidden shadow-sm border-gray-200 bg-white">
                <div className="overflow-hidden">
                  <AspectRatio ratio={4/3} className="w-full">
                    <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                  </AspectRatio>
                </div>
                <CardHeader className="pb-3">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                  <div className="mt-6 h-8 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {Array.isArray(categories) && categories.map((category, index) => (
              <Card 
                key={category._id || index} 
                className="group overflow-hidden transition-all duration-300 border-gray-200 bg-white hover:bg-gray-50 hover:shadow-lg"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                {/* Product Image */}
                <div className="overflow-hidden">
                  <AspectRatio ratio={4/3} className=" w-full">
                    <img 
                      src={category.image || getHomeCategoryImage(category.name)}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading={index < 3 ? "eager" : "lazy"}
                    />
                  </AspectRatio>
                </div>
                
                {/* Card Content */}
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {category.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="mb-6 text-sm leading-relaxed text-gray-600 line-clamp-3 min-h-[4.5rem]">
                    {category.description}
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 transition-all duration-300"
                    onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="w-full mt-10 mb-4">
          <div className="bg-green-50 rounded-2xl py-10 px-6 md:px-12 shadow-sm flex flex-col items-center gap-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-green-900 mb-1">
              Your Product, Just one Search Away.
            </h2>
            <p className="text-base md:text-lg text-green-900 mb-1">
              Discover, filter, and locate components across our entire catalog instantly.
            </p>
            <p className="text-base text-green-900 opacity-80 mb-3">
              Our smart product finder makes it effortless to search by size, grade, or category, all in one place.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 w-full max-w-2xl mx-auto">
              <Button 
                size="lg" 
                onClick={() => navigate('/products')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200 px-6 py-2 text-base"
              >
                Find Your Product
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <form 
                onSubmit={e => {
                  e.preventDefault();
                  const form = e.target;
                  const input = form.elements.search;
                  if (input.value.trim()) {
                    navigate(`/products?search=${encodeURIComponent(input.value)}`);
                  } else {
                    navigate('/products?search=true');
                  }
                }}
                className="flex-1 w-full max-w-md"
              >
                <div className="flex">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search product, category, size, grade..."
                    className="w-full rounded-l-md border border-green-300 px-4 py-2 bg-white text-green-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    className="rounded-l-none rounded-r-md bg-green-600 hover:bg-green-700 text-white transition-all duration-200 px-4 py-2 flex items-center"
                  >
                    <span className="sr-only">Search Product</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductCategoriesSection;
