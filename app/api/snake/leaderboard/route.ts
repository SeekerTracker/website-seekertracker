import { NextResponse } from "next/server";
import { CONN_RPC_URL, SEEKER_TOKEN_ADDRESS } from "../../../(utils)/constant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Snake leaderboard + global stats for seekertracker.com/snake.
 * Reads Snake Turso over HTTP pipeline (never @libsql/client on Workers).
 *
 * Prefers SNAKE_TURSO_* secrets; falls back to SNAKE_AIRDROP_API_URL worker.
 * Enriches each row with live TRACKER + SKR balances.
 */

const SNAKE_API =
  process.env.SNAKE_AIRDROP_API_URL ||
  "https://snake-airdrop-api.gm-4e8.workers.dev";

const TRACKER_MINT = SEEKER_TOKEN_ADDRESS;
/** Seeker SKR mint (reward token) */
const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";
const MIN_REWARD_TRACKER = 1_000_000;

function rpcCandidates(): string[] {
  const list: string[] = [];
  if (process.env.SOLANA_RPC_URL) list.push(process.env.SOLANA_RPC_URL);
  if (process.env.HELIUS_API_KEY) {
    list.push(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    );
  }
  if (CONN_RPC_URL) list.push(CONN_RPC_URL);
  list.push(
    "https://solana-rpc.publicnode.com",
    "https://api.mainnet-beta.solana.com"
  );
  return Array.from(new Set(list.filter(Boolean)));
}

type RpcAccount = {
  account?: {
    data?: {
      parsed?: {
        info?: { tokenAmount?: { uiAmount?: number | null } };
      };
    };
  };
};

async function fetchMintBalanceOne(
  rpc: string,
  wallet: string,
  mint: string
): Promise<number | null> {
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          wallet,
          { mint },
          { encoding: "jsonParsed", commitment: "confirmed" },
        ],
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      error?: { message?: string };
      result?: { value?: RpcAccount[] };
    };
    if (data.error) return null;
    let bal = 0;
    for (const acc of data.result?.value || []) {
      const ui = acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      if (typeof ui === "number" && Number.isFinite(ui)) bal += ui;
    }
    return bal;
  } catch {
    return null;
  }
}

/** Pick a working RPC once, then fetch all wallets (TRACKER or SKR). */
async function fetchMintBalances(
  wallets: string[],
  mint: string
): Promise<Record<string, number>> {
  const unique = Array.from(new Set(wallets.filter(Boolean)));
  const out: Record<string, number> = Object.fromEntries(
    unique.map((w) => [w, 0])
  );
  if (unique.length === 0) return out;

  const rpcs = rpcCandidates();
  let rpc: string | null = null;
  for (const candidate of rpcs) {
    const probe = await fetchMintBalanceOne(candidate, unique[0], mint);
    if (probe !== null) {
      rpc = candidate;
      out[unique[0]] = probe;
      break;
    }
  }
  if (!rpc) {
    console.error("fetchMintBalances: all RPCs failed for mint", mint);
    return out;
  }

  const rest = unique.slice(1);
  const CONCURRENCY = 6;
  for (let i = 0; i < rest.length; i += CONCURRENCY) {
    const chunk = rest.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map((w) => fetchMintBalanceOne(rpc!, w, mint))
    );
    chunk.forEach((w, j) => {
      out[w] = results[j] ?? 0;
    });
  }
  return out;
}

function withBalances<T extends { wallet: string; [k: string]: unknown }>(
  rows: T[],
  trackerBalances: Record<string, number>,
  skrBalances: Record<string, number>
) {
  return rows.map((row) => {
    const trackerBalance = trackerBalances[row.wallet] ?? 0;
    const skrBalance = skrBalances[row.wallet] ?? 0;
    return {
      ...row,
      trackerBalance,
      skrBalance,
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

async function enrichLeaderboard(
  baseBoard: Array<{
    wallet: string;
    username: string | null;
    high_score: number;
    total_plays: number;
    total_score: number;
    skrId: string | null;
    rank: number;
  }>
) {
  const wallets = baseBoard.map((r) => r.wallet);
  const [trackerBalances, skrBalances] = await Promise.all([
    fetchMintBalances(wallets, TRACKER_MINT),
    fetchMintBalances(wallets, SKR_MINT),
  ]);
  return withBalances(baseBoard, trackerBalances, skrBalances);
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

      const leaderboard = await enrichLeaderboard(baseBoard);

      return NextResponse.json(
        {
          success: true,
          leaderboard,
          minRewardTracker: MIN_REWARD_TRACKER,
          rewardMint: SKR_MINT,
          holdMint: TRACKER_MINT,
          stats: {
            totalPlayers: Number(playersRaw) || 0,
            totalGames: Number(gamesRaw) || 0,
          },
        },
        { headers: { "Cache-Control": "no-store" } }
      );
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

    const leaderboard = await enrichLeaderboard(baseBoard);

    return NextResponse.json(
      {
        success: true,
        leaderboard,
        minRewardTracker: MIN_REWARD_TRACKER,
        rewardMint: SKR_MINT,
        holdMint: TRACKER_MINT,
        stats: { totalPlayers, totalGames },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard", success: false },
      { status: 500 }
    );
  }
}
