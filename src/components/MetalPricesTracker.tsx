// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, DollarSign, RefreshCw, Euro, DollarSign as CadIcon } from "lucide-react";
import { Card, CardContent } from "./ui/Card";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { getPublicApiBaseUrl } from "@/lib/api-base-url";

const MetalPricesTracker = () => {
  const { elementRef, isVisible } = useScrollAnimation();
  const [exchangeRates, setExchangeRates] = useState({
    usdToInr: 0,
    eurToInr: 0,
    cadToInr: 0
  });
  
  const [metalPrices, setMetalPrices] = useState([
    { name: "Brass", symbol: "BR", price: 0, change: 0, changePercent: 0, unit: "per ton", loading: true },
    { name: "Copper", symbol: "CU", price: 0, change: 0, changePercent: 0, unit: "per ton", loading: true },
    { name: "Zinc", symbol: "ZN", price: 0, change: 0, changePercent: 0, unit: "per ton", loading: true }
  ]);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache key for localStorage
  const CACHE_KEY = 'metal_prices_cache';
  const CACHE_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds (3 times per day)

  // Check if cached data is still valid
  const isCacheValid = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return false;
      
      const { timestamp, data } = JSON.parse(cached);
      const now = new Date().getTime();
      const cacheAge = now - timestamp;
      
      return cacheAge < CACHE_DURATION;
    } catch (error) {
      console.error('Error reading cache:', error);
      return false;
    }
  };

  // Get cached data
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        return { data, timestamp: new Date(timestamp) };
      }
    } catch (error) {
      console.error('Error reading cached data:', error);
    }
    return null;
  };

  // Save data to cache
  const saveToCache = (data) => {
    try {
      const cacheData = {
        timestamp: new Date().getTime(),
        data: data
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  // Fetch data from backend API
  const fetchData = async (retryCount = 0, forceRefresh = false) => {
    try {
      // Check cache first (unless forcing refresh)
      if (!forceRefresh && isCacheValid()) {
        const cached = getCachedData();
        if (cached) {
          console.log('📦 Using cached data');
          setLoading(false);
          
          // Update metal prices from cache
          if (cached.data.metalPrices && cached.data.metalPrices.length > 0) {
            const updatedMetalPrices = cached.data.metalPrices.map(metal => ({
              name: metal.name,
              symbol: metal.symbol,
              price: metal.price,
              change: metal.change,
              changePercent: metal.changePercent,
              unit: metal.unit,
              loading: false
            }));
            setMetalPrices(updatedMetalPrices);
          }
          
          // Update currency rates from cache
          if (cached.data.currencyRates && cached.data.currencyRates.length > 0) {
            const rates = {};
            cached.data.currencyRates.forEach(rate => {
              if (rate.fromCurrency === 'USD' && rate.toCurrency === 'INR') {
                rates.usdToInr = rate.rate;
              } else if (rate.fromCurrency === 'EUR' && rate.toCurrency === 'INR') {
                rates.eurToInr = rate.rate;
              } else if (rate.fromCurrency === 'CAD' && rate.toCurrency === 'INR') {
                rates.cadToInr = rate.rate;
              }
            });
            setExchangeRates(rates);
          }
          
          setLastUpdated(cached.timestamp);
          return; // Exit early, using cached data
        }
      }

      // Cache is invalid or force refresh - fetch from API
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching data from backend API...');
      
      const response = await fetch(`${getPublicApiBaseUrl()}/metal/all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Backend API response:', data);
      
      if (data.success) {
        // Save to cache
        saveToCache(data.data);
        
        // Update metal prices
        if (data.data.metalPrices && data.data.metalPrices.length > 0) {
          const updatedMetalPrices = data.data.metalPrices.map(metal => ({
            name: metal.name,
            symbol: metal.symbol,
            price: metal.price,
            change: metal.change,
            changePercent: metal.changePercent,
            unit: metal.unit,
            loading: false
          }));
          setMetalPrices(updatedMetalPrices);
          console.log('✅ Metal prices updated:', updatedMetalPrices);
        }
        
        // Update currency rates
        if (data.data.currencyRates && data.data.currencyRates.length > 0) {
          const rates = {};
          data.data.currencyRates.forEach(rate => {
            if (rate.fromCurrency === 'USD' && rate.toCurrency === 'INR') {
              rates.usdToInr = rate.rate;
            } else if (rate.fromCurrency === 'EUR' && rate.toCurrency === 'INR') {
              rates.eurToInr = rate.rate;
            } else if (rate.fromCurrency === 'CAD' && rate.toCurrency === 'INR') {
              rates.cadToInr = rate.rate;
            }
          });
          setExchangeRates(rates);
          console.log('✅ Currency rates updated:', rates);
        }
        
        setLastUpdated(new Date());
      } else {
        console.error('❌ Backend API returned error:', data.message);
        setError(data.message || 'Unknown error from backend');
      }
    } catch (error) {
      console.error('❌ Error fetching data from backend:', error);
      setError(error.message);
      
      // If API fails, try to use cached data as fallback
      const cached = getCachedData();
      if (cached) {
        console.log('⚠️ API failed, using cached data as fallback');
        // Apply cached data (same logic as above)
        if (cached.data.metalPrices && cached.data.metalPrices.length > 0) {
          const updatedMetalPrices = cached.data.metalPrices.map(metal => ({
            name: metal.name,
            symbol: metal.symbol,
            price: metal.price,
            change: metal.change,
            changePercent: metal.changePercent,
            unit: metal.unit,
            loading: false
          }));
          setMetalPrices(updatedMetalPrices);
        }
        if (cached.data.currencyRates && cached.data.currencyRates.length > 0) {
          const rates = {};
          cached.data.currencyRates.forEach(rate => {
            if (rate.fromCurrency === 'USD' && rate.toCurrency === 'INR') {
              rates.usdToInr = rate.rate;
            } else if (rate.fromCurrency === 'EUR' && rate.toCurrency === 'INR') {
              rates.eurToInr = rate.rate;
            } else if (rate.fromCurrency === 'CAD' && rate.toCurrency === 'INR') {
              rates.cadToInr = rate.rate;
            }
          });
          setExchangeRates(rates);
        }
        setLastUpdated(cached.timestamp);
        setLoading(false);
        return;
      }
      
      // Retry logic - retry up to 3 times with increasing delay
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchData(retryCount + 1, forceRefresh);
        }, delay);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch - fetchData will check cache automatically
  useEffect(() => {
    fetchData();
  }, []);

  // Check cache validity periodically (every hour) and refresh if needed
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (!isCacheValid()) {
        console.log('⏰ Cache expired, fetching fresh data...');
        fetchData(0, true); // Force refresh when cache expires
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(checkInterval);
  }, []);

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (change) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-500";
  };

  const currencyRates = [
    { 
      label: "USD → INR", 
      rate: exchangeRates.usdToInr,
      symbol: DollarSign,
      fromSymbol: "$",
      toSymbol: "₹",
      description: "1 USD ="
    },
    { 
      label: "EUR → INR", 
      rate: exchangeRates.eurToInr,
      symbol: Euro,
      fromSymbol: "€",
      toSymbol: "₹",
      description: "1 EUR ="
    },
    { 
      label: "CAD → INR", 
      rate: exchangeRates.cadToInr,
      symbol: CadIcon,
      fromSymbol: "C$",
      toSymbol: "₹",
      description: "1 CAD ="
    }
  ];

  return (
    <section ref={elementRef} className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className={`text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Metal Prices & Currency</h2>
            {/* <button
              onClick={() => fetchData()}
              disabled={loading}
              className={`p-2 rounded-full transition-all duration-200 ${
                loading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200 hover:scale-105'
              }`}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button> */}
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed with updated metal prices and currency conversion for smarter procurement decisions.
          </p>
        </div>

        {/* Metal Prices Grid - First Row */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {metalPrices.map((metal, index) => (
            <Card 
              key={index} 
              className="shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 rounded-lg"
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4 pt-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-semibold text-gray-800">{metal.name}</span>
                  <span className="text-sm text-gray-500">{metal.symbol}</span>
                </div>
                <div className="space-y-1">
                  {loading || metal.loading ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-gray-800">
                        ${metal.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{metal.unit}</div>
                      <div className={`flex items-center space-x-1 text-xs ${getTrendColor(metal.change)}`}>
                        {getTrendIcon(metal.change)}
                        <span>
                          ${Math.abs(metal.change).toFixed(2)} ({metal.changePercent > 0 ? '+' : ''}{metal.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Currency Exchange Rates - Second Row */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {currencyRates.map((currency, index) => (
            <Card 
              key={index} 
              className="shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 rounded-lg"
              style={{ transitionDelay: `${(index + 3) * 0.1}s` }}
            >
              <CardContent className="p-4 pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <currency.symbol className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">{currency.fromSymbol} {currency.description}</span>
                      <span className="text-sm text-gray-500 ml-1">to</span>
                      <span className="font-semibold text-gray-800 ml-1">{currency.toSymbol}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-gray-800">
                      {currency.description} {currency.toSymbol}{currency.rate.toFixed(2)}
                      </div>
                      {/* <div className="text-xs text-gray-500">{currency.description}</div> */}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Error Display */}
        {/* {error && (
          <div className="text-center mb-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="text-sm">⚠️ {error}</p>
              <button 
                onClick={() => fetchData()}
                className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )} */}

        {/* Timestamp */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            *Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "Checking latest data..."}
          </p>
          {loading && (
            <p className="text-xs text-blue-500 mt-1">🔄 Updating data...</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default MetalPricesTracker;
