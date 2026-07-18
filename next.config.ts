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
      // /domain/* → /id/* (legacy profile paths)
      {
        source: "/domain/:path*",
        destination: "/id/:path*",
      },
      // /dapps and /apps are both first-class catalog URLs (same UI)
      { source: "/dapps", destination: "/apps" },
      { source: "/dapps/manage", destination: "/apps/manage" },
      { source: "/dapps/:path*", destination: "/apps/:path*" },
    ];
  },
};

export default nextConfig;
