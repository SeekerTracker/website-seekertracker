import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle domain snapshot for serverless domain APIs
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/**/*", "./public/data/**/*"],
    "/*": ["./data/**/*", "./public/data/**/*"],
  },
  // Native canvas used only for legacy passport PNG route — externalize for CF
  serverExternalPackages: ["canvas", "@napi-rs/canvas"],

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
