import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = "https://api.metasal.xyz";

/**
 * SKR szn1 summary — prefer /api/summary, fallback /api/full.summary
 */
export async function GET() {
  try {
    const summary = await fetchJson(`${UPSTREAM}/api/summary`, 10_000);
    if (summary?.success || summary?.grandTotal != null) {
      return NextResponse.json(shape(summary), {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    const full = await fetchJson(`${UPSTREAM}/api/full?page=1&limit=1`, 10_000);
    if (full) {
      const nested = full.summary;
      const payload =
        nested && typeof nested === "object"
          ? (nested as Record<string, unknown>)
          : full;
      return NextResponse.json(shape(payload), {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 502 }
    );
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function shape(raw: Record<string, unknown>) {
  const s = (raw.summary as Record<string, unknown>) || raw;
  return {
    success: true,
    generated: raw.generated || s.generated || new Date().toISOString(),
    totalClaimers: Number(s.totalClaimers ?? 0),
    totalAllocations: Number(s.totalAllocations ?? 0),
    totalLocked: Number(s.totalLocked ?? 0),
    totalLockedWithdrawn: Number(s.totalLockedWithdrawn ?? 0),
    totalUnlocked: Number(s.totalUnlocked ?? 0),
    grandTotal: Number(s.grandTotal ?? 0),
  };
}

async function fetchJson(url: string, ms: number) {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(ms),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
