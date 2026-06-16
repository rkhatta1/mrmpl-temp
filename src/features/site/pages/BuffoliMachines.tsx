// @ts-nocheck
"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "@/lib/next-router";

const BuffoliMachines = () => {
  const { elementRef: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { elementRef: galleryRef, isVisible: galleryVisible } = useScrollAnimation();

  const images = [
    { 
      src: "/optimized/site/capabilities/Buffoli/1-1080.webp", 
      alt: "Buffoli CNC machine in operation", 
      title: "Advanced CNC Technology" 
    },
    { 
      src: "/optimized/site/capabilities/Buffoli/2-1080.webp", 
      alt: "Buffoli machine control panel", 
      title: "Precision Controls" 
    },
    { 
      src: "/optimized/site/capabilities/Buffoli/3-1080.webp", 
      alt: "High-quality machined parts", 
      title: "Quality Components" 
    },
    { 
      src: "/optimized/site/capabilities/Buffoli/4-1080.webp", 
      alt: "Automated tool changer system", 
      title: "Advanced Tooling" 
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
            Buffoli Multi Transfer Machine
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-xl leading-relaxed mb-6">
              Latest-generation turning centres from Buffoli, Italy. High-speed and high-precision CNC multi-spindle transfer machines for world-class production.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              Complete fittings machined in as little as 4 seconds with fully automated machining and minimal human intervention. Double-spindle units ensure precision and consistency with Italian engineering delivering superior quality.
            </p>
            
            <p className="text-lg leading-relaxed">
              From complex geometries to high-volume production runs, our Buffoli machines handle diverse manufacturing challenges with precision and speed. Experience the difference that world-class Italian engineering makes.
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
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Buffoli Machine Technology</h2>
            
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
              <Link to="/capabilities/retail-solutions" className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                <ArrowLeft className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm text-gray-500">Previous</div>
                  <div className="font-medium">Retail Packaging Solutions</div>
                </div>
              </Link>
            </Button>
          </div>
          <div className="flex-1 flex justify-end">
            <Button variant="ghost" asChild>
              <Link to="/capabilities/one-stop-solution" className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Next</div>
                  <div className="font-medium">One-Stop Manufacturing Solution</div>
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

export default BuffoliMachines;
