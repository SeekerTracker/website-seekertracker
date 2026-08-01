import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = "https://api.metasal.xyz";
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;

  if (!SOLANA_ADDRESS_RE.test(wallet)) {
    return NextResponse.json(
      { success: false, error: "Invalid Solana address" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${UPSTREAM}/api/allocation/${wallet}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
      // Avoid sticky bad edge cache of 5xx
      cache: "no-store",
    });

    if (!response.ok) {
      // Upstream often flakes — try once more
      const retry = await fetch(`${UPSTREAM}/api/allocation/${wallet}`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
        cache: "no-store",
      });
      if (!retry.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Upstream HTTP ${retry.status}`,
          },
          { status: 502 }
        );
      }
      const data = await retry.json();
      return NextResponse.json(normalize(data, wallet), {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(normalize(data, wallet), {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || /timeout/i.test(error.message));
    console.error("Allocation API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: isTimeout ? "Request timed out" : "Failed to fetch allocation",
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}

function normalize(data: Record<string, unknown>, wallet: string) {
  const details =
    (data.claimDetails as Record<string, number> | null | undefined) || null;
  const lockedAmount = Number(details?.lockedAmount ?? data.lockedAmount ?? 0);
  const lockedWithdrawn = Number(
    details?.lockedWithdrawn ?? data.lockedWithdrawn ?? 0
  );
  const unlockedAmount = Number(
    details?.unlockedAmount ?? data.unlockedAmount ?? 0
  );
  const totalAllocation = Number(
    details?.totalAllocation ??
      data.totalAllocation ??
      lockedAmount + unlockedAmount
  );

  return {
    success: true,
    wallet: (data.wallet as string) || wallet,
    claimStatusPDA: (data.claimStatusPDA as string) || "",
    hasClaimed: Boolean(data.hasClaimed),
    claimDetails: {
      lockedAmount,
      lockedWithdrawn,
      unlockedAmount,
      totalAllocation,
    },
    currentBalance: Number(data.currentBalance ?? 0),
  };
}
