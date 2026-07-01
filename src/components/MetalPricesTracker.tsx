// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, DollarSign, Euro, DollarSign as CadIcon } from "lucide-react";
import { Card, CardContent } from "./ui/Card";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { getPublicApiBaseUrl } from "@/lib/api-base-url";

const METAL_PRICE_PLACEHOLDERS = [
  { name: "", symbol: "", price: 0, change: 0, changePercent: 0, unit: "", loading: true },
  { name: "", symbol: "", price: 0, change: 0, changePercent: 0, unit: "", loading: true },
  { name: "", symbol: "", price: 0, change: 0, changePercent: 0, unit: "", loading: true }
];

const MetalPricesTracker = () => {
  const { elementRef, isVisible } = useScrollAnimation();
  const [metalPrices, setMetalPrices] = useState([]);
  const [metalLoading, setMetalLoading] = useState(true);
  const [metalError, setMetalError] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({
    usdToInr: 0,
    eurToInr: 0,
    cadToInr: 0
  });

  const [lastUpdated, setLastUpdated] = useState(null);
  const [currencyLoading, setCurrencyLoading] = useState(true);
  const [currencyError, setCurrencyError] = useState(null);

  // Cache key for localStorage
  const CACHE_KEY = 'currency_rates_cache';
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

  const applyCurrencyRates = (currencyRates = []) => {
    const rates = {};
    currencyRates.forEach(rate => {
      if (rate.fromCurrency === 'USD' && rate.toCurrency === 'INR') {
        rates.usdToInr = rate.rate;
      } else if (rate.fromCurrency === 'EUR' && rate.toCurrency === 'INR') {
        rates.eurToInr = rate.rate;
      } else if (rate.fromCurrency === 'CAD' && rate.toCurrency === 'INR') {
        rates.cadToInr = rate.rate;
      }
    });

    setExchangeRates(prev => ({ ...prev, ...rates }));
  };

  const noteLastUpdated = (value) => {
    if (!value) return;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return;
    setLastUpdated(prev => {
      if (!prev) return date;
      return date.getTime() > prev.getTime() ? date : prev;
    });
  };

  const fetchMetalPrices = async () => {
    try {
      setMetalLoading(true);
      setMetalError(null);

      const response = await fetch(`${getPublicApiBaseUrl()}/metal/all`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Unknown error from backend");
      }

      setMetalPrices(data.data.metalPrices || []);
      noteLastUpdated(data.data.updatedAt);
    } catch (error) {
      setMetalError(error.message);
    } finally {
      setMetalLoading(false);
    }
  };

  // Fetch currency data from backend API.
  const fetchCurrencyData = async (retryCount = 0, forceRefresh = false) => {
    try {
      // Check cache first (unless forcing refresh)
      if (!forceRefresh && isCacheValid()) {
        const cached = getCachedData();
        if (cached) {
          setCurrencyLoading(false);

          if (cached.data.currencyRates && cached.data.currencyRates.length > 0) {
            applyCurrencyRates(cached.data.currencyRates);
          }

          noteLastUpdated(cached.timestamp);
          return; // Exit early, using cached data
        }
      }

      // Cache is invalid or force refresh - fetch from API
      setCurrencyLoading(true);
      setCurrencyError(null);

      const response = await fetch(`${getPublicApiBaseUrl()}/currency/rates`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Save to cache
        saveToCache(data.data);

        if (data.data.currencyRates && data.data.currencyRates.length > 0) {
          applyCurrencyRates(data.data.currencyRates);
        }

        noteLastUpdated(data.data.updatedAt || new Date());
      } else {
        setCurrencyError(data.message || 'Unknown error from backend');
      }
    } catch (error) {
      setCurrencyError(error.message);
      
      // If API fails, try to use cached data as fallback
      const cached = getCachedData();
      if (cached) {
        if (cached.data.currencyRates && cached.data.currencyRates.length > 0) {
          applyCurrencyRates(cached.data.currencyRates);
        }
        noteLastUpdated(cached.timestamp);
        setCurrencyLoading(false);
        return;
      }
      
      // Retry logic - retry up to 3 times with increasing delay
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          fetchCurrencyData(retryCount + 1, forceRefresh);
        }, delay);
        return;
      }
    } finally {
      setCurrencyLoading(false);
    }
  };

  // Initial data fetch - fetchCurrencyData will check cache automatically
  useEffect(() => {
    fetchMetalPrices();
    fetchCurrencyData();
  }, []);

  // Check cache validity periodically (every hour) and refresh if needed
  useEffect(() => {
    const checkInterval = setInterval(() => {
      fetchMetalPrices();
      if (!isCacheValid()) {
        fetchCurrencyData(0, true); // Force refresh when cache expires
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

  const formatMetalPrice = (metal) => {
    const currencyPrefix = !metal.currency || metal.currency === "USD" ? "$" : `${metal.currency} `;
    return `${currencyPrefix}${metal.price.toFixed(2)}`;
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

  const displayedMetalPrices = metalLoading && metalPrices.length === 0
    ? METAL_PRICE_PLACEHOLDERS
    : metalPrices;

  return (
    <section ref={elementRef} className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className={`text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Metal Prices & Currency</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed with updated metal prices and currency conversion for smarter procurement decisions.
          </p>
        </div>

        {/* Metal Prices Grid - First Row */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {displayedMetalPrices.map((metal, index) => (
            <Card 
              key={metal.symbol || index}
              className="shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 rounded-lg"
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4 pt-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-semibold text-gray-800">{metal.name}</span>
                  <span className="text-sm text-gray-500">{metal.symbol}</span>
                </div>
                <div className="space-y-1">
                  {metal.loading ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-gray-800">
                        {formatMetalPrice(metal)}
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

        {metalError && !metalLoading && (
          <div className="text-center mb-4">
            <div className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Metal prices are temporarily unavailable.
            </div>
          </div>
        )}

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
                  {currencyLoading ? (
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

        {currencyError && !currencyLoading && (
          <div className="text-center mb-4">
            <div className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Currency rates are temporarily unavailable.
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            *Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "Checking latest data..."}
          </p>
          {(metalLoading || currencyLoading) && (
            <p className="text-xs text-blue-500 mt-1">🔄 Updating data...</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default MetalPricesTracker;
