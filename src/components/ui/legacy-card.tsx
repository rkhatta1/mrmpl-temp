// @ts-nocheck
"use client";

import React from "react";

const withClasses = (baseClasses, className) =>
  [baseClasses, className].join(" ");

const Card = ({ className = "", children, ...props }) => (
  <div
    className={withClasses(
      "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ className = "", children, ...props }) => (
  <div
    className={withClasses("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  >
    {children}
  </div>
);

const CardTitle = ({ className = "", children, ...props }) => (
  <div
    className={withClasses(
      "text-2xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

const CardDescription = ({ className = "", children, ...props }) => (
  <p
    className={withClasses("text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </p>
);

const CardContent = ({ className = "", children, ...props }) => (
  <div className={withClasses("p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

const CardFooter = ({ className = "", children, ...props }) => (
  <div className={withClasses("flex items-center p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
