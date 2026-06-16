// @ts-nocheck
"use client";
import { Package, Factory, Globe, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { useNavigate } from "@/lib/next-router";

const StatsSection = () => {
  const navigate = useNavigate();
  const { elementRef, isVisible } = useScrollAnimation();

  const stats = [
    {
      icon: Package,
      number: "1900+",
      title: "SKU",
      description: "Lead-free and leaded fittings made from bar-stock & forged material."
    },
    {
      icon: Factory,
      number: "30M+",
      title: "Units/Year",
      description: "We manufacture and ship over 30 million units annually."
    },
    {
      icon: Globe,
      number: "18+",
      title: "Global Clients",
      description: "Trusted partners across USA, Canada & UK"
    },
    {
      icon: Zap,
      number: "210 kW",
      title: "Solar Power Plant",
      description: "Our initiative towards a greener world and sustainable manufacturing."
    }
  ];

  return (
    <section ref={elementRef} className="pb-4 pt-4 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="text-center transition-smooth border-border bg-card"
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex justify-center mt-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-lg font-semibold text-foreground mb-2">{stat.title}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center flex flex-col md:flex-row items-center justify-center gap-4 mt-12">
          <Button 
            size="lg" 
            onClick={() => navigate('/about')}
            className="text-white cursor-pointer hover:bg-opacity-60 transition-all duration-300"
          >
            Know More
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
