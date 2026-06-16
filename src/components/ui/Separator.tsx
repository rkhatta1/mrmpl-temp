// @ts-nocheck
"use client";
import React from 'react';

const Separator = ({ 
  className = '', 
  orientation = 'horizontal',
  ...props 
}) => {
  const baseClasses = orientation === 'horizontal' 
    ? 'h-[1px] w-full' 
    : 'h-full w-[1px]';
  const classes = `${baseClasses} bg-border ${className}`;
  
  return (
    <div 
      className={classes}
      {...props}
    />
  );
};

export { Separator };
