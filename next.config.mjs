/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Bundle analyzer - run with ANALYZE=true npm run build
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
          openAnalyzer: false,
        })
      );
      return config;
    },
  }),
  // Experimental optimizations
  experimental: {
    // Optimize package imports for Lucide - tree shake unused icons
    optimizePackageImports: ['lucide-react'],
  },

};

export default nextConfig;
