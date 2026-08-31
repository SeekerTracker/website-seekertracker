import { NextRequest, NextResponse } from "next/server";
import { SEEKER_TOKEN_ADDRESS } from "../../../(utils)/constant";
import {
  fetchMintBalancesAta,
  fetchSkrStakedBalances,
  rpcLabel,
} from "../../../(utils)/lib/solanaRpc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Snake leaderboard — periods match the game: all | weekly | daily.
 * Enriches rows with TRACKER + SKR balances and eligible (≥250k TRACKER).
 * Balances via ATA getAccountInfo on aex402 (getTokenAccountsByOwner unsupported).
 */

const SNAKE_API =
  process.env.SNAKE_AIRDROP_API_URL ||
  "https://snake-airdrop-api.gm-4e8.workers.dev";

const TRACKER_MINT = SEEKER_TOKEN_ADDRESS;
const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";
const MIN_REWARD_TRACKER = 250_000;

type Period = "all" | "weekly" | "daily";

function normalizePeriod(raw: string | null): Period {
  const p = (raw || "all").toLowerCase().trim();
  if (p === "week" || p === "weekly" || p === "7d") return "weekly";
  if (p === "day" || p === "daily" || p === "24h") return "daily";
  return "all";
}

/** Map to snake-airdrop-api period param */
function airdropPeriod(p: Period): string {
  if (p === "weekly") return "weekly";
  if (p === "daily") return "daily";
  return "all";
}

type BoardRow = {
  wallet: string;
  username: string | null;
  high_score: number;
  total_plays: number;
  total_score: number;
  skrId: string | null;
  rank: number;
  played_at?: string | null;
};

function withBalances(
  rows: BoardRow[],
  trackerBalances: Record<string, number | null>,
  skrBalances: Record<string, number | null>,
  skrStakedBalances: Record<string, number | null>
) {
  return rows.map((row) => {
    const trackerBalance =
      row.wallet in trackerBalances
        ? trackerBalances[row.wallet]
        : null;
    const skrBalance =
      row.wallet in skrBalances ? skrBalances[row.wallet] : null;
    const skrStaked =
      row.wallet in skrStakedBalances
        ? skrStakedBalances[row.wallet]
        : null;
    const eligible =
      typeof trackerBalance === "number"
        ? trackerBalance >= MIN_REWARD_TRACKER
        : null;
    return {
      ...row,
      trackerBalance,
      skrBalance,
      skrStaked,
      eligible,
    };
  });
}

async function enrichLeaderboard(baseBoard: BoardRow[]) {
  const wallets = baseBoard.map((r) => r.wallet);
  const [trackerRes, skrRes, stakedRes] = await Promise.all([
    fetchMintBalancesAta(wallets, TRACKER_MINT),
    fetchMintBalancesAta(wallets, SKR_MINT),
    fetchSkrStakedBalances(wallets),
  ]);
  return {
    rows: withBalances(
      baseBoard,
      trackerRes.balances,
      skrRes.balances,
      stakedRes.balances
    ),
    rpc: trackerRes.rpc || skrRes.rpc || stakedRes.rpc,
  };
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
  return (
    process.env.SNAKE_TURSO_AUTH_TOKEN || process.env.SNAKE_TURSO_TOKEN || null
  );
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

async function fetchFromAirdropApi(
  period: Period,
  limit: number
): Promise<BoardRow[]> {
  const res = await fetch(
    `${SNAKE_API}/leaderboard?period=${airdropPeriod(period)}&limit=${limit}`,
    { cache: "no-store", headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`airdrop API ${res.status}`);
  const upstream = (await res.json()) as {
    leaderboard?: Array<{
      wallet?: string;
      domain?: string | null;
      score?: number;
      total_plays?: number;
      total_score?: number;
      played_at?: string;
    }>;
  };
  const rows = Array.isArray(upstream.leaderboard) ? upstream.leaderboard : [];
  return rows.map((row, i) => ({
    wallet: row.wallet || "",
    username: row.domain || null,
    high_score: Number(row.score) || 0,
    total_plays: Number(row.total_plays) || 0,
    total_score: Number(row.total_score ?? row.score) || 0,
    skrId: row.domain || null,
    rank: i + 1,
    played_at: row.played_at || null,
  }));
}

async function fetchAllTimeFromTurso(
  base: string,
  token: string,
  limit: number
): Promise<{
  board: BoardRow[];
  totalPlayers: number;
  totalGames: number;
} | null> {
  try {
    // Single pipeline: top board + counts (no extra 200-wallet scan query)
    const data = await tursoPipeline(base, token, [
      {
        sql: `SELECT u.wallet, u.username, s.high_score, s.total_plays, s.total_score,
                     (SELECT MAX(g.played_at) FROM games g WHERE g.user_id = s.user_id) AS last_played
              FROM stats s
              JOIN users u ON u.id = s.user_id
              WHERE s.high_score > 0
              ORDER BY s.high_score DESC
              LIMIT ?`,
        args: [limit],
      },
      { sql: `SELECT COUNT(*) FROM users` },
      { sql: `SELECT COUNT(*) FROM games` },
    ]);

    const lbRows = data.results?.[0]?.response?.result?.rows || [];
    const playersRaw = cell(data.results?.[1]?.response?.result?.rows?.[0], 0);
    const gamesRaw = cell(data.results?.[2]?.response?.result?.rows?.[0], 0);

    const board = lbRows.map((row, i) => {
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
        played_at: cell(row, 5) || null,
      };
    });

    return {
      board,
      totalPlayers: Number(playersRaw) || 0,
      totalGames: Number(gamesRaw) || 0,
    };
  } catch (e) {
    console.warn("turso all-time failed", e);
    return null;
  }
}

async function fetchPeriodFromTurso(
  base: string,
  token: string,
  period: "weekly" | "daily",
  limit: number
): Promise<BoardRow[] | null> {
  const window = period === "daily" ? "-1 day" : "-7 days";
  // Prefer played_at (indexed) only — no sequential fallback RTT
  try {
    const data = await tursoPipeline(base, token, [
      {
        sql: `SELECT u.wallet, u.username, MAX(g.score) AS high_score,
                     COUNT(*) AS total_plays, SUM(g.score) AS total_score,
                     MAX(g.played_at) AS last_played
              FROM games g
              JOIN users u ON u.id = g.user_id
              WHERE g.played_at >= datetime('now', ?)
              GROUP BY u.id
              HAVING high_score > 0
              ORDER BY high_score DESC
              LIMIT ?`,
        args: [window, limit],
      },
    ]);
    const lbRows = data.results?.[0]?.response?.result?.rows || [];
    if (!lbRows.length) return [];
    return lbRows.map((row, i) => {
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
        played_at: cell(row, 5) || null,
      };
    });
  } catch (e) {
    console.warn("turso period failed", e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const period = normalizePeriod(
      request.nextUrl.searchParams.get("period")
    );
    const limit = Math.min(
      50,
      Math.max(5, Number(request.nextUrl.searchParams.get("limit") || 20))
    );
    // Extra wallets to scan for eligible count among top scorers
    const scanLimit = Math.min(100, Math.max(limit, 50));

    const base = snakeTursoBase();
    const token = snakeTursoToken();

    let board: BoardRow[] = [];
    let totalPlayers = 0;
    let totalGames = 0;
    let source = "airdrop-api";

    if (period === "all" && base && token) {
      const turso = await fetchAllTimeFromTurso(base, token, scanLimit);
      if (turso?.board?.length) {
        board = turso.board;
        totalPlayers = turso.totalPlayers;
        totalGames = turso.totalGames;
        source = "turso";
      }
    } else if ((period === "weekly" || period === "daily") && base && token) {
      const tursoBoard = await fetchPeriodFromTurso(
        base,
        token,
        period,
        scanLimit
      );
      if (tursoBoard?.length) {
        board = tursoBoard;
        source = "turso";
      }
    }

    if (!board.length) {
      board = await fetchFromAirdropApi(period, scanLimit);
      source = "airdrop-api";
    }

    // Display board (top `limit`) — enrich once (scan = same rows, no double RPC)
    const displayBoard = board.slice(0, limit);
    const { rows: leaderboard, rpc } = await enrichLeaderboard(displayBoard);
    const balanceRpc = rpcLabel(rpc);

    const eligibleOnBoard = leaderboard.filter((r) => r.eligible === true)
      .length;
    const eligibleAmongTop = eligibleOnBoard;
    const scannedPlayers = leaderboard.filter(
      (r) => typeof r.trackerBalance === "number"
    ).length;
    const balancesOk = scannedPlayers > 0;

    return NextResponse.json(
      {
        success: true,
        period,
        leaderboard,
        minRewardTracker: MIN_REWARD_TRACKER,
        rewardMint: SKR_MINT,
        holdMint: TRACKER_MINT,
        stats: {
          totalPlayers,
          totalGames,
          eligibleOnBoard,
          eligiblePlayers: eligibleAmongTop,
          scannedPlayers,
          balancesOk,
          boardSize: leaderboard.length,
          rpc: balanceRpc,
        },
        source,
      },
      {
        headers: {
          // Edge/CDN may cache briefly — balances refresh every request when uncached
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard", success: false },
      { status: 500 }
    );
  }
}
