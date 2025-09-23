import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental: { esmExternals: 'loose' }, // Removed - not recommended in Next.js 15
  // transpilePackages: ['@zama-fhe/relayer-sdk'], // Removed - using CDN approach
  onDemandEntries: { maxInactiveAge: 60 * 1000, pagesBufferLength: 2 }, // giảm nóng
  webpack: (config, { isServer }) => {
    // Polyfill global for browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        global: false,
      };
    }
    
    // Fix chunk loading issues
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          zama: {
            test: /[\\/]node_modules[\\/]@zama-fhe[\\/]/,
            name: 'zama',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };
    
    return config;
  },
  headers() {
    // Required by FHEVM 
    return Promise.resolve([
      {
        source: '/',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]);
  }
};

export default nextConfig;
