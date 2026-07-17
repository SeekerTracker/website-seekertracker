/**
 * Domain index loaded from bundled gzip snapshot.
 * Works on Node (fs) and Cloudflare Workers (fetch /public asset).
 */
import type { DomainInfo } from "../constantTypes";

export type DomainRecord = {
  rank: number;
  domain: string;
  subdomain: string;
  owner: string;
  created_at: string;
};

type Index = {
  rows: DomainRecord[];
  bySubdomain: Map<string, DomainRecord>;
  byOwner: Map<string, DomainRecord[]>;
  domainsByDate: Record<string, number>;
  domainsByTimeRange: Record<string, number>;
  loadedAt: number;
};

let index: Index | null = null;
let loading: Promise<Index> | null = null;

const SNAPSHOT_REL = "data/seeker-domains.jsonl.gz";

async function readSnapshotBytes(): Promise<Uint8Array> {
  // 1) Node filesystem (local / Vercel tracing)
  try {
    const { readFileSync, existsSync } = await import("fs");
    const { join } = await import("path");
    const candidates = [
      join(process.cwd(), "data", "seeker-domains.jsonl.gz"),
      join(process.cwd(), "public", "data", "seeker-domains.jsonl.gz"),
    ];
    for (const p of candidates) {
      if (existsSync(p)) {
        return new Uint8Array(readFileSync(p));
      }
    }
  } catch {
    /* not node fs */
  }

  // 2) Fetch from public asset (Cloudflare ASSETS / any CDN)
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.CF_PAGES_URL ||
    "https://seekertracker.com";
  const url = `${base.replace(/\/$/, "")}/${SNAPSHOT_REL}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load domain snapshot from ${url}: ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  // Node zlib
  try {
    const { gunzipSync } = await import("zlib");
    return gunzipSync(Buffer.from(bytes)).toString("utf8");
  } catch {
    /* fall through */
  }
  // DecompressionStream (Workers / modern runtimes)
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([bytes.buffer as ArrayBuffer]).stream().pipeThrough(ds);
  return await new Response(stream).text();
}

function buildIndex(raw: string): Index {
  const rows: DomainRecord[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line) as DomainRecord);
    } catch {
      /* skip */
    }
  }

  const bySubdomain = new Map<string, DomainRecord>();
  const byOwner = new Map<string, DomainRecord[]>();
  const domainsByDate: Record<string, number> = {};
  const hourCounts = new Array(24).fill(0);

  for (const r of rows) {
    bySubdomain.set(r.subdomain.toLowerCase(), r);
    const list = byOwner.get(r.owner) || [];
    list.push(r);
    byOwner.set(r.owner, list);

    const day = r.created_at.slice(0, 10);
    domainsByDate[day] = (domainsByDate[day] || 0) + 1;

    if (r.created_at.length >= 13) {
      const h = parseInt(r.created_at.slice(11, 13), 10);
      if (h >= 0 && h < 24) hourCounts[h]++;
    }
  }

  for (const [owner, list] of byOwner) {
    list.sort((a, b) => a.subdomain.length - b.subdomain.length);
    byOwner.set(owner, list);
  }

  const sum = (a: number, b: number) =>
    hourCounts.slice(a, b).reduce((s, n) => s + n, 0);

  return {
    rows,
    bySubdomain,
    byOwner,
    domainsByDate,
    domainsByTimeRange: {
      "0-6": sum(0, 6),
      "6-12": sum(6, 12),
      "12-18": sum(12, 18),
      "18-24": sum(18, 24),
    },
    loadedAt: Date.now(),
  };
}

export async function ensureIndex(): Promise<Index> {
  if (index) return index;
  if (!loading) {
    loading = (async () => {
      try {
        const bytes = await readSnapshotBytes();
        const text = await gunzip(bytes);
        index = buildIndex(text);
        console.log(`Domain index loaded: ${index.rows.length} rows`);
        return index;
      } catch (e) {
        console.error("Domain index load failed", e);
        index = {
          rows: [],
          bySubdomain: new Map(),
          byOwner: new Map(),
          domainsByDate: {},
          domainsByTimeRange: {},
          loadedAt: Date.now(),
        };
        return index;
      } finally {
        loading = null;
      }
    })();
  }
  return loading;
}

export function recordToDomainInfo(r: DomainRecord): DomainInfo {
  return {
    domain: r.domain || ".skr",
    subdomain: r.subdomain,
    created_at: r.created_at,
    subdomain_tx: "",
    subdomain_tx_blocktime: r.created_at,
    name_account: "",
    tld_account: "",
    owner: r.owner,
    rank: r.rank,
    non_transferable: false,
  };
}

export type ListParams = {
  page?: number;
  pageSize?: number;
  sortBy?: "newest" | "oldest" | "name" | "name-reverse" | "length";
  query?: string;
  rank?: number;
  beforeTimestamp?: string | null;
};

export async function listDomains(params: ListParams = {}) {
  const idx = await ensureIndex();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200_000, Math.max(1, params.pageSize ?? 50));
  const sortBy = params.sortBy ?? "newest";
  const query = (params.query || "").trim().toLowerCase();
  const rank = params.rank;
  const before = params.beforeTimestamp;

  let filtered = idx.rows;
  if (query || rank || before) {
    filtered = idx.rows.filter((r) => {
      if (query && !r.subdomain.toLowerCase().includes(query)) return false;
      if (rank != null && Number.isFinite(rank) && r.rank !== rank) return false;
      if (before && r.created_at > before) return false;
      return true;
    });
  }

  const sorted = [...filtered];
  switch (sortBy) {
    case "oldest":
      sorted.sort(
        (a, b) => a.created_at.localeCompare(b.created_at) || a.rank - b.rank
      );
      break;
    case "name":
      sorted.sort((a, b) => a.subdomain.localeCompare(b.subdomain));
      break;
    case "name-reverse":
      sorted.sort((a, b) => b.subdomain.localeCompare(a.subdomain));
      break;
    case "length":
      sorted.sort(
        (a, b) =>
          a.subdomain.length - b.subdomain.length ||
          a.subdomain.localeCompare(b.subdomain)
      );
      break;
    case "newest":
    default:
      sorted.sort(
        (a, b) => b.created_at.localeCompare(a.created_at) || b.rank - a.rank
      );
      break;
  }

  const total = sorted.length;
  const offset = (page - 1) * pageSize;
  const pageRows = sorted.slice(offset, offset + pageSize);

  return {
    success: true as const,
    message: "Fetched domains successfully",
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    totalDomains: idx.rows.length,
    domainsByDate: idx.domainsByDate,
    domainsByTimeRange: idx.domainsByTimeRange,
    data: pageRows.map(recordToDomainInfo),
  };
}

export async function getDomainByName(name: string): Promise<DomainRecord | null> {
  const idx = await ensureIndex();
  let raw = name.trim().toLowerCase();
  if (raw.endsWith(".skr")) raw = raw.slice(0, -4);
  if (raw.startsWith(".")) raw = raw.slice(1);
  return idx.bySubdomain.get(raw) || null;
}

export async function getDomainsByOwner(wallet: string): Promise<DomainRecord[]> {
  const idx = await ensureIndex();
  return idx.byOwner.get(wallet) || [];
}

export async function getOwnerToShortestSubdomain(): Promise<Map<string, string>> {
  const idx = await ensureIndex();
  const m = new Map<string, string>();
  for (const [owner, list] of idx.byOwner) {
    if (list[0]) m.set(owner, list[0].subdomain);
  }
  return m;
}

export async function domainStats() {
  const idx = await ensureIndex();
  return {
    total: idx.rows.length,
    domainsByDate: idx.domainsByDate,
    domainsByTimeRange: idx.domainsByTimeRange,
    loadedAt: idx.loadedAt,
  };
}
