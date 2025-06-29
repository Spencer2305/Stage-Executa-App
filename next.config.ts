import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during builds for faster deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
