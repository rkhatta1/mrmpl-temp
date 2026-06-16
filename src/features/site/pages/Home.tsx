// @ts-nocheck
"use client";
import HeroSection from "@/components/HeroSection";
import CompanyBrief from "@/components/CompanyBrief";
import StatsSection from "@/components/StatsSection";
import ProductCategoriesSection from "@/components/ProductCategoriesSection";
import CapabilitiesSection from "@/components/CapabilitiesSection";
import QualitySection from "@/components/QualitySection";
import MetalPricesTracker from "@/components/MetalPricesTracker";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "@/lib/next-router";
import { FileText, MessageCircle } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const ctaRef = useScrollAnimation({ threshold: 0.3 });
  
  // Structured Data for Organization
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "ManufacturingBusiness",
    "name": "Mayank Raw Mint Pvt. Ltd.",
    "alternateName": "Mayank Raw Mint",
    "url": "https://www.mayankrawmint.com",
    "logo": "https://www.mayankrawmint.com/logo.png",
    "description": "ISO 9001:2015 & NSF-certified manufacturer of custom brass fittings for global industries since 2008.",
    "foundingDate": "2008",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Plot No. 10 to 15, Survey No.421, B/H Murlidhar Tractor, Hapa, Jamnagar - Rajkot Highway",
      "addressLocality": "Jamnagar",
      "postalCode": "361120",
      "addressRegion": "Gujarat",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-96245-33303",
      "contactType": "Sales",
      "email": "info@mayankrawmint.com",
      "areaServed": "Worldwide",
      "availableLanguage": ["English", "Hindi", "Gujarati"]
    },
    "sameAs": [
      "https://www.linkedin.com/company/mayank-raw-mint",
      "https://www.youtube.com/@mayankrawmintpvt.ltd.7687"
    ],
    "hasCredential": [
      {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "ISO 9001:2015 Certification"
      },
      {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "NSF/ANSI 61 Certification"
      }
    ]
  };
  
  useSEO(
    "Precision Brass Fittings Manufacturer | Mayank Raw Mint",
    "ISO 9001:2015 & NSF-certified manufacturer of custom brass fittings for global industries since 2008. Trusted for quality and precision.",
    {
      image: "/optimized/site/logo-86.webp",
      url: "/",
      structuredData: organizationStructuredData
    }
  );

  return (
    <div>
      <HeroSection />
      <CompanyBrief />
      <StatsSection />
      <ProductCategoriesSection />
      <CapabilitiesSection />
      <QualitySection />
      <MetalPricesTracker />
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4 text-center">
          <div
            ref={ctaRef.elementRef}
            className={`transition-all duration-700 ease-out ${
              ctaRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to Work With Us?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
              Partner with Mayank Raw Mint for precision fittings, sustainable manufacturing, and world-class service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/contact')}
                className="bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer px-8 flex items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Request a Quote
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                onClick={() => navigate('/contact')}
                className="bg-white text-green-600 border-green-600 hover:bg-green-50 transition-all duration-300 cursor-pointer px-8 flex items-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Contact Our Team
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
