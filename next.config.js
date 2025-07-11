/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable problematic features for Netlify
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Netlify-friendly settings
  trailingSlash: false,
  
  // Minimal webpack config for compatibility
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