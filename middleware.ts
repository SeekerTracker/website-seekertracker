import { NextRequest, NextResponse } from "next/server";
import { isPublicCorsPath } from "app/(utils)/lib/publicApi";

/**
 * 1) www → apex 301 (avoid duplicate indexing)
 * 2) Open CORS for public read APIs and discovery docs
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Canonical host: apex only
  if (host === "www.seekertracker.com") {
    const url = request.nextUrl.clone();
    url.host = "seekertracker.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  if (!isPublicCorsPath(pathname) && !pathnameIsDiscovery(pathname)) {
    return NextResponse.next();
  }

  // Discovery paths always get CORS even if not in isPublicCorsPath
  if (pathnameIsDiscovery(pathname) || isPublicCorsPath(pathname)) {
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

  return NextResponse.next();
}

function corsHeaders(request: NextRequest): Headers {
  const h = new Headers();
  const origin = request.headers.get("origin");
  h.set("Access-Control-Allow-Origin", origin || "*");
  h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  h.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, X-Requested-With"
  );
  h.set("Access-Control-Max-Age", "86400");
  h.set("Vary", "Origin");
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
    pathname === "/openapi.json" ||
    pathname === "/solana.txt"
  );
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static assets / Next internals.
     * Needed so www→apex applies sitewide.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$).*)",
  ],
};
