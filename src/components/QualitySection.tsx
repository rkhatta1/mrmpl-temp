// @ts-nocheck
"use client";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Microscope, Settings, CheckSquare, FileCheck, Eye, Download } from "lucide-react";
import { useNavigate } from "@/lib/next-router";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const QualitySection = () => {
  const navigate = useNavigate();
  const { elementRef, isVisible } = useScrollAnimation();

  return (
    <section ref={elementRef} className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className={`text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Uncompromising Quality Standards
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ISO 9001:2015 and NSF certified. Every product undergoes 50+ checks, audits, 
            and Pre-Dispatch Inspections to guarantee zero defects.
          </p>
        </div>

        {/* Three-Step Process */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Microscope className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Testing & Analysis</h3>
            <p className="text-sm text-gray-600">50+ parameters verified with advanced equipment</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Process Control</h3>
            <p className="text-sm text-gray-600">Continuous checks during production</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Final Inspection</h3>
            <p className="text-sm text-gray-600">Pre-Dispatch Inspection (PDI) before shipment</p>
          </div>
        </div>

        {/* Quality Check Before Dispatch - Two Column Layout */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Left Column */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Quality Check Before Dispatch</h3>
            <p className="text-gray-600 mb-6">
              Every order is backed by a Pre-Dispatch Inspection Report (PDI).
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-gray-800">Defect-free products only</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-gray-800">Traceability for lifetime</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-gray-800">Transparent customer reporting</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <Card className="shadow-lg border-gray-200 bg-gray-100">
            <CardContent className="p-6 pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <FileCheck className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Sample Inspection Sheet</h4>
              <p className="text-sm text-gray-600 mb-6">Pre-Dispatch Inspection Report</p>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => window.open('/PDIR.pdf', '_blank', 'noopener,noreferrer')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Sample Report
                </Button>
                {/* <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button> */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certification Badges */}
        <div className={`flex justify-center items-center gap-4 mb-8 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <Badge variant="outline" className="text-sm px-4 py-2 border-gray-300 text-gray-700">ISO 9001:2015</Badge>
          <Badge variant="outline" className="text-sm px-4 py-2 border-gray-300 text-gray-700">NSF Certified</Badge>
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            onClick={() => navigate('/quality')}
            className="bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            Explore Our Quality Standards
          </Button>
        </div>
      </div>
    </section>
  );
};

export default QualitySection;
