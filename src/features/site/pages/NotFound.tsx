// @ts-nocheck
"use client";
import { ArrowRight, Home, Search } from "lucide-react";

import { Link } from "@/lib/next-router";

export default function NotFound() {
  return (
    <section className="min-h-[calc(100vh-5rem)] bg-white pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-700">
            <Search className="h-9 w-9" aria-hidden="true" />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-green-700">404</p>
          <h1 className="mb-5 text-4xl font-bold tracking-tight text-gray-950 md:text-6xl">
            Page not found
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-gray-600">
            The page may have moved, or the address may be typed incorrectly.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-md bg-green-700 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
            >
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Go Home
            </Link>
            <Link
              to="/products?search=true"
              className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-800"
            >
              Search Products
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
