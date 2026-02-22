import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "unavatar.io" },
    ],
  },
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
