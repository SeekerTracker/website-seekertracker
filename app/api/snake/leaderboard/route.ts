import { NextResponse } from "next/server";

const SNAKE_API =
  process.env.SNAKE_AIRDROP_API_URL ||
  "https://snake-airdrop-api.gm-4e8.workers.dev";

/**
 * Snake leaderboard for seekertracker.com/snake.
 * Proxies the CF Worker (Turso via HTTP) — never @libsql/client on Workers edge.
 */
export async function GET() {
  try {
    const res = await fetch(`${SNAKE_API}/leaderboard?period=all&limit=20`, {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Snake CF leaderboard upstream error", res.status, text.slice(0, 200));
      return NextResponse.json(
        { error: "Failed to fetch leaderboard", success: false },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      leaderboard?: Array<{
        rank?: number;
        wallet?: string;
        domain?: string | null;
        score?: number;
        played_at?: string;
      }>;
    };

    const rows = Array.isArray(data.leaderboard) ? data.leaderboard : [];

    // Shape expected by app/(pages)/snake/page.tsx
    const leaderboard = rows.map((row, i) => ({
      wallet: row.wallet || "",
      username: row.domain || null,
      high_score: Number(row.score) || 0,
      total_plays: 0,
      total_score: Number(row.score) || 0,
      skrId: row.domain || null,
      rank: row.rank || i + 1,
    }));

    return NextResponse.json({
      success: true,
      leaderboard,
      stats: {
        totalPlayers: leaderboard.length,
        totalGames: 0,
      },
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard", success: false },
      { status: 500 }
    );
  }
}
