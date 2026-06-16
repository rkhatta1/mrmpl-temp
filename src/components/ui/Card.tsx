// @ts-nocheck
"use client";
import React from 'react';

const Card = ({ 
  className = '', 
  children, 
  ...props 
}) => {
  const baseClasses = 'rounded-lg border border-border bg-card text-card-foreground shadow-sm';
  const classes = `${baseClasses} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ 
  className = '', 
  children, 
  ...props 
}) => {
  const baseClasses = 'flex flex-col space-y-1.5 p-6';
  const classes = `${baseClasses} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({ 
  className = '', 
  children, 
  ...props 
}) => {
  const baseClasses = 'text-2xl font-semibold leading-none tracking-tight';
  const classes = `${baseClasses} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardDescription = ({ 
  className = '', 
  children, 
  ...props 
}) => {
  const baseClasses = 'text-sm text-muted-foreground';
  const classes = `${baseClasses} ${className}`;
  
  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
};

const CardContent = ({ 
  className = '', 
  children, 
  ...props 
}) => {
  const baseClasses = 'p-6 pt-0';
  const classes = `${baseClasses} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ 
  className = '', 
  children, 
  ...props 
}) => {
  const baseClasses = 'flex items-center p-6 pt-0';
  const classes = `${baseClasses} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
