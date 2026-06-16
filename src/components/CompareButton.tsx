// @ts-nocheck
"use client";
import React from 'react';
import { Button } from './ui/Button';
import { GitCompare, Plus, Check, X } from 'lucide-react';
import { useCompare } from '../contexts/CompareContext';

const CompareButton = ({ product, variant = 'default', size = 'sm', className = '' }) => {
  const { addToCompare, removeFromCompare, isInCompareList, canAddToCompare } = useCompare();
  
  const isInCompare = isInCompareList(product._id);
  const canAdd = canAddToCompare();

  const handleClick = () => {
    if (isInCompare) {
      removeFromCompare(product._id);
    } else {
      if (canAdd) {
        addToCompare(product);
      } else {
        alert('You can compare maximum 3 products at a time. Please remove a product first.');
      }
    }
  };

  const getButtonContent = () => {
    if (isInCompare) {
      return (
        <>
          <Check className="w-4 h-4" />
          <span className="ml-2">Added</span>
        </>
      );
    }
    
    return (
      <>
        {canAdd ? null : <X className="w-4 h-4" />}
        <span className="ml-2">
          {canAdd ? 'Compare' : 'Max Reached'}
        </span>
      </>
    );
  };

  const getButtonStyles = () => {
    const baseStyles = "transition-all duration-200 cursor-pointer";
    
    if (variant === 'outline') {
      return `${baseStyles} ${
        isInCompare 
          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
          : canAdd
            ? 'border-green-300 text-green-700 hover:bg-green-50'
            : 'border-gray-200 text-gray-400 cursor-not-allowed'
      }`;
    }
    
    if (variant === 'ghost') {
      return `${baseStyles} ${
        isInCompare 
          ? 'bg-green-50 text-green-700 hover:bg-green-100' 
          : canAdd
            ? 'text-green-700 hover:bg-green-50'
            : 'text-gray-400 cursor-not-allowed'
      }`;
    }
    
    // Default variant
    return `${baseStyles} ${
      isInCompare 
        ? 'bg-green-600 text-white hover:bg-green-700' 
        : canAdd
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-gray-400 text-white cursor-not-allowed'
    }`;
  };

  return (
    <Button
      onClick={handleClick}
      variant={isInCompare ? 'default' : 'outline'}
      size={size}
      className={`${getButtonStyles()} ${className}`}
      disabled={!canAdd && !isInCompare}
    >
      {getButtonContent()}
    </Button>
  );
};

export default CompareButton;
