// @ts-nocheck
"use client";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { useNavigate } from "@/lib/next-router";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleBrowseProducts = () => {
    navigate("/products");
  };

  const handleMakeInquiry = () => {
    navigate("/contact");
  };

  return (
    <section className="relative gradient-footer min-h-screen flex items-center overflow-hidden pt-34 pb-16">
      {/* Subtle Grid Pattern Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full opacity-15"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content with generous padding */}
          <div className="space-y-6 sm:space-y-8 lg:pr-6 lg:pl-8 text-center lg:text-left">
            {/* Top Badge - positioned close to heading */}
            <div className="flex justify-center lg:justify-start mb-6">
              <Badge className="text-sm px-6 py-3 bg-white/20 text-white font-bold rounded-full border border-white/30 shadow-lg backdrop-blur-sm">
                Since 2008
              </Badge>
            </div>

            {/* Main Heading - Split into three lines */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.2] sm:leading-[1.3]">
                Manufacturers & Exporters
                <br />
                of Fittings
              </h1>
            </div>

            {/* Subheading with constrained width */}
            <p className="text-base sm:text-lg text-white/75 max-w-xl leading-relaxed mb-6 sm:mb-8 mx-auto lg:mx-0">
              From everyday brass fittings including compression, flare, pipe, and hose barb to custom-engineered designs, we deliver the right fitting for you, certified and trusted worldwide.
            </p>

            {/* Search Bar - Smaller height, centered */}
            <div className="mb-6 sm:mb-8">
              <form onSubmit={handleSearch} className="max-w-md mx-auto lg:mx-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search products…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 pr-14 py-3 h-12 text-base bg-gray-100 border-0 rounded-full text-gray-900 placeholder:text-gray-500 focus:bg-white focus:text-gray-900 focus:outline-none shadow-sm"
                  />
                  <Button 
                    type="submit"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90 text-white rounded-full h-10 w-10 shadow-sm"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>

            {/* CTA Buttons - Perfect styling with hover effects */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto lg:mx-0">
              <Button 
                size="lg"
                onClick={handleBrowseProducts}
                className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-full px-8 py-3 h-12 text-base font-semibold group"
              >
                Browse Catalog
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={handleMakeInquiry}
                className="border-2 border-primary text-primary bg-white hover:bg-primary hover:text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-full px-8 py-3 h-12 text-base font-semibold"
              >
                Make an Inquiry
              </Button>
            </div>
          </div>

          {/* Right Column - Hero Video */}
          <div className="relative flex items-center justify-center mt-8 lg:mt-0">
            <div className="relative w-full max-w-3xl">
              <video 
                className="w-full h-[400px] sm:h-[500px] lg:h-[600px] object-cover rounded-2xl shadow-2xl"
                autoPlay
                loop
                muted
                playsInline
                poster="/optimized/videos/home-hero-poster.webp"
                preload="auto"
              >
                <source src="/optimized/videos/home-hero.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>
              {/* Certification Overlay */}
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col sm:flex-row gap-2">
                <div className="bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-white/20">
                  <span className="text-xs font-medium text-primary">ISO 9001:2015</span>
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-white/20">
                  <span className="text-xs font-medium text-primary">NSF Certified</span>
                </div>
              </div>
              {/* Optional gradient overlay on left edge */}
              <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-primary/20 to-transparent rounded-l-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
