import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Rewrite all /id/... to /domain/...
      {
        source: '/domain/:path*',
        destination: '/id/:path*',
      },
    ];
  },
};

export default nextConfig;
