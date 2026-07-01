// @ts-nocheck
"use client";
import { useState, useEffect, type CSSProperties } from "react";
import { FileText, Menu, X, ChevronDown, GitCompare, Search } from "lucide-react";
import { Button } from "./ui/Button";
import { useNavigate } from "@/lib/next-router";
import ProductMegaMenu from "./ProductMegaMenu";
import MobileProductsDropdown from "./MobileProductsDropdown";
import { useCompare } from "../contexts/CompareContext";

type HeaderProps = {
  logoSrc?: string;
  logoClassName?: string;
  logoStyle?: CSSProperties;
};

const Header = ({
  logoSrc = "/mrmpl-emblem-green.svg",
  logoClassName = "h-12 w-auto",
  logoStyle,
}: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const [productsMenuTimeout, setProductsMenuTimeout] = useState(null);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const navigate = useNavigate();
  const { compareCount } = useCompare();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProductsMouseEnter = () => {
    if (productsMenuTimeout) {
      clearTimeout(productsMenuTimeout);
      setProductsMenuTimeout(null);
    }
    setIsProductsMenuOpen(true);
  };

  const handleProductsMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsProductsMenuOpen(false);
    }, 150); // 150ms delay
    setProductsMenuTimeout(timeout);
  };

  return (
    <header 
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled 
          ? 'top-0 left-0 right-0 bg-white shadow-lg rounded-none lg:top-0 lg:left-0 lg:right-0' 
          : 'top-0 left-0 right-0 bg-white shadow-lg rounded-none lg:top-6 lg:left-6 lg:right-6 lg:rounded-2xl'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Left Side (Both Mobile & Desktop) */}
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img 
              src={logoSrc} 
              alt="Mayank Raw Mint Logo" 
              className={logoClassName}
              style={logoStyle}
            />
          </div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center space-x-8">
            <div 
              className="relative"
              onMouseEnter={handleProductsMouseEnter}
              onMouseLeave={handleProductsMouseLeave}
            >
              <Button 
                variant="ghost" 
                onClick={() => navigate("/products")}
                className={`cursor-pointer text-base font-medium transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 flex items-center gap-2 ${
                  isScrolled ? 'text-gray-700 hover:text-primary hover:bg-gray-100' : 'text-black hover:text-green-600 hover:bg-green-50'
                }`}
              >
                Products
                <ChevronDown className={`h-4 w-4 transition-fast ${isProductsMenuOpen ? 'rotate-180' : ''}`} />
              </Button>
              <ProductMegaMenu 
                isOpen={isProductsMenuOpen} 
                onClose={() => setIsProductsMenuOpen(false)} 
                onMouseEnter={handleProductsMouseEnter}
                onMouseLeave={handleProductsMouseLeave}
              />
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/about")}
              className={`cursor-pointer text-base font-medium transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 ${
                isScrolled ? 'text-gray-700 hover:text-primary hover:bg-gray-100' : 'text-black hover:text-green-600 hover:bg-green-50'
              }`}
            >
              About
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/quality")}
              className={`cursor-pointer text-base font-medium transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 ${
                isScrolled ? 'text-gray-700 hover:text-primary hover:bg-gray-100' : 'text-black hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Quality
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/capabilities")}
              className={`cursor-pointer text-base font-medium transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 ${
                isScrolled ? 'text-gray-700 hover:text-primary hover:bg-gray-100' : 'text-black hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Capabilities
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/contact")}
              className={`cursor-pointer text-base font-medium transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 ${
                isScrolled ? 'text-gray-700 hover:text-primary hover:bg-gray-100' : 'text-black hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Contact
            </Button>
          </nav>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center space-x-2 xl:space-x-4">
            {/* Desktop Only Buttons */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
              {/* Search Button */}
              <Button
                variant="ghost"
                onClick={() => navigate("/products?search=true")}
                className={`transition-all cursor-pointer ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-primary hover:bg-gray-100' 
                    : 'text-black hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Catalog Button - under development, links to products for now */}
              <Button
                onClick={() => navigate("/products")}
                className="bg-primary text-white hover:bg-primary/90 rounded-full px-6 py-2 text-base font-medium shadow-lg transition-all hover:shadow-xl cursor-pointer"
              >
                Catalog
              </Button>

              {/* Inquiry Button */}
              <Button
                variant="outline"
                onClick={() => navigate("/contact")}
                className={`transition-all cursor-pointer ${
                  isScrolled 
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                    : 'border-gray-300 text-black hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Inquiry</span>
              </Button>

              {/* Compare Button - Only show when there are products in compare list */}
              {compareCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/compare")}
                  className={`transition-all cursor-pointer relative ${
                    isScrolled 
                      ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                      : 'border-gray-300 text-black hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  <GitCompare className="h-4 w-4" />
                  <span className="hidden sm:ml-2 sm:inline">Compare</span>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {compareCount}
                  </span>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-gray-700" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border/20 py-4 bg-white shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="flex flex-col space-y-1">
              {/* Products with Dropdown */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                  className="justify-start w-full text-gray-700 hover:text-primary hover:bg-gray-50"
                >
                  <span>Products</span>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isMobileProductsOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {/* Mobile Products Dropdown */}
                {isMobileProductsOpen && (
                  <MobileProductsDropdown 
                    onClose={() => {
                      setIsMobileMenuOpen(false);
                      setIsMobileProductsOpen(false);
                    }}
                  />
                )}
              </div>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate("/about");
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start text-gray-700 hover:text-primary hover:bg-gray-50"
              >
                About
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate("/quality");
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start text-gray-700 hover:text-primary hover:bg-gray-50"
              >
                Quality
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate("/capabilities");
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start text-gray-700 hover:text-primary hover:bg-gray-50"
              >
                Capabilities
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate("/contact");
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start text-gray-700 hover:text-primary hover:bg-gray-50"
              >
                Contact
              </Button>
              
              <div className="pt-2 border-t border-gray-200 mt-2">
                <Button 
                  onClick={() => {
                    navigate("/products?search=true");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-green-600 text-white hover:bg-green-700 mb-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search Products
                </Button>
                <Button 
                  onClick={() => {
                    navigate("/products");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary text-white hover:bg-primary/90 mb-2 cursor-pointer"
                >
                  Catalog
                </Button>
                {compareCount > 0 && (
                  <Button 
                    onClick={() => {
                      navigate("/compare");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-green-600 text-white hover:bg-green-700 mb-2 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <GitCompare className="h-4 w-4" />
                    Compare ({compareCount})
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
