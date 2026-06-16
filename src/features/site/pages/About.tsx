// @ts-nocheck
"use client";
import { motion } from "framer-motion";
import { SECTORS } from '@/constants/applications';
import { useSEO } from "@/hooks/useSEO";
import {
  Award,
  Users,
  Factory,
  TrendingUp,
  Shield,
  Globe,
  CheckCircle,
  UsersIcon,
  ShieldCheck,
  Clock,
  GlobeIcon,
  Thermometer,
  Car,
  Wrench,
  Droplets,
  Gauge,
  Sprout,
  Zap,
  Settings,
  Wind,
  Fuel,
  Waves,
  Handshake,
  HardHat
} from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

// Timeline component
const CompanyTimeline = () => {
  const timelineEvents = [
    {
      year: "2008",
      title: "Company Founded",
      description: "Mayank Raw Mint established with a vision to provide quality brass fittings",
      image: "/optimized/site/about/history-1-505.webp",
      milestone: true
    },
    {
      year: "2010",
      title: "First Export",
      description: "Successfully expanded to international markets with first export shipment",
      image: "/optimized/site/about/history-2-505.webp"
    },
    {
      year: "2012",
      title: "ISO 9001 Certification",
      description: "Achieved ISO 9001:2015 certification for quality management systems",
      image: "/optimized/site/about/history-3-505.webp",
      milestone: true
    },
    {
      year: "2015",
      title: "NSF Certification",
      description: "Obtained NSF certification for lead-free brass fittings",
      image: "/optimized/site/about/history-4-505.webp"
    },
    {
      year: "2018",
      title: "Advanced Manufacturing",
      description: "Introduced Buffoli machines and advanced CNC manufacturing capabilities",
      image: "/optimized/site/about/history-5-505.webp",
      milestone: true
    },
    {
      year: "2020",
      title: "Digital Transformation",
      description: "Implemented digital systems for enhanced production and quality control",
      image: "/optimized/site/about/history-6-480.webp"
    },
    {
      year: "2023",
      title: "Global Expansion",
      description: "Established presence in 25+ countries with comprehensive product range",
      image: "/optimized/site/about/history-7-1024.webp",
      milestone: true
    }
  ];

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-green-600 to-green-600/20 h-full hidden md:block" />

      {/* Mobile Timeline Line */}
      <div className="absolute left-8 w-1 bg-gradient-to-b from-green-600 to-green-600/20 h-full md:hidden" />

      <div className="space-y-12">
        {timelineEvents.map((event, index) => (
          <motion.div
            key={event.year}
            className="relative transition-all duration-700 ease-out"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: index * 0.1 }}
          >
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center">
              {index % 2 === 0 ? (
                // Left side content
                <>
                  <div className="w-1/2 pr-12 text-right">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                      <div className="aspect-video relative">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6 space-y-3">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                          {event.year}
                        </span>
                        <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
                        <p className="text-gray-600">{event.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full border-4 border-white shadow-lg transition-all duration-500 ${event.milestone
                      ? "bg-green-600 scale-125"
                      : "bg-gray-400"
                      }`} />
                  </div>
                  <div className="w-1/2 pl-12" />
                </>
              ) : (
                // Right side content
                <>
                  <div className="w-1/2 pr-12" />
                  <div className="relative flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full border-4 border-white shadow-lg transition-all duration-500 ${event.milestone
                      ? "bg-green-600 scale-125"
                      : "bg-gray-400"
                      }`} />
                  </div>
                  <div className="w-1/2 pl-12">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                      <div className="aspect-video relative">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6 space-y-3">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                          {event.year}
                        </span>
                        <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
                        <p className="text-gray-600">{event.description}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden flex items-start gap-6">
              <div className="relative flex-shrink-0">
                <div className={`w-6 h-6 rounded-full border-4 border-white shadow-lg transition-all duration-500 ${event.milestone
                  ? "bg-green-600 scale-125"
                  : "bg-gray-400"
                  }`} />
              </div>
              <div className="flex-1">
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      {event.year}
                    </span>
                    <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
                    <p className="text-gray-600">{event.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ApplicationSectorsSection = () => {
  const { elementRef, isVisible } = useScrollAnimation();

  const sectors = SECTORS;

  return (
    <section ref={elementRef} className="pb-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Applicative Sectors</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Supporting diverse industries with the right fittings, materials, and engineering expertise.
          </p>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
          {sectors.map((sector, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-6 bg-background rounded-lg shadow-soft hover:shadow-elevated transition-smooth border border-border/50 border-gray-50"
              style={{ transitionDelay: `${index * 0.05}s` }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <sector.icon className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-medium text-center text-foreground">{sector.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function About() {
  useSEO(
    "About Mayank Raw Mint | Trusted Brass Fittings Exporter",
    "Leading brass fittings manufacturer from India with 15+ years of expertise in precision engineering and sustainable manufacturing."
  );
  
  const capabilities = [
    {
      icon: Award,
      number: "17+",
      label: "Years of Excellence",
      description: "In design and development of precision brass fittings"
    },
    {
      icon: Users,
      number: "100+",
      label: "Dedicated Team",
      description: "Engineers and technicians committed to innovation"
    },
    {
      icon: Factory,
      number: "50 Million",
      label: "Production Capacity",
      description: "Units per month with state-of-the-art machinery"
    },
    // {
    //   icon: TrendingUp,
    //   number: "500+",
    //   label: "Projects Delivered",
    //   description: "Successful custom solutions across industries"
    // },
    // {
    //   icon: Shield,
    //   number: "99.8%",
    //   label: "Quality Assurance",
    //   description: "Precision manufacturing with zero-defect approach"
    // },
    // {
    //   icon: Globe,
    //   number: "15+",
    //   label: "Countries Served",
    //   description: "Global presence with reliable distribution"
    // }
  ];

  const values = [
    {
      icon: CheckCircle,
      title: "Quality First",
      description: "We ensure all our materials meet the highest industry standards and specifications."
    },
    {
      icon: UsersIcon,
      title: "Customer Focus",
      description: "Our customers' success is our success. We go above and beyond to meet their needs."
    },
    {
      icon: ShieldCheck,
      title: "Trust & Reliability",
      description: "We build long-term relationships based on trust, transparency, and reliable service."
    },
    {
      icon: Clock,
      title: "Timely Delivery",
      description: "We understand the importance of deadlines and ensure timely delivery every time."
    },
    {
      icon: Handshake,
      title: "Teamwork",
      description: "We foster a collaborative environment where every team member's contribution is valued and respected."
    },
    {
      icon: HardHat,
      title: "Safety",
      description: "Safety is our top priority. We maintain the highest safety standards in all our operations and facilities."
    }
  ];

  return (
    <div className="bg-white text-gray-900">
      {/* Hero Section */}
      <section className="pt-32 pb-2 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gray-500 text-sm mb-2 uppercase tracking-wider">ABOUT US</p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
              Trusted Excellence Since 2008
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              From the industry's most common brass fittings like compression, flare, pipe, and house barb to custom engineered products, we combine decades of expertise with innovative manufacturing to deliver solutions you can trust.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Video Player Section */}
        <motion.div
          className="flex justify-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="w-full max-w-7xl">
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
              {/* Video Container */}
              <div className="relative w-full">
                <video
                  className="w-full h-auto"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="auto"
                  poster="/optimized/videos/about-us-poster.webp"
                >
                  <source src="/optimized/videos/about-us.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video Info Overlay (Desktop) */}
              {/* <div className="hidden md:flex items-center justify-between p-4 bg-gray-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MAYANK</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">MRMPL Corporate Video</h3>
                    <p className="text-sm text-gray-300">Mayank Raw Mint Pvt. Ltd.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="text-sm">Watch Later</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                    </svg>
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div> */}

              {/* Mobile Video Info */}
              {/* <div className="md:hidden p-4 bg-gray-900 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">M</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">MRMPL Corporate Video</h3>
                    <p className="text-xs text-gray-300">Mayank Raw Mint Pvt. Ltd.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="text-xs">Watch Later</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                    </svg>
                    <span className="text-xs">Share</span>
                  </button>
                </div>
              </div> */}
            </div>
          </div>
        </motion.div>

        {/* Building Excellence Section */}
        {/* <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Building Excellence, Delivering Trust
          </h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            With over a decade of expertise in precision engineering, our world-class infrastructure and dedicated team have established us as industry leaders in manufacturing superior brass fittings and custom solutions.
          </p>
        </motion.div> */}

        {/* Statistics Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {capabilities.map((capability, index) => {
            const IconComponent = capability.icon;
            return (
              <motion.div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-8 transition-all duration-300 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <IconComponent className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {capability.number}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {capability.label}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {capability.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Mission, Vision & Values Section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Mission Card */}
            <motion.div
              className="bg-white border border-gray-200 rounded-xl p-8 transition-all duration-500 ease-out text-center"
              initial={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                Our mission is to be exceed customer satisfaction by providing high quality products using advance technologies and services.
              </p>
            </motion.div>

            {/* Vision Card */}
            <motion.div
              className="bg-white border border-gray-200 rounded-xl p-8 transition-all duration-500 ease-out text-center"
              initial={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                Our vision is to be First Choice Manufacturer and supplier for our Product Lines.
              </p>
            </motion.div>
          </div>

          {/* Values Section */}
          <div>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Values</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <motion.div
                    key={index}
                    className="text-center transition-all duration-500 ease-out"
                    initial={{ opacity: 0, translateY: 16 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ duration: 0.5, delay: 1.1 + (index * 0.1) }}
                  >
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{value.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Journey Image Section */}
      <motion.div
        className="max-w-7xl mx-auto px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Our Journey</h2>
        <div className="w-full mb-10">
          <img
            src="/optimized/site/journey-1114.webp"
            alt="Our Journey"
            className="w-full h-auto object-cover"
          />
        </div>
      </motion.div>

      {/* Team Photo Section */}
      <motion.div
        className="mb-4 mt-4 max-w-7xl mx-auto px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.7 }}
      >
        <div className="w-full">
          <img
            src="/optimized/site/about/team-1600.webp"
            alt="Our Team"
            className="w-full h-auto object-cover"
          />
        </div>
      </motion.div>

      {/* Main Content Continued */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Application Sectors Section */}
        <ApplicationSectorsSection />

        {/* Our Journey Section */}
        {/* <motion.div 
          className="mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              From humble beginnings to becoming a global leader in brass fittings, our journey is marked by continuous innovation, 
              quality excellence, and unwavering commitment to customer satisfaction.
            </p>
          </div>
          
          <CompanyTimeline />
        </motion.div> */}

        {/* Legacy & Trust Section */}
        {/* <motion.div 
          className="relative overflow-hidden rounded-2xl mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-green-600/5 to-green-500/10"></div>
          <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                  A Legacy of Innovation & Trust
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Advanced Infrastructure</h4>
                      <p className="text-gray-600 text-sm">
                        State-of-the-art manufacturing facilities equipped with cutting-edge CNC machines, 
                        automated assembly lines, and precision testing equipment.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Expert Team</h4>
                      <p className="text-gray-600 text-sm">
                        Our skilled engineers and technicians bring decades of combined experience 
                        in metallurgy, precision engineering, and quality control.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Proven Capabilities</h4>
                      <p className="text-gray-600 text-sm">
                        From prototype to mass production, we deliver complex custom solutions 
                        with unmatched precision and reliability across diverse industries.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6  rounded-xl">
                    <div className="text-2xl font-bold text-green-600 mb-2">ISO</div>
                    <div className="text-sm text-gray-600">Certified Quality</div>
                  </div>
                  <div className="text-center p-6  rounded-xl">
                    <div className="text-2xl font-bold text-green-600 mb-2">24/7</div>
                    <div className="text-sm text-gray-600">Support System</div>
                  </div>
                  <div className="text-center p-6  rounded-xl">
                    <div className="text-2xl font-bold text-green-600 mb-2">Zero</div>
                    <div className="text-sm text-gray-600">Lead Content</div>
                  </div>
                  <div className="text-center p-6  rounded-xl">
                    <div className="text-2xl font-bold text-green-600 mb-2">100%</div>
                    <div className="text-sm text-gray-600">Customer Satisfaction</div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 italic">
                    "Trusted by leading manufacturers across India for consistent quality, 
                    on-time delivery, and innovative solutions."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>  */}



        {/* Corporate Social Responsibility Section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Corporate Social Responsibility
            </h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              We believe in giving back to society and creating a positive impact on the communities we serve.
              Our CSR initiatives focus on sustainable development and social welfare.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Education Initiative Card */}
            <motion.div
              className="bg-white border border-gray-200 rounded-2xl p-8 transition-all duration-500 ease-out"
              initial={{ opacity: 0, translateX: -30 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 19 16.5 19c-1.746 0-3.332-.477-4.5-1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Education Initiative</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Supporting local schools with scholarships and infrastructure development to provide quality education for underprivileged children.
                </p>
                <span className="inline-block bg-green-600 text-white text-sm px-4 py-2 rounded-full font-medium">
                  50+ students benefited
                </span>
              </div>

              <div className="w-full">
                <img
                  src="/optimized/site/csr/edu-1200.webp"
                  alt="Students in classroom"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            </motion.div>

            {/* Healthcare Support Card */}
            <motion.div
              className="bg-white border border-gray-200 rounded-2xl p-8 transition-all duration-500 ease-out"
              initial={{ opacity: 0, translateX: 30 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Healthcare Support</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Providing free medical camps and health awareness programs in rural communities around our manufacturing units.
                </p>
                <span className="inline-block bg-green-600 text-white text-sm px-4 py-2 rounded-full font-medium">
                  200+ people served annually
                </span>
              </div>

              <div className="w-full">
                <img
                  src="/optimized/site/csr/health1-1200.webp"
                  alt="Medical care"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
