import { NextResponse } from "next/server";
import { buildApiIndex } from "app/(utils)/lib/publicApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/index — machine-readable public API index (also rewritten from /api) */
export async function GET() {
  const body = buildApiIndex();
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=120, stale-while-revalidate=3600",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
