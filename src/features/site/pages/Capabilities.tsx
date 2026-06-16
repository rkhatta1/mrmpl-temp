// @ts-nocheck
"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "@/lib/next-router";
import OptimizedImage from "@/components/OptimizedImage";
import { 
  Settings, 
  Award, 
  Shield, 
  CheckCircle, 
  Cog, 
  Wrench, 
  Users, 
  Package,
  Factory,
  Zap,
  Target,
  Clock,
  ArrowRight
} from "lucide-react";

// Images are loaded from public/capabilities folder

const Capabilities = () => {
  useSEO(
    "Manufacturing Capabilities | Custom Brass Solutions",
    "Advanced CNC machining, lead-free innovation & in-house production for precision brass fittings tailored to your needs."
  );
  
  const heroAnimation = useScrollAnimation();
  const capabilitiesAnimation = useScrollAnimation();
  const featuresAnimation = useScrollAnimation();

  const capabilities = [
    {
      id: "buffoli-machines",
      image: "/optimized/site/capabilities/Landing pages/Buffoli-1024.webp",
      icon: Settings,
      title: "Buffoli Multi Transfer Machine",
      description: "Latest-generation turning centres from Buffoli, Italy. High-speed and high-precision CNC multi-spindle transfer machines for world-class production.",
      highlights: [
        "Complete fittings machined in as little as 4 seconds",
        "Fully automated machining with minimal human intervention",
        "Double-spindle units ensure precision and consistency",
        "Italian engineering delivers superior quality"
      ]
    },
    {
      id: "one-stop-solution",
      image: "/optimized/site/capabilities/Landing pages/One stop solution-1024.webp",
      icon: Target,
      title: "One-Stop Manufacturing Solution",
      description: "End-to-end manufacturing of brass products, from design to delivery, built on internationally approved materials and processes.",
      highlights: [
        "Single source for all your brass component needs",
        "Access to the latest global technologies",
        "Competitive pricing without compromising quality",
        "Reliable and on-time supply"
      ]
    },
    {
      id: "iso-9001",
      image: "/optimized/site/capabilities/Landing pages/ISO-1024.webp",
      icon: Award,
      title: "ISO 9001:2015 Certified",
      description: "Our ISO-certified quality system ensures every product meets the highest global standards.",
      highlights: [
        "Rigorous quality checks at every stage",
        "Ongoing employee training and education",
        "Continuous improvement culture",
        "State-of-the-art testing and measurement"
      ]
    },
    {
      id: "nsf-certified",
      image: "/optimized/site/capabilities/Landing pages/NSF-1024.webp",
      icon: Shield,
      title: "NSF Certified Company",
      description: "Among the few Indian manufacturers certified by NSF/ANSI 61, authorized to bear the NSF mark on lead-free products.",
      highlights: [
        "Verified compliance by independent third parties",
        "Lead-free materials tested for safety",
        "Transparent product identification and labeling",
        "Trusted globally for water safety standards"
      ]
    },
    {
      id: "lead-free",
      image: "/optimized/site/capabilities/Landing pages/Lead free-1024.webp",
      icon: CheckCircle,
      title: "Lead-Free Fittings",
      description: "Pioneers in India's lead-free manufacturing, launching our first compliant line in 2011 and fully aligned with the Reduction of Lead in Drinking Water Act.",
      highlights: [
        "Full range of NSF-compliant lead-free brass fittings",
        "Clear 'LF' marking for easy recognition",
        "Safe, sustainable, and competitively priced",
        "Proven track record in lead-free innovation"
      ]
    },
    {
      id: "custom-assembly",
      image: "/optimized/site/capabilities/Landing pages/custom compoennts-1024.webp",
      icon: Wrench,
      title: "Custom Components & Assembly",
      description: "Tailored solutions to match your unique requirements, designed, machined, and assembled in-house.",
      highlights: [
        "Complex machining for parts from 5mm to 135mm",
        "Brass, bronze, aluminum, stainless steel options",
        "Vibraseal and Loctite applications available",
        "Flexible design-to-delivery process"
      ]
    },
    {
      id: "contract-manufacturing",
      image: "/optimized/site/capabilities/Landing pages/Contact manufacturing-1024.webp",
      icon: Cog,
      title: "Contract Manufacturing",
      description: "Flexible machining solutions designed for speed, precision, and cost-efficiency.",
      highlights: [
        "Latest CNC milling and turning technology",
        "Reduced setup and cycle times",
        "Fastest turnaround in the industry",
        "Competitive global pricing"
      ]
    },
    {
      id: "in-house-manufacturing",
      image: "/optimized/site/capabilities/Landing pages/Inhouse engineering-1024.webp",
      icon: Users,
      title: "In-House Engineering Expertise",
      description: "A team of skilled engineers working with you from concept to final product.",
      highlights: [
        "Cost optimization without quality compromise",
        "2D and 3D CAD support for product development",
        "Strategic material selection guidance",
        "Ongoing innovation to improve performance"
      ]
    },
    {
      id: "retail-solutions",
      image: "/optimized/site/capabilities/Landing pages/Retail packaging-1024.webp",
      icon: Package,
      title: "Retail Packaging Solutions",
      description: "Custom retail packaging designed to showcase your brand and product identity.",
      highlights: [
        "Branded boxes, zip-lock bags, and barcode stickers",
        "Black-and-white or full-color printing options",
        "Designed for retail visibility and convenience",
        "Seamless integration into your supply chain"
      ]
    }
  ];

  const features = [
    { icon: Factory, title: "Advanced Manufacturing", description: "State-of-the-art facilities with latest technology" },
    { icon: Shield, title: "Quality Assurance", description: "ISO 9001:2015 and NSF certified processes" },
    { icon: Zap, title: "High Efficiency", description: "Fastest turnaround times in the industry" },
    { icon: Clock, title: "Quick Delivery", description: "Reliable and timely product delivery" }
  ];

  return (
    <div className="bg-white text-gray-900">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gray-500 text-sm mb-2 uppercase tracking-wider">OUR CAPABILITIES</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
              Precision, Quality, and Innovation in Every Product
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            At Mayank Raw Mint, we maintain complete control over every stage of production — from raw material selection and alloying to forging, machining, and final finishing. Our end-to-end manufacturing process ensures consistent quality, dimensional accuracy, and superior performance in every brass component.
            </p>
            {/* <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            With internationally approved materials, advanced machining technology, and stringent quality checks at each stage, we deliver components that meet global standards of excellence.
            </p>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Enjoy the convenience of a single, reliable source for all your brass requirements — backed by competitive pricing, on-time delivery, and a seamless supply chain designed for efficiency and trust.
            </p> */}
          </motion.div>
        </div>
      </section>

      {/* Detailed Capabilities */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {capabilities.map((capability, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                >
                  <Link to={`/capabilities/${capability.id}`}>
                    <Card className="border-gray-200 hover:border-green-300 transition-all duration-300 hover:shadow-xl group overflow-hidden cursor-pointer h-full">
                      {/* Image Header */}
                      <div className="relative aspect-square bg-gray-50 overflow-hidden">
                        <OptimizedImage
                          src={capability.image}
                          alt={capability.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          aspectRatio="1/1"
                          sizes={{
                            mobile: '100vw',
                            tablet: '50vw',
                            desktop: '33vw'
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white/20 text-white backdrop-blur-sm">
                            <capability.icon className="h-8 w-8" />
                          </div>
                        </div>
                      </div>
                      
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl mb-2 group-hover:text-green-600 transition-colors">
                          {capability.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <CardDescription className="text-base mb-6 leading-relaxed text-gray-600">
                          {capability.description}
                        </CardDescription>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                            Key Highlights
                          </h4>
                          <ul className="space-y-2">
                            {capability.highlights.map((highlight, highlightIndex) => (
                              <li key={highlightIndex} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600">{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <Button variant="outline" className="w-full group pointer-events-none">
                            <span className="flex items-center justify-center gap-2">
                              Learn More
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      {/* <section className="py-20 bg-gradient-to-r from-green-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Why Choose Our Capabilities?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our comprehensive manufacturing capabilities are backed by cutting-edge technology, 
              rigorous quality standards, and decades of industry expertise.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-black mb-6">Ready to Experience Our Capabilities?</h2>
            <p className="text-xl text-black mb-8 leading-relaxed">
              Our team is here to provide tailored solutions for your specific brass fitting needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 bg-white text-white hover:bg-gray-100"
                onClick={() => window.location.href = '/contact'}
              >
                Request a Quote
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className=" cursor-pointer text-lg px-8 border-gray-100 text-black hover:bg-green-100 hover:text-green-600"
                onClick={() => window.location.href = '/contact'}
              >
                Contact Our Engineering Team
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Capabilities;
