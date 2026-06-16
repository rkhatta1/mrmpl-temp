// @ts-nocheck
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext();

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

export const CompareProvider = ({ children }) => {
  const [compareList, setCompareList] = useState([]);

  // Load compare list from localStorage on mount
  useEffect(() => {
    const savedCompareList = localStorage.getItem('compareList');
    if (savedCompareList) {
      try {
        setCompareList(JSON.parse(savedCompareList));
      } catch (error) {
        console.error('Error loading compare list from localStorage:', error);
      }
    }
  }, []);

  // Save compare list to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (product) => {
    setCompareList(prev => {
      // Check if product is already in compare list
      if (prev.some(item => item._id === product._id)) {
        return prev;
      }
      
      // Check if we already have 3 products
      if (prev.length >= 3) {
        alert('You can compare maximum 3 products at a time. Please remove a product first.');
        return prev;
      }
      
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId) => {
    setCompareList(prev => prev.filter(item => item._id !== productId));
  };

  const clearCompareList = () => {
    setCompareList([]);
  };

  const isInCompareList = (productId) => {
    return compareList.some(item => item._id === productId);
  };

  const canAddToCompare = () => {
    return compareList.length < 3;
  };

  const value = {
    compareList,
    addToCompare,
    removeFromCompare,
    clearCompareList,
    isInCompareList,
    canAddToCompare,
    compareCount: compareList.length
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
};
