// @ts-nocheck
"use client";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { ArrowRight, Cpu, Leaf, Wrench, Package, Award, Building2 } from "lucide-react";
import { useNavigate } from "@/lib/next-router";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const CapabilitiesSection = () => {
  const navigate = useNavigate();
  const { elementRef, isVisible } = useScrollAnimation();

  const capabilities = [
    {
      icon: Cpu,
      title: "Buffoli CNC Machines",
      description: "Advanced Swiss-type CNC technology for precision manufacturing",
      link: "/capabilities/buffoli-machines"
    },
    {
      icon: Leaf,
      title: "Lead-Free Innovation", 
      description: "Eco-friendly brass fittings meeting NSF and environmental standards",
      link: "/capabilities/lead-free"
    },
    {
      icon: Wrench,
      title: "Custom Engineering",
      description: "Tailored solutions for unique industrial requirements",
      link: "/capabilities/custom-assembly"
    },
    {
      icon: Package,
      title: "One-Stop Solution",
      description: "Complete manufacturing, quality control, and logistics support",
      link: "/capabilities/one-stop-solution"
    },
    {
      icon: Award,
      title: "ISO 9001:2015 Certified",
      description: "International quality management standards compliance",
      link: "/capabilities/iso-9001"
    },
    {
      icon: Building2,
      title: "In-House Manufacturing",
      description: "Complete control over production quality and timelines",
      link: "/capabilities/in-house-manufacturing"
    }
  ];

  return (
    <section ref={elementRef} className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className={`text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Choose us?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced machinery & technology, certified processes, and in-house expertise to deliver precision and innovation at scale.
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {capabilities.map((capability, index) => (
            <Card 
              key={index}
              className="shadow-lg hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-green-300 cursor-pointer group"
              style={{ transitionDelay: `${index * 0.1}s` }}
              onClick={() => navigate(capability.link)}
            >
              <CardContent className="p-6 pt-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors duration-300 flex items-center justify-center flex-shrink-0">
                    <capability.icon className="h-6 w-6 text-green-600 group-hover:text-green-700 transition-colors duration-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors duration-300 mb-2">{capability.title}</h3>
                    <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">{capability.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            onClick={() => navigate('/capabilities')}
            className="bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            Explore All Capabilities
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CapabilitiesSection;
