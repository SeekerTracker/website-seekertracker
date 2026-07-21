import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "app/(utils)/lib/publicApi";

export const runtime = "nodejs";
export const dynamic = "force-static";

/** GET /openapi.json */
export async function GET() {
  return NextResponse.json(buildOpenApiSpec(), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
