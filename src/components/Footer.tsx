// @ts-nocheck
"use client";
import { MapPin, Phone, Mail, Clock, Shield, CheckCircle } from "lucide-react";
import { Link } from "@/lib/next-router";
import { useState, useEffect } from "react";
import { categoryService } from "@/services/categoryService";
import LazyImage from "./LazyImage";

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

const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        const allCategories = response.data || [];
        
        // Filter categories to only show allowed ones (exact match only, case-insensitive)
        const allowedCategories = allCategories.filter(category => {
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
        setCategories([
          { name: 'Lead-Free Fittings' },
          { name: 'Compression Fittings' },
          { name: 'Pipe Fittings' },
          { name: 'Hose Barb Fittings' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <footer className="bg-gradient-to-r from-[#083D1B] to-[#021D0D] border-t border-primary/20">
      <div className="container mx-auto px-4 pt-20 pb-5">
        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-12 mb-16">
          {/* Company Information (Leftmost Column) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Logo Section */}
            <div className="flex items-center">
              <LazyImage 
                src="/mrmpl-full-white.svg" 
                alt="Mayank Raw Mint Logo" 
                className="h-12 w-auto max-w-full"
                eager={true}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-green-300 mt-1 flex-shrink-0" />
                <div className="text-sm text-green-100">
                  <div className="font-semibold text-white mb-3">Manufacturing Unit:</div>
                  <div className="leading-relaxed">
                    Mayank Raw Mint Pvt. Ltd.<br />
                    Plot No. 10 to 15, Survey No.421,<br />
                    B/H Murlidhar Tractor, Hapa,<br />
                    Jamnagar - Rajkot Highway,<br />
                    Jamnagar - 361120 (Gujarat) INDIA
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <a 
                href="https://linkedin.com/company/mayankrawmint" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1C3726] border border-[#5D7064] rounded-lg p-3 text-white hover:bg-green-600 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://www.youtube.com/@mayankrawmintpvt.ltd.7687" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1C3726] border border-[#5D7064] rounded-lg p-3 text-white hover:bg-green-600 transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Company & Legal (Second Column) */}
          <div className="space-y-8 lg:col-span-1">
            {/* Company Section */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Company</h4>
              <ul className="space-y-4">
                <li>
                  <Link to="/about" className="text-green-100 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/quality" className="text-green-100 hover:text-white transition-colors">
                    Quality
                  </Link>
                </li>
                <li>
                  <Link to="/capabilities" className="text-green-100 hover:text-white transition-colors">
                    Capabilities
                  </Link>
                </li>
                <li>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSeAaoNPXwWZdLJPSDsDzXOUjkszUE7gh4ayiHXhV3x-abfhTw/viewform?usp=sharing&ouid=107315232821305842954"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-100 hover:text-white transition-colors"
                  >
                    Career Openings
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Section */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Legal</h4>
              <ul className="space-y-4">
                <li>
                  <a
                    href={`/legal/${encodeURIComponent("MRM Terms & Conditions.pdf")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-100 hover:text-white transition-colors"
                  >
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a
                    href={`/legal/${encodeURIComponent("MRM Legal Disclaimer.pdf")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-100 hover:text-white transition-colors"
                  >
                    Legal Disclaimer
                  </a>
                </li>
                <li>
                  <a
                    href={`/legal/${encodeURIComponent("MRM Privacy Policy.pdf")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-100 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Products (Third Column) */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white">Products</h4>
            {loading ? (
              <div className="text-green-100">Loading categories...</div>
            ) : (
              <ul className="space-y-4">
                {categories.map((category, index) => (
                  <li key={index}>
                    <Link 
                      to={`/products?category=${encodeURIComponent(category.name)}`} 
                      className="text-green-100 hover:text-white transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Contact Info (Rightmost Column) */}
          <div className="space-y-6 lg:col-span-1">
            <h4 className="text-lg font-semibold text-white">Contact Info</h4>
            
            {/* Phone Numbers - Highlighted */}
            <div className="space-y-2">
              <a 
                href="tel:+919624533303" 
                className="bg-[#1C3726] border border-[#5D7064] rounded-lg px-4 py-3 text-white hover:bg-green-600 transition-colors flex items-center gap-3 text-sm font-medium w-full"
              >
                <Phone className="h-4 w-4" />
                (+91) 9624533303
              </a>
              <a 
                href="tel:+917878787819" 
                className="bg-[#1C3726] border border-[#5D7064] rounded-lg px-4 py-3 text-white hover:bg-green-600 transition-colors flex items-center gap-3 text-sm font-medium w-full"
              >
                <Phone className="h-4 w-4" />
                (+91) 7878787819
              </a>
            </div>
            
            {/* Email Addresses */}
            <div className="space-y-2 text-sm text-green-100">
              <a href="mailto:keyur@mayankrawmint.com" className="hover:text-white transition-colors block">
                Enquiry: keyur@mayankrawmint.com
              </a>
              <a href="mailto:info@mayankrawmint.com" className="hover:text-white transition-colors block">
                General: info@mayankrawmint.com
              </a>
            </div>

            {/* Working Hours */}
            <div className="text-sm text-green-100 leading-relaxed">
              Monday to Thursday: 08:00 - 19:00<br />
              Saturday & Sunday: 08:00 - 18:00<br />
              Friday: Holiday
            </div>
          </div>
        </div>

        {/* Bottom Bar - Separated by horizontal line */}
        <div className="border-t border-green-600/30 pt-8">
          <div className="text-sm text-white text-center flex flex-wrap justify-center items-center gap-4">
            <span>© 2025 Mayank Raw Mint. All rights reserved.</span>
            <span className="hidden sm:inline">|</span>
            <span>Est. 2008</span>
            <span className="hidden sm:inline">|</span>
            <div className="flex flex-wrap justify-center items-center gap-4">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-300" />
                NSF Certified
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-300" />
                ISO 9001:2015
              </span>
              {/* <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-300" />
                Lead-Free Specialist
              </span> */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

function Linkedin({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.32 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.54V9H7.1v11.45Z" />
    </svg>
  );
}

function Youtube({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.58 12 3.58 12 3.58s-7.5 0-9.38.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3 3 0 0 0 2.12-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z" />
    </svg>
  );
}
