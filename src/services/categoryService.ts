// @ts-nocheck
import { cacheService } from './cacheService';
import { PRODUCT_CATEGORIES, PRODUCT_SUBCATEGORIES } from '@/data/product-taxonomy';

const getLocalCategories = () => PRODUCT_CATEGORIES.map(category => ({ ...category }));
const getLocalSubcategories = () => PRODUCT_SUBCATEGORIES.map(subcategory => ({ ...subcategory }));

export const categoryService = {
  // Get all categories
  getCategories: async () => {
    return {
      success: true,
      data: getLocalCategories(),
    };
  },

  // Get category by ID
  getCategoryById: async (id) => {
    const category = getLocalCategories().find(category => category._id === id);
    return {
      success: Boolean(category),
      data: category || null,
    };
  },

  // Get categories with products count
  getCategoriesWithCount: async () => {
    return {
      success: true,
      data: getLocalCategories().map(category => ({
        ...category,
        productsCount: 0,
      })),
    };
  },

  // Get all subcategories
  getSubcategories: async (categoryId = null) => {
    const subcategories = getLocalSubcategories();
    return {
      success: true,
      data: categoryId
        ? subcategories.filter(subcategory => subcategory.category === categoryId)
        : subcategories,
    };
  },

  // Get categories with subcategories (cached)
  getCategoriesWithSubcategories: async () => {
    const categories = getLocalCategories();
    const subcategories = getLocalSubcategories();

    cacheService.saveCategoriesToCache(categories);
    cacheService.saveSubcategoriesToCache(subcategories);

    return {
      categories,
      subcategories
    };
  },

  // Clear cache
  clearCache: () => {
    cacheService.clearCache();
  }
};
