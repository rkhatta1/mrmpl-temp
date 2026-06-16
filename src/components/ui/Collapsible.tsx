// @ts-nocheck
"use client";
import React, { createContext, useContext, useState } from 'react';

const CollapsibleContext = createContext();

const Collapsible = ({ 
  children, 
  open, 
  onOpenChange, 
  className = '',
  ...props 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  return (
    <CollapsibleContext.Provider value={{ isOpen, setIsOpen }}>
      <div className={className} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
};

const CollapsibleTrigger = ({ 
  children, 
  asChild = false, 
  className = '',
  ...props 
}) => {
  const { setIsOpen, isOpen } = useContext(CollapsibleContext);
  
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      className: `${children.props.className || ''} ${className}`,
      ...props
    });
  }

  return (
    <button 
      onClick={handleClick}
      className={`cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const CollapsibleContent = ({ 
  children, 
  className = '',
  ...props 
}) => {
  const { isOpen } = useContext(CollapsibleContext);

  if (!isOpen) return null;

  return (
    <div 
      className={`overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
