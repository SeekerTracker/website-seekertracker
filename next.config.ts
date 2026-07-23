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
  async redirects() {
    return [
      // Public catalog URL is /dapps; keep /apps as permanent redirects
      { source: "/apps", destination: "/dapps", permanent: true },
      { source: "/apps/:path*", destination: "/dapps/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [
      // Exact /api → public agent index (OpenNext does not always bind app/api/route.ts)
      { source: "/api", destination: "/api/index" },
      // /domain/* → /id/* (legacy profile paths)
      {
        source: "/domain/:path*",
        destination: "/id/:path*",
      },
      // Internal app routes still live under app/(pages)/apps/*
      { source: "/dapps", destination: "/apps" },
      { source: "/dapps/manage", destination: "/apps/manage" },
      { source: "/dapps/:path*", destination: "/apps/:path*" },
    ];
  },
};

export default nextConfig;
