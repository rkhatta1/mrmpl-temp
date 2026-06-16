// @ts-nocheck
"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "@/lib/next-router";

const RetailSolutions = () => {
  const { elementRef: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { elementRef: galleryRef, isVisible: galleryVisible } = useScrollAnimation();

  const images = [
    { 
      src: "/optimized/site/capabilities/Retail packaging/25-1080.webp", 
      alt: "Retail packaging facility", 
      title: "Branded Boxes & Bags" 
    },
    { 
      src: "/optimized/site/capabilities/Retail packaging/26-1080.webp", 
      alt: "Packaging logistics", 
      title: "Full-Color Printing" 
    },
    { 
      src: "/optimized/site/capabilities/Retail packaging/27-1080.webp", 
      alt: "Quality packaging", 
      title: "Retail Visibility" 
    },
    { 
      src: "/optimized/site/capabilities/Retail packaging/28-1080.webp", 
      alt: "Supply chain integration", 
      title: "Supply Chain Integration" 
    }
  ];

  return (
    <div className="bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative py-24 px-4 pt-32">
        <div 
          ref={heroRef}
          className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
            heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/capabilities" className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                <ArrowLeft className="h-4 w-4" />
                Back to Capabilities
              </Link>
            </Button>
          </div>
          
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            OUR CAPABILITIES
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 leading-tight">
            Retail Packaging Solutions
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-xl leading-relaxed mb-6">
              Custom retail packaging designed to showcase your brand and product identity.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              Branded boxes, zip-lock bags, and barcode stickers with black-and-white or full-color printing options. Designed for retail visibility and convenience.
            </p>
            
            <p className="text-lg leading-relaxed">
              Our seamless integration into your supply chain ensures that your products are professionally packaged and ready for retail distribution.
            </p>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div 
            ref={galleryRef}
            className={`transition-all duration-1000 ${
              galleryVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Retail Packaging Excellence</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {images.map((image, index) => (
                <motion.div 
                  key={index}
                  className="group relative overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex-1">
            <Button variant="ghost" asChild>
              <Link to="/capabilities/in-house-manufacturing" className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                <ArrowLeft className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm text-gray-500">Previous</div>
                  <div className="font-medium">In-House Engineering Expertise</div>
                </div>
              </Link>
            </Button>
          </div>
          <div className="flex-1 flex justify-end">
            <Button variant="ghost" asChild>
              <Link to="/capabilities/buffoli-machines" className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Next</div>
                  <div className="font-medium">Buffoli Multi Transfer Machine</div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-50">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">Ready to Experience Our Capabilities?</h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Our team is here to provide tailored solutions for your specific brass fitting needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 bg-green-600 text-white hover:bg-green-700"
              onClick={() => window.location.href = '/contact'}
            >
              Request a Quote
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 border-gray-300 text-gray-700 hover:bg-green-50 hover:text-green-600"
              onClick={() => window.location.href = '/contact'}
            >
              Contact Our Engineering Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RetailSolutions;
