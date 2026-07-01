// @ts-nocheck
"use client";
import React from 'react';
import { useCompare } from '@/contexts/CompareContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { X, ArrowLeft, Thermometer, Droplets, Wind, Zap, Snowflake, Settings, Ruler, BadgeCheck, Plus } from 'lucide-react';
import { useNavigate } from '@/lib/next-router';
import Header from '@/components/Header';
import OptimizedImage from '@/components/OptimizedImage';
import { getProductImageFallbackSrc, preferOptimizedProductImage } from '@/lib/image-assets';

const Compare = () => {
  const { compareList, removeFromCompare, clearCompareList } = useCompare();
  const navigate = useNavigate();

  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-32 pb-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-12 h-12 text-gray-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">No Products to Compare</h1>
              <p className="text-gray-600 mb-8">Add products to your compare list to see them side by side.</p>
              <Button 
                onClick={() => navigate('/products')}
                className="bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-lg"
              >
                Browse Products
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderSpecification = (spec, product) => {
    if (!spec || spec === 'N/A' || spec === '') return 'N/A';
    return spec;
  };

  const getSpecValue = (product, specKey) => {
    // Map specification keys to actual product properties
    const specMap = {
      'Material': product.material,
      'MATERIAL CONSTRUCTION': product.type,
      'Plating': product.plating || product.finishPlating,
      'Size': product.size,
      'Grade': product.grade,
      'Description': product.description || 'N/A',
      'Temperature Range': product.temperatureRange || product.temperature,
      'Pressure Rating': product.pressureRating || product.pressure,
      'Thread Type': product.threadStandard,
      'Connections': product.connections,
      'Finish': product.finishPlating || product.plating,
      'Compliance': product.certifications ? product.certifications.join(', ') : 'N/A'
    };
    
    const value = specMap[specKey];
    return value && value !== 'N/A' && value !== 'Not Available' ? value : 'N/A';
  };

    const commonSpecs = [
      'Material',
      'MATERIAL CONSTRUCTION',
      'Plating',
      'Size',
      'Grade',
      'Description',
      'Temperature Range',
    'Pressure Rating',
    'Thread Type',
    'Connections',
    'Finish',
    'Compliance'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Common Header Section */}
      <div className="pt-32 pb-16 bg-gradient-to-r from-green-600 to-green-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/10 p-2 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Product Comparison</h1>
                <p className="text-green-100">Compare {compareList.length} product{compareList.length > 1 ? 's' : ''} side by side</p>
              </div>
            </div>
            <Button
              onClick={clearCompareList}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/4">
                    Specification
                  </th>
                  {compareList.map((product, index) => (
                    <th key={product._id} className="px-6 py-4 text-center text-sm font-semibold text-gray-900 min-w-64 group">
                      <div className="flex flex-col items-center hover:bg-gray-50 rounded-lg p-2 transition-all duration-300 cursor-pointer hover:shadow-md">
                        <div className="relative mb-3 group-hover:scale-105 transition-transform duration-300">
                          <OptimizedImage
                            src={preferOptimizedProductImage(
                              product.images?.[0]?.src || 
                              (Array.isArray(product.images) ? product.images[0] : product.images) || 
                              '/placeholder-product.jpg',
                              product.partCode || product.catalogueCode,
                              0,
                              'card'
                            )}
                            fallbackSrc={getProductImageFallbackSrc(
                              product.images?.[0]?.src ||
                              (Array.isArray(product.images) ? product.images[0] : product.images) ||
                              '/placeholder-product.jpg',
                              product.partCode || product.catalogueCode,
                              0,
                              'card'
                            )}
                            alt={product.name || product.productName}
                            className="rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300"
                            aspectRatio="1/1"
                            eager={true}
                          />
                          <Button
                            onClick={() => removeFromCompare(product._id)}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 p-0 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-20 border-2 border-white"
                            title="Remove from compare"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-primary transition-colors duration-300">{product.name || product.productName}</h3>
                        <Badge variant="secondary" className="text-xs group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                          {product.category?.name || product.category || 'Category'}
                        </Badge>
                      </div>
                    </th>
                  ))}
                  {/* Fill empty columns if less than 3 products */}
                  {Array.from({ length: 3 - compareList.length }).map((_, index) => (
                    <th key={`empty-${index}`} className="px-6 py-4 text-center text-sm font-semibold text-gray-500 min-w-64">
                      <button
                        onClick={() => navigate('/products')}
                        className="flex flex-col items-center justify-center h-32 w-full group hover:bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-105 active:scale-95"
                      >
                        <div className="w-24 h-24 bg-gray-100 group-hover:bg-primary/10 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-primary/50 group-hover:shadow-lg transition-all duration-300 group-hover:rotate-3">
                          <Plus className="w-8 h-8 text-gray-400 group-hover:text-primary transition-all duration-300 group-hover:scale-110" />
                        </div>
                        <span className="text-gray-400 text-xs mt-2 group-hover:text-primary transition-all duration-300 font-medium group-hover:font-semibold">
                          Add Product
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {commonSpecs.map((specKey) => (
                  <tr key={specKey} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                      {specKey}
                    </td>
                    {compareList.map((product) => (
                      <td key={`${product._id}-${specKey}`} className="px-6 py-4 text-sm text-gray-600 text-center hover:bg-gray-100 transition-colors duration-200">
                        {renderSpecification(getSpecValue(product, specKey), product)}
                      </td>
                    ))}
                    {/* Fill empty columns */}
                    {Array.from({ length: 3 - compareList.length }).map((_, index) => (
                      <td key={`empty-${specKey}-${index}`} className="px-6 py-4 text-sm text-gray-400 text-center hover:bg-gray-100 transition-colors duration-200">
                        -
                      </td>
                    ))}
                  </tr>
                ))}
                
                {/* Description Row */}
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    Description
                  </td>
                  {compareList.map((product) => (
                    <td key={`${product._id}-description`} className="px-6 py-4 text-sm text-gray-600 text-center hover:bg-gray-100 transition-colors duration-200">
                      <div className="max-h-20 overflow-y-auto">
                        {product.description || 'No description available'}
                      </div>
                    </td>
                  ))}
                  {/* Fill empty columns */}
                  {Array.from({ length: 3 - compareList.length }).map((_, index) => (
                    <td key={`empty-description-${index}`} className="px-6 py-4 text-sm text-gray-400 text-center hover:bg-gray-100 transition-colors duration-200">
                      -
                    </td>
                  ))}
                </tr>

                {/* Dimensions Row */}
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    Dimensions
                  </td>
                  {compareList.map((product) => (
                    <td key={`${product._id}-dimensions`} className="px-6 py-4 text-sm text-gray-600 text-center hover:bg-gray-100 transition-colors duration-200">
                      <div className="max-h-32 overflow-y-auto">
                        {product.dimensions && product.dimensions.length > 0 ? (
                          <div className="space-y-2">
                            {product.dimensions.map((dimension, idx) => (
                              <div key={idx} className="text-left p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-xs text-gray-700">
                                    {dimension.parameter}:
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {dimension.value}
                                  </span>
                                </div>
                                {dimension.notes && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {dimension.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">No dimensions available</div>
                        )}
                      </div>
                    </td>
                  ))}
                  {/* Fill empty columns */}
                  {Array.from({ length: 3 - compareList.length }).map((_, index) => (
                    <td key={`empty-dimensions-${index}`} className="px-6 py-4 text-sm text-gray-400 text-center hover:bg-gray-100 transition-colors duration-200">
                      -
                    </td>
                  ))}
                </tr>

                {/* Features Row */}
                <tr className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    Key Features
                  </td>
                  {compareList.map((product) => (
                    <td key={`${product._id}-features`} className="px-6 py-4 text-sm text-gray-600 text-center hover:bg-gray-100 transition-colors duration-200">
                      <div className="max-h-20 overflow-y-auto">
                        {product.features && product.features.length > 0 ? (
                          <ul className="text-left space-y-1">
                            {product.features.slice(0, 3).map((feature, idx) => (
                              <li key={idx} className="flex items-start hover:text-primary transition-colors duration-200">
                                <span className="text-green-500 mr-2">•</span>
                                <span className="text-xs">{feature}</span>
                              </li>
                            ))}
                            {product.features.length > 3 && (
                              <li className="text-xs text-gray-500 hover:text-primary transition-colors duration-200">+{product.features.length - 3} more</li>
                            )}
                          </ul>
                        ) : (
                          'No features listed'
                        )}
                      </div>
                    </td>
                  ))}
                  {/* Fill empty columns */}
                  {Array.from({ length: 3 - compareList.length }).map((_, index) => (
                    <td key={`empty-features-${index}`} className="px-6 py-4 text-sm text-gray-400 text-center hover:bg-gray-100 transition-colors duration-200">
                      -
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate('/products')}
            variant="outline"
            className="px-8 py-3 cursor-pointer hover:bg-gray-50 hover:border-primary hover:text-primary transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
          >
            Browse More Products
          </Button>
          <Button
            onClick={() => navigate('/contact')}
            className="bg-primary text-white hover:bg-primary/90 px-8 py-3 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            Get Quote
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Compare;
