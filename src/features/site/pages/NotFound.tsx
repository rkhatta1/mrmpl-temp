// @ts-nocheck
"use client";
import { Link } from "@/lib/next-router";

export default function NotFound() {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <Link to="/" className="underline">Go home</Link>
    </div>
  );
}
