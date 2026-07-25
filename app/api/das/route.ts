import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const DAS_PUBLIC =
  "https://seeker-das-scanner.gm-4e8.workers.dev/public/das";

/** Thin proxy so the homepage can hit same-origin /api/das */
export async function GET() {
  try {
    const res = await fetch(DAS_PUBLIC, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "DAS upstream error", status: res.status },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "DAS fetch failed" },
      { status: 502 }
    );
  }
}
