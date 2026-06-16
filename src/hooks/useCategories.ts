// @ts-nocheck
import { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await categoryService.getCategoriesWithSubcategories();
        
        setCategories(data.categories || []);
        setSubcategories(data.subcategories || []);
      } catch (err) {
        console.error('Error fetching categories and subcategories:', err);
        setError(err.message || 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndSubcategories();
  }, []);

  // Get subcategories for a specific category
  const getSubcategoriesForCategory = (categoryId) => {
    return subcategories.filter(sub => sub.category === categoryId || sub.category?._id === categoryId);
  };

  // Get category by ID
  const getCategoryById = (categoryId) => {
    return categories.find(cat => cat._id === categoryId);
  };

  // Refresh data (clear cache and refetch)
  const refreshData = async () => {
    try {
      setLoading(true);
      categoryService.clearCache();
      
      const data = await categoryService.getCategoriesWithSubcategories();
      setCategories(data.categories || []);
      setSubcategories(data.subcategories || []);
    } catch (err) {
      console.error('Error refreshing categories:', err);
      setError(err.message || 'Failed to refresh categories');
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    subcategories,
    loading,
    error,
    getSubcategoriesForCategory,
    getCategoryById,
    refreshData
  };
};
