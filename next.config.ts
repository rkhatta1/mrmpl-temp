import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Use the compatibility API for Next tooling; check-types runs TypeScript 7.
    useTypeScriptCli: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
