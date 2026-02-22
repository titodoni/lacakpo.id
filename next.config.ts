import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress middleware deprecation warning (still supported)
  experimental: {
    // @ts-ignore - this flag suppresses the middleware warning
    proxyTimeout: undefined,
  },
};

export default nextConfig;
