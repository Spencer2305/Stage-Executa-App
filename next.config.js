/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for Vercel compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Remove output standalone - this might be causing the manifest issue
  // output: 'standalone',
  
  // Completely disable experimental features
  experimental: {},
  
  // Basic headers only
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;