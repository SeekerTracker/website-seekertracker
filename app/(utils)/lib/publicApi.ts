/**
 * Public read API surface for bots and agents (API-first).
 * Keep this list in sync with /llms.txt, /api, and /openapi.json.
 */

export const SITE_ORIGIN = "https://seekertracker.com";

export type PublicEndpoint = {
  path: string;
  methods: ("GET" | "POST")[];
  auth: false;
  summary: string;
  /** Example relative query or body for docs */
  example?: string;
};

/** Paths that may be called cross-origin without credentials. */
export const PUBLIC_CORS_PREFIXES = [
  "/api",
  "/llms.txt",
  "/llms-full.txt",
  "/openapi.json",
  "/robots.txt",
  "/sitemap.xml",
] as const;

/** Write / private routes that must NOT get open CORS. */
export const PRIVATE_API_PREFIXES = [
  "/api/cron",
  "/api/dapps/claim",
  "/api/dapps/manage",
  "/api/export",
  "/api/unsubscribe",
  "/api/download",
] as const;

export function isPublicCorsPath(pathname: string): boolean {
  if (PRIVATE_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return false;
  }
  return PUBLIC_CORS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export const PUBLIC_ENDPOINTS: PublicEndpoint[] = [
  {
    path: "/api",
    methods: ["GET"],
    auth: false,
    summary: "API index: discovery links and public endpoint list (alias of /api/index)",
  },
  {
    path: "/api/index",
    methods: ["GET"],
    auth: false,
    summary: "API index: discovery links and public endpoint list",
  },
  {
    path: "/api/health",
    methods: ["GET"],
    auth: false,
    summary: "Liveness, domain count, catalog source (turso/snapshot)",
  },
  {
    path: "/api/price",
    methods: ["GET", "POST"],
    auth: false,
    summary: "SOL and SKR USD prices (Jupiter v3, DexScreener fallback)",
  },
  {
    path: "/api/domains",
    methods: ["GET", "POST"],
    auth: false,
    summary: "List/search .skr SeekerID domains",
    example: "?page=1&pageSize=50&sortBy=newest&query=meta",
  },
  {
    path: "/api/domain",
    methods: ["GET", "POST"],
    auth: false,
    summary: "Lookup one domain by name",
    example: '?domain=metasal.skr  or POST {"domain":"metasal.skr"}',
  },
  {
    path: "/api/lookup",
    methods: ["GET"],
    auth: false,
    summary: "Domains owned by a Solana wallet",
    example: "?wallet=<base58>",
  },
  {
    path: "/api/dappstore",
    methods: ["GET"],
    auth: false,
    summary: "Seeker dApp catalog (active/removed/all)",
    example: "?package=com.example.app | ?q=wallet | ?status=active",
  },
  {
    path: "/api/skr/vault",
    methods: ["GET"],
    auth: false,
    summary: "SKR vault balances, price, supply, market cap",
  },
  {
    path: "/api/skr/summary",
    methods: ["GET"],
    auth: false,
    summary: "SKR ecosystem summary stats",
  },
  {
    path: "/api/skr/stakers",
    methods: ["GET"],
    auth: false,
    summary: "SKR staking participants",
  },
  {
    path: "/api/skr/report",
    methods: ["GET"],
    auth: false,
    summary: "SKR report payload",
  },
  {
    path: "/api/activations",
    methods: ["GET"],
    auth: false,
    summary: "SeekerID registration activity (day/week/month views)",
    example: "?view=day",
  },
  {
    path: "/api/competitors",
    methods: ["GET"],
    auth: false,
    summary: "Competitor / market comparison snapshot",
  },
  {
    path: "/api/seeker-fund",
    methods: ["GET"],
    auth: false,
    summary: "TRACKER fund fees + 24h volume (client shell stats)",
  },
  {
    path: "/api/allocation/{wallet}",
    methods: ["GET"],
    auth: false,
    summary: "Allocation data for a wallet",
  },
  {
    path: "/api/snake/config",
    methods: ["GET"],
    auth: false,
    summary: "Snake game config",
  },
  {
    path: "/api/snake/leaderboard",
    methods: ["GET"],
    auth: false,
    summary: "Snake leaderboard",
  },
  {
    path: "/api/snake/prize",
    methods: ["GET"],
    auth: false,
    summary: "Snake prize pool",
  },
  {
    path: "/api/sweep/contestants",
    methods: ["GET"],
    auth: false,
    summary: "Sweep contestants",
  },
  {
    path: "/openapi.json",
    methods: ["GET"],
    auth: false,
    summary: "OpenAPI 3.1 description of the public API",
  },
  {
    path: "/llms.txt",
    methods: ["GET"],
    auth: false,
    summary: "Agent discovery document (start here)",
  },
];

export function buildApiIndex() {
  return {
    name: "Seeker Tracker Public API",
    version: "1.0.0",
    baseUrl: SITE_ORIGIN,
    policy: "api-first",
    description:
      "Unofficial Solana Mobile ecosystem data: .skr SeekerIDs, Seeker dApps, SKR stats, and prices. Prefer these JSON endpoints over HTML scraping.",
    docs: {
      llms: `${SITE_ORIGIN}/llms.txt`,
      openapi: `${SITE_ORIGIN}/openapi.json`,
      developers: `${SITE_ORIGIN}/developers`,
      skill: "https://github.com/SeekerTracker/website-seekertracker/tree/main/skills/seekertracker",
      skillInstall: "npx skills add SeekerTracker/website-seekertracker@seekertracker",
      skillsSh: "https://skills.sh/SeekerTracker/website-seekertracker",
    },
    skill: {
      name: "seekertracker",
      install: "npx skills add SeekerTracker/website-seekertracker@seekertracker",
      installGlobal: "npx skills add SeekerTracker/website-seekertracker@seekertracker -g -y",
      source:
        "https://github.com/SeekerTracker/website-seekertracker/tree/main/skills/seekertracker",
      directory: "https://skills.sh/SeekerTracker/website-seekertracker",
    },
    auth: "None required for listed public read endpoints.",
    cors: "Open CORS (GET/POST/OPTIONS) on public read paths. No credentials.",
    rateLimit:
      "Be polite. Prefer caching. Large domain exports may be rate-limited. Do not hammer ?refresh=1.",
    usage:
      "Use for product features, research, and agent tooling. Do not use bulk HTML scrapes or model training crawls of the site as a substitute for this API.",
    endpoints: PUBLIC_ENDPOINTS.map((e) => ({
      path: e.path,
      methods: e.methods,
      auth: e.auth,
      summary: e.summary,
      example: e.example ?? null,
      url: e.path.includes("{")
        ? null
        : `${SITE_ORIGIN}${e.path}${e.example?.startsWith("?") ? e.example.split(" ")[0] : ""}`,
    })),
    humanPages: {
      home: SITE_ORIGIN,
      apps: `${SITE_ORIGIN}/apps`,
      appDetail: `${SITE_ORIGIN}/apps/{androidPackage}`,
      domainProfile: `${SITE_ORIGIN}/id/{name.skr}`,
      skr: `${SITE_ORIGIN}/skr`,
    },
  };
}

export function buildOpenApiSpec() {
  const paths: Record<string, unknown> = {
    "/api": {
      get: {
        operationId: "getApiIndex",
        summary: "API index",
        responses: {
          "200": {
            description: "Discovery document",
            content: { "application/json": { schema: { type: "object" } } },
          },
        },
      },
    },
    "/api/health": {
      get: {
        operationId: "getHealth",
        summary: "Health and domain count",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    domains: { type: "integer" },
                    source: { type: "string" },
                    turso: { type: "boolean" },
                    loadedAt: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/price": {
      get: {
        operationId: "getPrices",
        summary: "SOL and SKR USD prices",
        responses: {
          "200": {
            description: "Prices",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    usdPrice: { type: "number", description: "SOL USD (legacy)" },
                    solPrice: { type: "number" },
                    skrPrice: { type: "number" },
                    source: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: "postPrices",
        summary: "SOL and SKR USD prices (same as GET)",
        responses: { "200": { description: "Prices" } },
      },
    },
    "/api/domains": {
      get: {
        operationId: "listDomains",
        summary: "List or search .skr domains",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          {
            name: "pageSize",
            in: "query",
            schema: { type: "integer", default: 50, maximum: 200000 },
          },
          {
            name: "sortBy",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "oldest", "name", "name-reverse", "length"],
            },
          },
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "rank", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Paginated domain list" } },
      },
      post: {
        operationId: "listDomainsPost",
        summary: "List or search .skr domains (JSON body)",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  pageSize: { type: "integer" },
                  sortBy: { type: "string" },
                  query: { type: "string" },
                  rank: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Paginated domain list" } },
      },
    },
    "/api/domain": {
      get: {
        operationId: "getDomain",
        summary: "Lookup one domain",
        parameters: [
          {
            name: "domain",
            in: "query",
            required: true,
            schema: { type: "string", example: "metasal.skr" },
          },
        ],
        responses: {
          "200": { description: "Domain record" },
          "404": { description: "Not found" },
        },
      },
      post: {
        operationId: "postDomain",
        summary: "Lookup one domain (JSON body)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["domain"],
                properties: { domain: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Domain record" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/lookup": {
      get: {
        operationId: "lookupWallet",
        summary: "Domains owned by wallet",
        parameters: [
          {
            name: "wallet",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Wallet domain list" } },
      },
    },
    "/api/dappstore": {
      get: {
        operationId: "getDappstore",
        summary: "Seeker dApp catalog or single package",
        parameters: [
          { name: "package", in: "query", schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["active", "removed", "all"] },
          },
          { name: "action", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Catalog or app" } },
      },
    },
    "/api/skr/vault": {
      get: {
        operationId: "getSkrVault",
        summary: "SKR vault stats and price",
        responses: { "200": { description: "Vault payload" } },
      },
    },
    "/api/skr/summary": {
      get: {
        operationId: "getSkrSummary",
        summary: "SKR summary",
        responses: { "200": { description: "Summary" } },
      },
    },
    "/api/activations": {
      get: {
        operationId: "getActivations",
        summary: "Registration activity",
        parameters: [
          {
            name: "view",
            in: "query",
            schema: { type: "string", enum: ["day", "week", "month"] },
          },
        ],
        responses: { "200": { description: "Activation series" } },
      },
    },
    "/api/competitors": {
      get: {
        operationId: "getCompetitors",
        summary: "Competitor snapshot",
        responses: { "200": { description: "Competitors" } },
      },
    },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "Seeker Tracker Public API",
      version: "1.0.0",
      description:
        "API-first access to unofficial Solana Mobile ecosystem data on seekertracker.com. Prefer JSON endpoints over HTML scraping. No API key required for public reads.",
      contact: { url: SITE_ORIGIN },
      license: {
        name: "Unofficial product data",
        url: `${SITE_ORIGIN}/license`,
      },
    },
    servers: [{ url: SITE_ORIGIN }],
    paths,
    tags: [
      { name: "discovery" },
      { name: "domains" },
      { name: "dapps" },
      { name: "prices" },
      { name: "skr" },
    ],
  };
}

export function buildLlmsTxt(): string {
  const lines = [
    "# Seeker Tracker",
    "",
    `> Unofficial Solana Mobile ecosystem explorer: .skr SeekerIDs, Seeker dApps, SKR stats, prices.`,
    "",
    `Base URL: ${SITE_ORIGIN}`,
    "Policy: API-first. Prefer JSON APIs over HTML scraping.",
    "Auth: none for public read endpoints listed below.",
    "CORS: open on public read paths (no credentials).",
    "Training: do not use this site as a bulk training corpus; use APIs for live product data.",
    "",
    "## Start here",
    "",
    `- API index (JSON): ${SITE_ORIGIN}/api`,
    `- OpenAPI: ${SITE_ORIGIN}/openapi.json`,
    `- Human docs: ${SITE_ORIGIN}/developers`,
    `- This file: ${SITE_ORIGIN}/llms.txt`,
    "",
    "## Agent skill (skills.sh)",
    "",
    "Install procedural knowledge for Claude Code, Codex, Cursor, and other agents:",
    "",
    "```bash",
    "npx skills add SeekerTracker/website-seekertracker@seekertracker",
    "",
    "# global, skip prompts",
    "npx skills add SeekerTracker/website-seekertracker@seekertracker -g -y",
    "```",
    "",
    `- Source: https://github.com/SeekerTracker/website-seekertracker/tree/main/skills/seekertracker`,
    `- Directory: https://skills.sh/SeekerTracker/website-seekertracker`,
    `- Docs page: ${SITE_ORIGIN}/developers#agent-skill`,
    "",
    "After install, agents should follow the skill and prefer these JSON APIs over HTML.",
    "",
    "## Public endpoints",
    "",
  ];

  for (const e of PUBLIC_ENDPOINTS) {
    const methods = e.methods.join("|");
    lines.push(`- ${methods} ${e.path} — ${e.summary}`);
    if (e.example) lines.push(`  example: ${e.example}`);
  }

  lines.push(
    "",
    "## Quick examples",
    "",
    "```bash",
    `curl -sS ${SITE_ORIGIN}/api/health`,
    `curl -sS ${SITE_ORIGIN}/api/price`,
    `curl -sS '${SITE_ORIGIN}/api/domains?page=1&pageSize=20&sortBy=newest'`,
    `curl -sS '${SITE_ORIGIN}/api/domain?domain=metasal.skr'`,
    `curl -sS '${SITE_ORIGIN}/api/lookup?wallet=YOUR_WALLET'`,
    `curl -sS '${SITE_ORIGIN}/api/dappstore?package=com.seekertracker'`,
    `curl -sS ${SITE_ORIGIN}/api/skr/vault`,
    "```",
    "",
    "## Human pages (secondary)",
    "",
    `- Home: ${SITE_ORIGIN}/`,
    `- dApp catalog: ${SITE_ORIGIN}/apps`,
    `- dApp detail: ${SITE_ORIGIN}/apps/{androidPackage}`,
    `- Domain profile: ${SITE_ORIGIN}/id/{name.skr}`,
    `- SKR: ${SITE_ORIGIN}/skr`,
    `- Developers / skill install: ${SITE_ORIGIN}/developers`,
    "",
    "## Not public",
    "",
    "Cron, listing claim/manage, export (wallet-gated), and unsubscribe require auth or are not part of the public agent surface.",
    "",
    "## Contact",
    "",
    "- Site: https://seekertracker.com",
    "- X: https://x.com/Seeker_Tracker",
    "- Telegram: https://t.me/seeker_tracker",
    ""
  );

  return lines.join("\n");
}
