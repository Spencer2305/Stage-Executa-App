/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force edge runtime to avoid client reference manifest issues
  experimental: {
    runtime: 'nodejs',
    appDir: true,
  },
  
  // Disable problematic features
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Force static optimization
  trailingSlash: false,
  
  // Minimal webpack config
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
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