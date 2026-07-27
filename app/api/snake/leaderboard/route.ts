import { NextResponse } from "next/server";
import { CONN_RPC_URL, SEEKER_TOKEN_ADDRESS } from "../../../(utils)/constant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Snake leaderboard + global stats for seekertracker.com/snake.
 * Reads Snake Turso over HTTP pipeline (never @libsql/client on Workers).
 *
 * Prefers SNAKE_TURSO_* secrets; falls back to SNAKE_AIRDROP_API_URL worker.
 * Enriches each row with live TRACKER balance (for reward eligibility).
 */

const SNAKE_API =
  process.env.SNAKE_AIRDROP_API_URL ||
  "https://snake-airdrop-api.gm-4e8.workers.dev";

const TRACKER_MINT = SEEKER_TOKEN_ADDRESS;
const MIN_REWARD_TRACKER = 1_000_000;

/** Batch-fetch TRACKER balances for wallets via getTokenAccountsByOwner */
async function fetchTrackerBalances(
  wallets: string[]
): Promise<Record<string, number>> {
  const unique = [...new Set(wallets.filter(Boolean))];
  if (unique.length === 0) return {};

  const body = unique.map((wallet, i) => ({
    jsonrpc: "2.0",
    id: `tb-${i}`,
    method: "getTokenAccountsByOwner",
    params: [
      wallet,
      { mint: TRACKER_MINT },
      { encoding: "jsonParsed", commitment: "confirmed" },
    ],
  }));

  try {
    const res = await fetch(CONN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) return Object.fromEntries(unique.map((w) => [w, 0]));

    const data = (await res.json()) as Array<{
      id?: string;
      result?: {
        value?: Array<{
          account?: {
            data?: {
              parsed?: {
                info?: { tokenAmount?: { uiAmount?: number | null } };
              };
            };
          };
        }>;
      };
    }>;

    const out: Record<string, number> = {};
    for (let i = 0; i < unique.length; i++) {
      const wallet = unique[i];
      const entry = Array.isArray(data)
        ? data.find((d) => d.id === `tb-${i}`) || data[i]
        : null;
      const accounts = entry?.result?.value || [];
      let bal = 0;
      for (const acc of accounts) {
        const ui = acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
        if (typeof ui === "number" && Number.isFinite(ui)) bal += ui;
      }
      out[wallet] = bal;
    }
    return out;
  } catch (e) {
    console.error("fetchTrackerBalances failed", e);
    return Object.fromEntries(unique.map((w) => [w, 0]));
  }
}

function withBalances<
  T extends { wallet: string; [k: string]: unknown },
>(rows: T[], balances: Record<string, number>) {
  return rows.map((row) => {
    const trackerBalance = balances[row.wallet] ?? 0;
    return {
      ...row,
      trackerBalance,
      eligible: trackerBalance >= MIN_REWARD_TRACKER,
    };
  });
}

function snakeTursoBase(): string | null {
  const raw =
    process.env.SNAKE_TURSO_URL ||
    process.env.SNAKE_TURSO_DATABASE_URL ||
    null;
  if (!raw) return null;
  return raw.replace(/^libsql:\/\//, "https://").replace(/\/$/, "");
}

function snakeTursoToken(): string | null {
  return process.env.SNAKE_TURSO_AUTH_TOKEN || process.env.SNAKE_TURSO_TOKEN || null;
}

type PipelineResult = {
  results?: Array<{
    type?: string;
    response?: {
      result?: {
        rows?: Array<Array<{ type?: string; value?: string | null } | null>>;
      };
    };
  }>;
};

async function tursoPipeline(
  base: string,
  token: string,
  statements: Array<{ sql: string; args?: Array<string | number> }>
): Promise<PipelineResult> {
  const requests = statements.map((stmt) => ({
    type: "execute" as const,
    stmt: {
      sql: stmt.sql,
      args: (stmt.args || []).map((arg) => {
        if (typeof arg === "number") {
          return { type: "integer", value: String(arg) };
        }
        return { type: "text", value: String(arg) };
      }),
    },
  }));
  requests.push({ type: "close" } as never);

  const res = await fetch(`${base}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Turso HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as PipelineResult;
}

function cell(
  row: Array<{ type?: string; value?: string | null } | null> | undefined,
  i: number
): string {
  return row?.[i]?.value ?? "";
}

export async function GET() {
  try {
    const base = snakeTursoBase();
    const token = snakeTursoToken();

    if (base && token) {
      const data = await tursoPipeline(base, token, [
        {
          sql: `SELECT u.wallet, u.username, s.high_score, s.total_plays, s.total_score
                FROM stats s
                JOIN users u ON u.id = s.user_id
                WHERE s.high_score > 0
                ORDER BY s.high_score DESC
                LIMIT 20`,
        },
        { sql: `SELECT COUNT(*) FROM users` },
        { sql: `SELECT COUNT(*) FROM games` },
      ]);

      const lbRows = data.results?.[0]?.response?.result?.rows || [];
      const playersRaw = cell(data.results?.[1]?.response?.result?.rows?.[0], 0);
      const gamesRaw = cell(data.results?.[2]?.response?.result?.rows?.[0], 0);

      const baseBoard = lbRows.map((row, i) => {
        const wallet = cell(row, 0);
        const username = cell(row, 1) || null;
        return {
          wallet,
          username,
          high_score: Number(cell(row, 2)) || 0,
          total_plays: Number(cell(row, 3)) || 0,
          total_score: Number(cell(row, 4)) || 0,
          skrId: username,
          rank: i + 1,
        };
      });

      const balances = await fetchTrackerBalances(baseBoard.map((r) => r.wallet));
      const leaderboard = withBalances(baseBoard, balances);

      return NextResponse.json({
        success: true,
        leaderboard,
        minRewardTracker: MIN_REWARD_TRACKER,
        stats: {
          totalPlayers: Number(playersRaw) || 0,
          totalGames: Number(gamesRaw) || 0,
        },
      }, { headers: { "Cache-Control": "no-store" } });
    }

    // Fallback: CF worker list + separate count queries via worker if present
    const res = await fetch(`${SNAKE_API}/leaderboard?period=all&limit=20`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch leaderboard", success: false },
        { status: 502 }
      );
    }
    const upstream = (await res.json()) as {
      leaderboard?: Array<{
        wallet?: string;
        domain?: string | null;
        score?: number;
        total_plays?: number;
        total_score?: number;
      }>;
      stats?: { totalPlayers?: number; totalGames?: number };
    };

    const rows = Array.isArray(upstream.leaderboard) ? upstream.leaderboard : [];
    const baseBoard = rows.map((row, i) => ({
      wallet: row.wallet || "",
      username: row.domain || null,
      high_score: Number(row.score) || 0,
      total_plays: Number(row.total_plays) || 0,
      total_score: Number(row.total_score ?? row.score) || 0,
      skrId: row.domain || null,
      rank: i + 1,
    }));

    // Prefer upstream stats; never fake with top-20 length
    let totalPlayers = Number(upstream.stats?.totalPlayers) || 0;
    let totalGames = Number(upstream.stats?.totalGames) || 0;

    if (!totalPlayers || !totalGames) {
      try {
        const statsRes = await fetch(`${SNAKE_API}/global-stats`, {
          cache: "no-store",
        });
        if (statsRes.ok) {
          const s = (await statsRes.json()) as {
            totalPlayers?: number;
            totalGames?: number;
          };
          totalPlayers = Number(s.totalPlayers) || totalPlayers;
          totalGames = Number(s.totalGames) || totalGames;
        }
      } catch {
        /* ignore */
      }
    }

    const balances = await fetchTrackerBalances(baseBoard.map((r) => r.wallet));
    const leaderboard = withBalances(baseBoard, balances);

    return NextResponse.json({
      success: true,
      leaderboard,
      minRewardTracker: MIN_REWARD_TRACKER,
      stats: { totalPlayers, totalGames },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard", success: false },
      { status: 500 }
    );
  }
}
