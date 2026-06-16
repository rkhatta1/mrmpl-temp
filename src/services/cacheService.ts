// @ts-nocheck
// Cache service for managing localStorage operations
export const cacheService = {
  // Cache keys
  CACHE_KEYS: {
    CATEGORIES: 'categories_cache',
    SUBCATEGORIES: 'subcategories_cache',
    CACHE_TIMESTAMP: 'cache_timestamp'
  },

  // Cache duration (24 hours in milliseconds)
  CACHE_DURATION: 24 * 60 * 60 * 1000,

  // Check if cache is valid
  isCacheValid: (cacheKey) => {
    try {
      if (typeof localStorage === 'undefined') return false;
      const timestamp = localStorage.getItem(cacheService.CACHE_KEYS.CACHE_TIMESTAMP);
      if (!timestamp) return false;
      
      const cacheTime = parseInt(timestamp);
      const currentTime = Date.now();
      
      return (currentTime - cacheTime) < cacheService.CACHE_DURATION;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  },

  // Get data from cache
  getFromCache: (cacheKey) => {
    try {
      if (typeof localStorage === 'undefined') return null;
      const cachedData = localStorage.getItem(cacheKey);
      if (!cachedData) return null;
      
      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error getting data from cache:', error);
      return null;
    }
  },

  // Save data to cache
  saveToCache: (cacheKey, data) => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(cacheService.CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('Error saving data to cache:', error);
    }
  },

  // Clear cache
  clearCache: () => {
    try {
      if (typeof localStorage === 'undefined') return;
      Object.values(cacheService.CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Get cached categories
  getCachedCategories: () => {
    if (!cacheService.isCacheValid(cacheService.CACHE_KEYS.CATEGORIES)) {
      return null;
    }
    return cacheService.getFromCache(cacheService.CACHE_KEYS.CATEGORIES);
  },

  // Get cached subcategories
  getCachedSubcategories: () => {
    if (!cacheService.isCacheValid(cacheService.CACHE_KEYS.SUBCATEGORIES)) {
      return null;
    }
    return cacheService.getFromCache(cacheService.CACHE_KEYS.SUBCATEGORIES);
  },

  // Save categories to cache
  saveCategoriesToCache: (categories) => {
    cacheService.saveToCache(cacheService.CACHE_KEYS.CATEGORIES, categories);
  },

  // Save subcategories to cache
  saveSubcategoriesToCache: (subcategories) => {
    cacheService.saveToCache(cacheService.CACHE_KEYS.SUBCATEGORIES, subcategories);
  }
};
