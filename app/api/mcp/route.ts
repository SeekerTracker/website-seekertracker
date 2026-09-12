/**
 * Streamable HTTP MCP for SeekerIDs and Seeker dApps.
 * https://seekertracker.com/api/mcp
 */
import { getDomainByName, getDomainsByOwner } from "app/(utils)/lib/domainStore";
import { getDappByPackage } from "app/(utils)/lib/dappStore";
import { getTurso, hasTurso } from "app/(utils)/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVER_INFO = { name: "seekertracker-mcp", version: "1.0.0" };
const SITE = "https://seekertracker.com";

const TOOLS = [
  {
    name: "lookup_id",
    description:
      "Look up a Solana Mobile SeekerID (.skr domain) by name. Accepts name or name.skr. Returns owner wallet, rank, created_at, and profile URL.",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "SeekerID, with or without .skr (e.g. metasal or metasal.skr)",
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "lookup_wallet",
    description:
      "List .skr SeekerIDs owned by a Solana wallet (base58).",
    inputSchema: {
      type: "object",
      properties: {
        wallet: { type: "string", description: "Base58 Solana wallet" },
      },
      required: ["wallet"],
    },
  },
  {
    name: "search_apps",
    description:
      "Search the Solana Seeker dApp Store catalog mirrored on Seeker Tracker. Filter by name, package, or publisher.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search text" },
        limit: { type: "number", description: "Max results (default 15, max 40)" },
      },
      required: ["q"],
    },
  },
  {
    name: "get_app",
    description:
      "Get one Seeker dApp by Android package name (e.g. com.seekertracker).",
    inputSchema: {
      type: "object",
      properties: {
        package: {
          type: "string",
          description: "androidPackage, e.g. com.snakeseeker",
        },
      },
      required: ["package"],
    },
  },
];

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

function jsonRpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}
function jsonRpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}
function textContent(obj: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}

async function searchApps(q: string, limit: number) {
  if (!hasTurso()) return [];
  const db = getTurso();
  const like = `%${q.replace(/%/g, "")}%`;
  const res = await db.execute({
    sql: `SELECT android_package, display_name, subtitle, publisher_name,
                 twitter, website_override, publisher_website, status, rating
          FROM seeker_dapps
          WHERE status = 'active' AND (
            display_name LIKE ? COLLATE NOCASE
            OR android_package LIKE ? COLLATE NOCASE
            OR publisher_name LIKE ? COLLATE NOCASE
            OR subtitle LIKE ? COLLATE NOCASE
          )
          ORDER BY rating DESC
          LIMIT ?`,
    args: [like, like, like, like, limit],
  });
  return res.rows.map((r) => {
    const row = r as Record<string, unknown>;
    const pkg = String(row.android_package);
    return {
      package: pkg,
      name: row.display_name || pkg,
      subtitle: row.subtitle || null,
      publisher: row.publisher_name || null,
      twitter: row.twitter || null,
      website: row.website_override || row.publisher_website || null,
      rating: row.rating ?? null,
      url: `${SITE}/dapps/${pkg}`,
    };
  });
}

async function callTool(name: string, args: Record<string, unknown>) {
  if (name === "lookup_id") {
    const domain = String(args.domain || "").trim();
    if (!domain) throw new Error("domain is required");
    const row = await getDomainByName(domain);
    if (!row) throw new Error(`SeekerID not found: ${domain}`);
    const full = `${row.subdomain}.skr`;
    return textContent({
      domain: full,
      subdomain: row.subdomain,
      rank: row.rank,
      owner: row.owner,
      created_at: row.created_at,
      url: `${SITE}/id/${full}`,
      source: SITE,
    });
  }
  if (name === "lookup_wallet") {
    const wallet = String(args.wallet || "").trim();
    if (wallet.length < 32 || wallet.length > 44) {
      throw new Error("Invalid wallet");
    }
    const rows = await getDomainsByOwner(wallet);
    return textContent({
      wallet,
      count: rows.length,
      domains: rows.map((d) => ({
        domain: `${d.subdomain}.skr`,
        rank: d.rank,
        created_at: d.created_at,
        url: `${SITE}/id/${d.subdomain}.skr`,
      })),
      source: SITE,
    });
  }
  if (name === "search_apps") {
    const q = String(args.q || "").trim();
    if (!q) throw new Error("q is required");
    const limit = Math.min(40, Math.max(1, Number(args.limit) || 15));
    const apps = await searchApps(q, limit);
    return textContent({ q, count: apps.length, apps, source: SITE });
  }
  if (name === "get_app") {
    const pkg = String(args.package || "").trim();
    if (!pkg) throw new Error("package is required");
    const app = await getDappByPackage(pkg);
    if (!app) throw new Error(`App not found: ${pkg}`);
    return textContent({
      ...app,
      url: `${SITE}/dapps/${pkg}`,
      source: SITE,
    });
  }
  throw new Error(`Unknown tool: ${name}`);
}

async function handleMessage(msg: {
  jsonrpc?: string;
  id?: unknown;
  method?: string;
  params?: Record<string, unknown>;
}) {
  const id = msg.id;
  const method = msg.method;
  if (!method) return jsonRpcError(id, -32600, "Invalid Request");
  try {
    switch (method) {
      case "initialize":
        return jsonRpcResult(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions:
            "Seeker Tracker MCP. Use lookup_id for .skr SeekerIDs, lookup_wallet for wallet reverse lookup, search_apps / get_app for the Solana Seeker dApp catalog.",
        });
      case "notifications/initialized":
      case "initialized":
        return null;
      case "ping":
        return jsonRpcResult(id, {});
      case "tools/list":
        return jsonRpcResult(id, { tools: TOOLS });
      case "tools/call": {
        const params = msg.params || {};
        const name = String(params.name || "");
        const args = (params.arguments || {}) as Record<string, unknown>;
        const result = await callTool(name, args);
        return jsonRpcResult(id, result);
      }
      default:
        return jsonRpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Tool error";
    if (method === "tools/call") {
      return jsonRpcResult(id, {
        content: [{ type: "text", text: message }],
        isError: true,
      });
    }
    return jsonRpcError(id, -32000, message);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET() {
  return Response.json(
    {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocol: "mcp",
      transport: "streamable-http",
      endpoint: `${SITE}/api/mcp`,
      tools: TOOLS.map((t) => t.name),
    },
    { headers: { ...CORS, "Cache-Control": "public, max-age=300" } },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(jsonRpcError(null, -32700, "Parse error"), {
      status: 400,
      headers: CORS,
    });
  }
  const messages = Array.isArray(body) ? body : [body];
  const responses: unknown[] = [];
  for (const msg of messages) {
    const res = await handleMessage(
      msg as { id?: unknown; method?: string; params?: Record<string, unknown> },
    );
    if (res !== null) responses.push(res);
  }
  if (responses.length === 0) {
    return new Response(null, { status: 202, headers: CORS });
  }
  const payload = Array.isArray(body) ? responses : responses[0];
  return Response.json(payload, {
    headers: {
      ...CORS,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
