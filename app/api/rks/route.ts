import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = "https://rks-dashboard.gm-4e8.workers.dev/api/stats";

export async function GET() {
  try {
    const res = await fetch(UPSTREAM, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.ok ? 200 : res.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "upstream_unavailable" },
      { status: 502 },
    );
  }
}
