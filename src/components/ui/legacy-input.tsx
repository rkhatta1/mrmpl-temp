// @ts-nocheck
"use client";

import React from "react";

const Input = ({ className = "", type = "text", ...props }) => {
  const baseClasses =
    "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <input
      className={[baseClasses, className].join(" ")}
      type={type}
      {...props}
    />
  );
};

export { Input };
