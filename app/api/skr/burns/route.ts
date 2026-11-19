import { NextResponse } from "next/server";
import { fetchSkrBurns } from "app/(utils)/lib/skrBurns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/skr/burns — official SKR buy-and-burn totals from on-chain txs */
export async function GET() {
  try {
    const data = await fetchSkrBurns();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    console.error("GET /api/skr/burns", e);
    return NextResponse.json(
      { success: false, message: "Failed to load burn data" },
      { status: 502 }
    );
  }
}
