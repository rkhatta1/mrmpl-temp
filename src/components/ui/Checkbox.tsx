// @ts-nocheck
"use client";
import React from 'react';

const Checkbox = ({ 
  checked, 
  onCheckedChange, 
  className = '', 
  ...props 
}) => {
  const baseClasses = 'h-4 w-4 rounded border border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  const classes = `${baseClasses} ${className}`;
  
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={classes}
      {...props}
    />
  );
};

export { Checkbox };
