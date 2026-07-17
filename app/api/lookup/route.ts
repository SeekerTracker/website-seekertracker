import { NextRequest, NextResponse } from "next/server";
import { getDomainsByOwner } from "app/(utils)/lib/domainStore";

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet parameter" }, { status: 400 });
  }
  if (wallet.length < 32 || wallet.length > 44) {
    return NextResponse.json(
      { error: "Invalid wallet address format" },
      { status: 400 }
    );
  }

  try {
    const domains = getDomainsByOwner(wallet).map((d) => ({
      subdomain: d.subdomain,
      domain: d.domain || ".skr",
      createdAt: d.created_at,
      rank: String(d.rank),
    }));

    return NextResponse.json({
      success: true,
      wallet,
      domains,
      count: domains.length,
    });
  } catch (error) {
    console.error("Lookup API error:", error);
    return NextResponse.json({ error: "Failed to lookup wallet" }, { status: 500 });
  }
}
