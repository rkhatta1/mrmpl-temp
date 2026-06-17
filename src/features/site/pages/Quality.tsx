// @ts-nocheck
"use client";
import { Shield, Microscope, Settings, Search, ArrowRight, FileCheck, Download, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@/lib/next-router";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AspectRatio } from "@/components/ui/AspectRatio";
import Header from "@/components/Header";
import OptimizedImage from "@/components/OptimizedImage";
const isoCertificate = "/optimized/site/quality/c2-1200.webp";
const nsfCertificate = "/optimized/site/quality/c1-1200.webp";

const Quality = () => {
  const navigate = useNavigate();
  
  useSEO(
    "Quality Testing | ISO & NSF Certified Brass Fittings",
    "50+ tests and inspections ensure zero-defect fittings. Certified ISO 9001:2015 & NSF for traceable, compliant manufacturing."
  );
  const heroRef = useScrollAnimation({ threshold: 0.2 });
  const processRef = useScrollAnimation({ threshold: 0.3 });
  const statsRef = useScrollAnimation({ threshold: 0.3 });
  const certificatesRef = useScrollAnimation({ threshold: 0.3 });
  const pdiRef = useScrollAnimation({ threshold: 0.3 });
  const ctaRef = useScrollAnimation({ threshold: 0.3 });
  const faqRef = useScrollAnimation({ threshold: 0.3 });
  
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqData = [
    {
      question: "Can you provide Material Test Certificates (MTCs)?",
      answer: "Yes. We maintain heat/lot traceability. MTCs and COC can be shared per shipment or on request."
    },
    {
      question: "Do you follow PPAP / Control Plans?",
      answer: "For automotive/engineering customers we support PPAP Level 3 (as required), with PFMEA inputs and control plans.",
      hasStrikethrough: true,
      // strikethroughText: "FMEA"
    },
    {
      question: "How do you handle customer complaints?",
      answer: "Structured OD/CAPA with root-cause tools, interim controls, and effectiveness verification.",
      hasStrikethrough: true,
      // strikethroughText: "5 Why, Ishikawa"
    },
    {
      question: "Are your brass components lead-free?",
      answer: "We manufacture both regular and lead-free alloys. NSF/ANSI 61 listed products are available for potable water applications."
    }
  ];

  const qualityProcesses = [
    {
      icon: Microscope,
      title: "Incoming Material Verification",
      description: "Every batch of raw material is carefully verified for composition, dimensions, and certification to ensure it meets our stringent standards before entering production.",
      image: "/optimized/site/quality/new/Incoming material verification-1200.webp"
    },
    {
      icon: CheckCircle,
      title: "First-Piece Approval",
      description: "We verify the first component during the setup phase, ensuring precision settings and flawless production from start to finish.",
      image: "/optimized/site/quality/new/first piece approval-1200.webp"
    },
    {
      icon: Settings,
      title: "In-Process Quality Control",
      description: "Continuous online quality checks are carried out throughout the machining and manufacturing stages to maintain consistency and precision.",
      image: "/optimized/site/quality/In process quality-1200.webp"
    },
    {
      icon: FileCheck,
      title: "Receiving Inspection Report (RIR)",
      description: "A detailed inspection report is generated upon receipt and approval of materials, ensuring complete traceability and compliance with specifications.",
      image: "/optimized/site/quality/new/Receiving inspection report-1200.webp"
    },
    {
      icon: Search,
      title: "Comprehensive Visual Examination",
      description: "Each component undergoes a meticulous visual inspection to eliminate even the smallest imperfections and guarantee flawless finishing.",
      image: "/optimized/site/quality/Visual Examination-1200.webp"
    },
    {
      icon: Shield,
      title: "Pre-Dispatch Quality Validation",
      description: "Before shipment, a final inspection and validation report confirms that every product aligns with customer requirements and international quality benchmarks.",
      image: "/optimized/site/quality/Pre disptach-1200.webp"
    }
  ];

  const qualityStats = [
    { value: "99.8%", label: "Quality Pass Rate" },
    { value: "15+", label: "Years ISO Certified" },
    { value: "50+", label: "Testing Parameters" },
    { value: "100%", label: "Standard Compliance" }
  ];

  const certificates = [
    {
      image: isoCertificate,
      title: "ISO 9001:2015 Certified",
      issuer: "TUV SUD",
      description: "Quality Management Systems certification ensuring consistent product quality and customer satisfaction.",
      icon: Shield
    },
    {
      image: nsfCertificate,
      title: "NSF Certified",
      issuer: "NSF International",
      description: "Lead-Free brass fittings certification meeting the highest safety and quality standards.",
      icon: CheckCircle
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-background">
        <div className="container mx-auto px-4">
          <div
            ref={heroRef.elementRef}
            className={`text-center transition-all duration-700 ease-out ${
              heroRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-sm font-medium text-muted-foreground mb-4 tracking-wider uppercase">
          Quality
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight">
              Excellence You Can Trust
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-12">
              At Mayank Raw Mint, quality is not a department, it is a culture. From sourcing raw materials to the final dispatch, every process is designed for precision, safety, and customer satisfaction.
            </p>
            
            {/* ISO and NSF Certifications with Icons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <div className="flex items-center gap-3 bg-card border border-green-600 rounded-lg px-6 py-4 shadow-sm">
                <Shield className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <div className="font-semibold text-foreground">ISO 9001:2015</div>
                  <div className="text-sm text-muted-foreground">TUV SUD Certified</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-card border border-green-600 rounded-lg px-6 py-4 shadow-sm">
                <CheckCircle className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <div className="font-semibold text-foreground">NSF Certified</div>
                  <div className="text-sm text-muted-foreground">Lead-Free Standards</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Process - Visual Timeline */}
      <section className="pb-2 bg-accent/20">
        <div className="container mx-auto px-4">
          <div
            ref={processRef.elementRef}
            className={`text-center mb-16 transition-all duration-700 ease-out ${
              processRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Process</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive six-step quality assurance process ensuring excellence from raw materials to final dispatch
            </p>
          </div>

          {/* Process Grid */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {qualityProcesses.map((process, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ease-out ${
                    processRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <Card className="h-full hover:shadow-elegant transition-shadow duration-300 border-l-4 border-l-primary overflow-hidden">
                    {/* Process Image */}
                    <div className="aspect-video relative overflow-hidden bg-gray-100">
                      <img
                        src={process.image}
                        alt={process.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide image if it fails to load
                          e.target.style.display = 'none';
                        }}
                      />
                      {/* Fallback icon display if image doesn't load */}
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <process.icon className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <process.icon className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-primary mb-1">Step {index + 1}</div>
                          <CardTitle className="text-xl leading-tight text-left">{process.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm leading-relaxed text-left">
                        {process.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            
            {/* Process Flow Indicator */}
            {/* <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="w-8 h-0.5 bg-primary"></div>
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="w-8 h-0.5 bg-primary"></div>
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="w-8 h-0.5 bg-primary"></div>
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="w-8 h-0.5 bg-primary"></div>
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
            </div> */}

            {/* Process Flow PDF Button */}
            <div className="mt-12 flex justify-center text-white">
              <Button
                onClick={() => window.open('/quality/Process Flow MRM.pdf', '_blank')}
                size="lg"
                className="shadow-elegant hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                View Process Flow
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quality at a Glance - Stats Grid */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div
            ref={statsRef.elementRef}
            className={`text-center mb-8 transition-all duration-700 ease-out ${
              statsRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Quality at a Glance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our commitment to excellence reflected in numbers
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {qualityStats.map((stat, index) => (
              <div
                key={index}
                ref={statsRef.elementRef}
                className={`transition-all duration-500 ease-out ${
                  statsRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card className="text-center p-6 hover:shadow-elegant transition-shadow duration-300">
                  <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Certifications */}
      <section className="py-8 bg-accent/20">
        <div className="container mx-auto px-4">
          <div
            ref={certificatesRef.elementRef}
            className={`text-center mb-12 transition-all duration-700 ease-out ${
              certificatesRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Certifications</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Recognized by leading international bodies for our commitment to quality and safety
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {certificates.map((cert, index) => (
              <div
                key={index}
                ref={certificatesRef.elementRef}
                className={`transition-all duration-500 ease-out ${
                  certificatesRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <Card className="overflow-hidden hover:shadow-elegant transition-shadow duration-300">
                  <div className="aspect-[4/3] relative">
                    <img
                      src={cert.image}
                      alt={cert.title}
                      className="w-full h-full object-contain bg-white p-4"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-3">
                      <cert.icon className="h-6 w-6 text-primary" />
                      {cert.title}
                    </CardTitle>
                    <CardDescription className="text-primary font-medium">
                      Certified by {cert.issuer}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {cert.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Gallery */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div
            ref={certificatesRef.elementRef}
            className={`text-center mb-12 transition-all duration-700 ease-out ${
              certificatesRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Quality Gallery</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A visual showcase of our quality processes, testing equipment, and manufacturing excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div
              ref={certificatesRef.elementRef}
              className={`transition-all duration-500 ease-out ${
                certificatesRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "0ms" }}
            >
              <Card className="overflow-hidden hover:shadow-elegant transition-shadow duration-300">
                <div className="aspect-[4/3] relative">
                  <OptimizedImage
                    src="/optimized/site/quality/new/Gallery-1-1200.webp"
                    alt="Quality Process"
                    className="w-full h-full"
                    aspectRatio="4/3"
                    objectFit="cover"
                    sizes={{
                      mobile: '100vw',
                      tablet: '50vw',
                      desktop: '33vw'
                    }}
                  />
                </div>
              </Card>
            </div>

            {/* <div
              ref={certificatesRef.elementRef}
              className={`transition-all duration-500 ease-out ${
                certificatesRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "100ms" }}
            >
              <Card className="overflow-hidden hover:shadow-elegant transition-shadow duration-300">
                <div className="aspect-[4/3] relative">
                  <img
                    src="/optimized/site/quality/c1-1200.webp"
                    alt="Quality Testing"
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>
            </div> */}

            {/* <div
              ref={certificatesRef.elementRef}
              className={`transition-all duration-500 ease-out ${
                certificatesRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              <Card className="overflow-hidden hover:shadow-elegant transition-shadow duration-300">
                <div className="aspect-[4/3] relative">
                  <img
                    src="/optimized/site/quality/c2-1200.webp"
                    alt="Manufacturing Process"
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>
            </div> */}

            <div
              ref={certificatesRef.elementRef}
              className={`transition-all duration-500 ease-out ${
                certificatesRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "300ms" }}
            >
              <Card className="overflow-hidden hover:shadow-elegant transition-shadow duration-300">
                <div className="aspect-[4/3] relative">
                  <OptimizedImage
                    src="/optimized/site/quality/new/Gallery-2-1080.webp"
                    alt="NDT Testing"
                    className="w-full h-full"
                    aspectRatio="4/3"
                    objectFit="cover"
                    sizes={{
                      mobile: '100vw',
                      tablet: '50vw',
                      desktop: '33vw'
                    }}
                  />
                </div>
              </Card>
            </div>

            <div
              ref={certificatesRef.elementRef}
              className={`transition-all duration-500 ease-out ${
                certificatesRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <Card className="overflow-hidden hover:shadow-elegant transition-shadow duration-300">
                <div className="aspect-[4/3] relative">
                  <OptimizedImage
                    src="/optimized/site/quality/new/gallery-3-1200.webp"
                    alt="Spectrometer Testing"
                    className="w-full h-full"
                    aspectRatio="4/3"
                    objectFit="cover"
                    sizes={{
                      mobile: '100vw',
                      tablet: '50vw',
                      desktop: '33vw'
                    }}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Inspection & Testing Facilities */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div
            ref={certificatesRef.elementRef}
            className={`text-center mb-12 transition-all duration-700 ease-out ${
              certificatesRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Inspection & Testing Facilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              State-of-the-art equipment ensuring precision and quality in every product
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-green-600 rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-foreground mb-6 text-center">Lab & Gauging</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Hardness Tester (Rockwell/Brinell)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Digital Vernier, Micrometers, Height Gauges</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Thread Plug/Ring Gauges (NPT, BSP, SAE)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Spectrometer (Alloy Chemistry)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Plating Thickness Gauge (μm)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">Profile Projector</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-8 bg-accent/20">
        <div className="container mx-auto px-4">
          <div
            className={`text-center mb-12 transition-all duration-700 ease-out opacity-100 translate-y-0"
            }`}
          >
            <h2 className="text-3xl text-black font-bold mb-4">FAQs</h2>
            <p className=" max-w-2xl mx-auto">
              Frequently asked questions about our quality processes and certifications
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
                {faqData.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <h3 className="text-lg font-semibold text-foreground pr-4">
                        {faq.hasStrikethrough ? (
                          <>
                            {faq.question.split(faq.strikethroughText)[0]}
                            <span className="line-through text-red-500">{faq.strikethroughText}</span>
                            {faq.question.split(faq.strikethroughText)[1]}
                          </>
                        ) : (
                          faq.question
                        )}
                      </h3>
                      {openFAQ === index ? (
                        <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </button>
                    {openFAQ === index && (
                      <div className="px-6 pb-4">
                        <div className="border-t border-gray-200 pt-4">
                          <p className="text-muted-foreground">
                            {faq.hasStrikethrough ? (
                              <>
                                {faq.answer.split(faq.strikethroughText)[0]}
                                <span className="line-through text-red-500">{faq.strikethroughText}</span>
                                {faq.answer.split(faq.strikethroughText)[1]}
                              </>
                            ) : (
                              faq.answer
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Quality Team Section */}
      {/* <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-green-600 rounded-lg p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                    Ready for audits & supplier approvals
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">
                    Need specific certificates, test reports, or samples?
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Share your spec sheet or drawing; our team will revert with a compliance pack.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/contact')}
                    className="bg-primary text-white hover:bg-primary/90 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg px-8 py-4 text-lg"
                  >
                    Contact Quality Team
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Quality Check Before Dispatch */}
      {/* <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div
              ref={pdiRef.elementRef}
              className={`transition-all duration-700 ease-out ${
                pdiRef.isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              }`}
            >
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Quality Check Before Dispatch
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Before leaving our facility, every order is inspected through a Pre-Dispatch Inspection Report (PDI). Each parameter, from dimensions to markings, is verified against strict tolerances.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">Defect-free products only</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">Complete traceability for two years</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">Transparent reporting for customers</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => window.open('/PDIR.pdf', '_blank')}
                  className="shadow-elegant hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <Search className="h-4 w-4 mr-2" />
                  View Sample Report
                </Button>
                <Button variant="outline" size="lg" className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>

            <div
              ref={pdiRef.elementRef}
              className={`transition-all duration-700 ease-out ${
                pdiRef.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              <Card className="overflow-hidden shadow-elegant">
                <div className="relative">
                  <AspectRatio ratio={3/4}>
                    <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10 p-8 flex items-center justify-center">
                      <div className="text-center">
                        <FileCheck className="h-24 w-24 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">Sample Inspection Sheet</h3>
                        <p className="text-muted-foreground text-sm">Pre-Dispatch Inspection Report</p>
                      </div>
                    </div>
                  </AspectRatio>
                  <div className="absolute top-4 right-4">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                      PDI Report
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4 text-center">
          <div
            ref={ctaRef.elementRef}
            className={`transition-all duration-700 ease-out ${
              ctaRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
            Need specific certificates, test reports, or samples?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Partner with us for products that meet the highest international standards — precise, reliable, and safe every time.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/contact')}
              className="shadow-elegant text-white hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              Contact Quality Team
            </Button>
          </div>
        </div>
      </section>


    </div>
  );
};

export default Quality;
