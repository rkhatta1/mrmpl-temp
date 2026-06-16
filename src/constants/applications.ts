// @ts-nocheck
import { 
  Thermometer, 
  Wind, 
  Waves, 
  Car, 
  Wrench, 
  Droplets, 
  Fuel, 
  Sprout, 
  Zap, 
  Settings, 
  Gauge 
} from 'lucide-react';

export const APPLICATION_OPTIONS = [
  { 
    value: "Heating", 
    label: "Heating", 
    icon: Thermometer,
    color: "text-red-500"
  },
  { 
    value: "Ventilation", 
    label: "Ventilation", 
    icon: Wind,
    color: "text-blue-500"
  },
  { 
    value: "Air Conditioning", 
    label: "Air Conditioning", 
    icon: Thermometer,
    color: "text-cyan-500"
  },
  { 
    value: "Refrigeration", 
    label: "Refrigeration", 
    icon: Waves,
    color: "text-indigo-500"
  },
  { 
    value: "Automotive", 
    label: "Automotive", 
    icon: Car,
    color: "text-gray-600"
  },
  { 
    value: "Hardware & Sanitary", 
    label: "Hardware & Sanitary", 
    icon: Wrench,
    color: "text-orange-500"
  },
  { 
    value: "Plumbing", 
    label: "Plumbing", 
    icon: Droplets,
    color: "text-blue-400"
  },
  { 
    value: "LPG & Industrial Valves", 
    label: "LPG & Industrial Valves", 
    icon: Fuel,
    color: "text-yellow-600"
  },
  { 
    value: "Agriculture Equipment", 
    label: "Agriculture Equipment", 
    icon: Sprout,
    color: "text-green-500"
  },
  { 
    value: "Electrical", 
    label: "Electrical", 
    icon: Zap,
    color: "text-yellow-500"
  },
  { 
    value: "Hydraulic", 
    label: "Hydraulic", 
    icon: Settings,
    color: "text-purple-500"
  },
  { 
    value: "Pneumatic", 
    label: "Pneumatic", 
    icon: Gauge,
    color: "text-gray-500"
  }
];

// Export the exact same structure as the About page for consistency
export const SECTORS = [
  { icon: Thermometer, label: "Heating" },
  { icon: Wind, label: "Ventilation" },
  { icon: Thermometer, label: "Air Conditioning" },
  { icon: Waves, label: "Refrigeration" },
  { icon: Car, label: "Automotive" },
  { icon: Wrench, label: "Hardware & Sanitary" },
  { icon: Droplets, label: "Plumbing" },
  { icon: Fuel, label: "LPG & Industrial Valves" },
  { icon: Sprout, label: "Agriculture Equipment" },
  { icon: Zap, label: "Electrical" },
  { icon: Settings, label: "Hydraulic" },
  { icon: Gauge, label: "Pneumatic" }
];

export const getApplicationByValue = (value) => {
  return APPLICATION_OPTIONS.find(app => app.value === value);
};

export const getApplicationsByValues = (values) => {
  return values.map(value => getApplicationByValue(value)).filter(Boolean);
};
