import { NextRequest, NextResponse } from "next/server";
import { listDomains } from "app/(utils)/lib/domainStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST/GET /api/domains — Turso/Supabase-free domain list from bundled snapshot
 */
async function handle(body: Record<string, unknown>) {
  const page = Math.max(1, Number(body.page || 1));
  const pageSize = Math.min(
    200_000,
    Math.max(1, Number(body.pageSize ?? body.limit ?? 50))
  );
  const sortBy = String(body.sortBy || "newest") as
    | "newest"
    | "oldest"
    | "name"
    | "name-reverse"
    | "length";
  const query = body.query != null ? String(body.query) : "";
  const rank =
    body.rank != null && body.rank !== "" ? Number(body.rank) : undefined;
  const beforeTimestamp =
    body.beforeTimestamp != null ? String(body.beforeTimestamp) : null;

  const result = listDomains({
    page,
    pageSize,
    sortBy,
    query,
    rank,
    beforeTimestamp,
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return await handle(body);
  } catch (e) {
    console.error("POST /api/domains", e);
    return NextResponse.json(
      { success: false, message: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const body: Record<string, unknown> = {};
    for (const key of [
      "page",
      "pageSize",
      "limit",
      "sortBy",
      "query",
      "rank",
      "beforeTimestamp",
    ]) {
      const v = sp.get(key);
      if (v != null) body[key] = v;
    }
    return await handle(body);
  } catch (e) {
    console.error("GET /api/domains", e);
    return NextResponse.json(
      { success: false, message: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}
