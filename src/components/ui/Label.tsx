// @ts-nocheck
"use client";
import React from 'react';

const Label = ({ 
  children, 
  className = '', 
  htmlFor,
  ...props 
}) => {
  const baseClasses = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';
  const classes = `${baseClasses} ${className}`;
  
  return (
    <label 
      htmlFor={htmlFor}
      className={classes}
      {...props}
    >
      {children}
    </label>
  );
};

export { Label };
