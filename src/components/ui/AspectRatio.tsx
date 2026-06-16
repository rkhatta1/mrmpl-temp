// @ts-nocheck
"use client";
import React from 'react';

const AspectRatio = ({ 
  ratio = 16/9, 
  className = '', 
  children, 
  ...props 
}) => {
  const paddingBottom = `${100 / ratio}%`;
  
  return (
    <div 
      className={`relative w-full ${className}`}
      style={{ paddingBottom }}
      {...props}
    >
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
};

export { AspectRatio };
