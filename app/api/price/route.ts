import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/price  { ticker?: "SOLUSDC" }
 * Replaces charity priceData for SOL USD price.
 */
export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => ({}));

    // Jupiter price API (public)
    const res = await fetch(
      "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112",
      { next: { revalidate: 30 } }
    );
    if (!res.ok) {
      return NextResponse.json({ usdPrice: 0 }, { status: 502 });
    }
    const data = await res.json();
    const usdPrice = Number(
      data?.data?.So11111111111111111111111111111111111111112?.price ?? 0
    );
    return NextResponse.json({ usdPrice, ticker: "SOLUSDC" });
  } catch (e) {
    console.error("POST /api/price", e);
    return NextResponse.json({ usdPrice: 0 }, { status: 500 });
  }
}

export async function GET() {
  return POST(new NextRequest("http://local/api/price", { method: "POST", body: "{}" }));
}
