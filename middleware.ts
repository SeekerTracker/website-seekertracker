import { NextRequest, NextResponse } from "next/server";
import { isPublicCorsPath } from "app/(utils)/lib/publicApi";

/**
 * Open CORS for public read APIs and discovery docs so browser agents
 * and tool runtimes can call seekertracker.com without scraping HTML.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isPublicCorsPath(pathname)) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  const response = NextResponse.next();
  const headers = corsHeaders(request);
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}

function corsHeaders(request: NextRequest): Headers {
  const h = new Headers();
  const origin = request.headers.get("origin");
  // Public read data only — reflect origin or allow all
  h.set("Access-Control-Allow-Origin", origin || "*");
  h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  h.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, X-Requested-With"
  );
  h.set("Access-Control-Max-Age", "86400");
  h.set("Vary", "Origin");
  // Hint for caches / agents
  if (pathnameIsDiscovery(request.nextUrl.pathname)) {
    h.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  }
  return h;
}

function pathnameIsDiscovery(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/openapi.json"
  );
}

export const config = {
  matcher: [
    "/api",
    "/api/:path*",
    "/llms.txt",
    "/llms-full.txt",
    "/openapi.json",
  ],
};
