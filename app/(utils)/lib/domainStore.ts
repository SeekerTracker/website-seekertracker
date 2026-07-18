/**
 * Domain index: Turso-first, snapshot fallback.
 * Turso is the source of truth after seed + on-chain indexer.
 */
import type { DomainInfo } from "../constantTypes";
import {
  ensureDomainSchema,
  getTurso,
  hasTurso,
  rowToDomainInfo,
  type SeekerDomainRow,
} from "./turso";

export type DomainRecord = {
  rank: number;
  domain: string;
  subdomain: string;
  owner: string;
  created_at: string;
  name_account?: string | null;
  tld_account?: string | null;
  subdomain_tx?: string | null;
  subdomain_tx_blocktime?: string | null;
  non_transferable?: number | boolean;
};

type Index = {
  rows: DomainRecord[];
  bySubdomain: Map<string, DomainRecord>;
  byOwner: Map<string, DomainRecord[]>;
  domainsByDate: Record<string, number>;
  domainsByTimeRange: Record<string, number>;
  loadedAt: number;
  source: "turso" | "snapshot";
};

let index: Index | null = null;
let loading: Promise<Index> | null = null;
const CACHE_TTL_MS = 60_000; // refresh in-memory view periodically

const SNAPSHOT_REL = "data/seeker-domains.jsonl.gz";

function hourBuckets(created_at: string, hourCounts: number[]) {
  if (created_at.length >= 13) {
    const h = parseInt(created_at.slice(11, 13), 10);
    if (h >= 0 && h < 24) hourCounts[h]++;
  }
}

function buildIndexFromRows(
  rows: DomainRecord[],
  source: "turso" | "snapshot"
): Index {
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
    hourBuckets(r.created_at, hourCounts);
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
    source,
  };
}

async function loadFromTurso(): Promise<Index | null> {
  if (!hasTurso()) return null;
  try {
    const db = getTurso();
    await ensureDomainSchema(db);
    const countRes = await db.execute("SELECT COUNT(*) AS c FROM seeker_domains");
    const count = Number(countRes.rows[0]?.c ?? 0);
    if (count === 0) return null;

    // Stream in pages to avoid giant single payload timeouts
    const rows: DomainRecord[] = [];
    const PAGE = 5000;
    let offset = 0;
    while (offset < count) {
      const res = await db.execute({
        sql: `SELECT rank, domain, subdomain, owner, created_at,
                     name_account, tld_account, subdomain_tx, subdomain_tx_blocktime, non_transferable
              FROM seeker_domains
              ORDER BY rank ASC
              LIMIT ? OFFSET ?`,
        args: [PAGE, offset],
      });
      for (const r of res.rows) {
        rows.push({
          rank: Number(r.rank),
          domain: String(r.domain || ".skr"),
          subdomain: String(r.subdomain),
          owner: String(r.owner),
          created_at: String(r.created_at),
          name_account: r.name_account != null ? String(r.name_account) : null,
          tld_account: r.tld_account != null ? String(r.tld_account) : null,
          subdomain_tx: r.subdomain_tx != null ? String(r.subdomain_tx) : null,
          subdomain_tx_blocktime:
            r.subdomain_tx_blocktime != null
              ? String(r.subdomain_tx_blocktime)
              : null,
          non_transferable: Number(r.non_transferable || 0),
        });
      }
      if (res.rows.length < PAGE) break;
      offset += PAGE;
    }
    console.log(`Domain index from Turso: ${rows.length} rows`);
    return buildIndexFromRows(rows, "turso");
  } catch (e) {
    console.error("Turso domain load failed", e);
    return null;
  }
}

async function readSnapshotBytes(): Promise<Uint8Array> {
  try {
    const { readFileSync, existsSync } = await import("fs");
    const { join } = await import("path");
    for (const p of [
      join(process.cwd(), "data", "seeker-domains.jsonl.gz"),
      join(process.cwd(), "public", "data", "seeker-domains.jsonl.gz"),
    ]) {
      if (existsSync(p)) return new Uint8Array(readFileSync(p));
    }
  } catch {
    /* */
  }
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.CF_PAGES_URL ||
    "https://seekertracker.com";
  const res = await fetch(`${base.replace(/\/$/, "")}/${SNAPSHOT_REL}`);
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  try {
    const { gunzipSync } = await import("zlib");
    return gunzipSync(Buffer.from(bytes)).toString("utf8");
  } catch {
    /* */
  }
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([bytes.buffer as ArrayBuffer]).stream().pipeThrough(ds);
  return await new Response(stream).text();
}

async function loadFromSnapshot(): Promise<Index> {
  const bytes = await readSnapshotBytes();
  const text = await gunzip(bytes);
  const rows: DomainRecord[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line) as DomainRecord);
    } catch {
      /* */
    }
  }
  console.log(`Domain index from snapshot: ${rows.length} rows`);
  return buildIndexFromRows(rows, "snapshot");
}

export async function ensureIndex(force = false): Promise<Index> {
  if (
    !force &&
    index &&
    Date.now() - index.loadedAt < CACHE_TTL_MS
  ) {
    return index;
  }
  if (!force && loading) return loading;

  loading = (async () => {
    try {
      const fromTurso = await loadFromTurso();
      index = fromTurso || (await loadFromSnapshot());
      return index;
    } catch (e) {
      console.error("Domain index load failed", e);
      index = buildIndexFromRows([], "snapshot");
      return index;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Invalidate in-memory cache (after indexer writes) */
export function invalidateDomainCache() {
  index = null;
}

export function recordToDomainInfo(r: DomainRecord): DomainInfo {
  return {
    domain: r.domain || ".skr",
    subdomain: r.subdomain,
    created_at: r.created_at,
    subdomain_tx: r.subdomain_tx || "",
    subdomain_tx_blocktime: r.subdomain_tx_blocktime || r.created_at,
    name_account: r.name_account || "",
    tld_account: r.tld_account || "",
    owner: r.owner,
    rank: r.rank,
    non_transferable: Boolean(r.non_transferable),
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
  // Prefer direct Turso SQL for filtered queries when available (avoids loading 100k into isolate memory)
  if (hasTurso()) {
    try {
      const sqlResult = await listDomainsFromTurso(params);
      if (sqlResult) return sqlResult;
    } catch (e) {
      console.error("Turso list failed, falling back to index", e);
    }
  }

  const idx = await ensureIndex();
  return listFromIndex(idx, params);
}

async function listDomainsFromTurso(params: ListParams) {
  const db = getTurso();
  await ensureDomainSchema(db);
  const countCheck = await db.execute("SELECT COUNT(*) AS c FROM seeker_domains");
  if (Number(countCheck.rows[0]?.c ?? 0) === 0) return null;

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200_000, Math.max(1, params.pageSize ?? 50));
  const sortBy = params.sortBy ?? "newest";
  const query = (params.query || "").trim().toLowerCase();
  const rank = params.rank;
  const before = params.beforeTimestamp;

  const where: string[] = [];
  const args: (string | number)[] = [];
  if (query) {
    where.push("LOWER(subdomain) LIKE ?");
    args.push(`%${query}%`);
  }
  if (rank != null && Number.isFinite(rank) && rank > 0) {
    where.push("rank = ?");
    args.push(rank);
  }
  if (before) {
    where.push("created_at <= ?");
    args.push(before);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  let order = "ORDER BY created_at DESC, rank DESC";
  if (sortBy === "oldest") order = "ORDER BY created_at ASC, rank ASC";
  if (sortBy === "name") order = "ORDER BY subdomain ASC";
  if (sortBy === "name-reverse") order = "ORDER BY subdomain DESC";
  if (sortBy === "length") order = "ORDER BY LENGTH(subdomain) ASC, subdomain ASC";

  const totalRes = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM seeker_domains ${whereSql}`,
    args,
  });
  const total = Number(totalRes.rows[0]?.c ?? 0);
  const offset = (page - 1) * pageSize;

  const listRes = await db.execute({
    sql: `SELECT rank, domain, subdomain, owner, created_at,
                 name_account, tld_account, subdomain_tx, subdomain_tx_blocktime, non_transferable
          FROM seeker_domains ${whereSql} ${order}
          LIMIT ? OFFSET ?`,
    args: [...args, pageSize, offset],
  });

  // Aggregates (global)
  const byDateRes = await db.execute(
    `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS c
     FROM seeker_domains GROUP BY day`
  );
  const domainsByDate: Record<string, number> = {};
  for (const r of byDateRes.rows) {
    domainsByDate[String(r.day)] = Number(r.c);
  }
  const byHourRes = await db.execute(
    `SELECT CAST(substr(created_at, 12, 2) AS INTEGER) AS hour, COUNT(*) AS c
     FROM seeker_domains WHERE length(created_at) >= 13 GROUP BY hour`
  );
  const hourCounts = new Array(24).fill(0);
  for (const r of byHourRes.rows) {
    const h = Number(r.hour);
    if (h >= 0 && h < 24) hourCounts[h] = Number(r.c);
  }
  const sum = (a: number, b: number) =>
    hourCounts.slice(a, b).reduce((s, n) => s + n, 0);

  // COUNT = rows we have; MAX(rank) = activation sequence users see on cards.
  // Prefer the higher as "Total Seeker IDs" so homepage stats match rank badges.
  const totalAll = await db.execute(
    "SELECT COUNT(*) AS c, COALESCE(MAX(rank), 0) AS max_rank FROM seeker_domains"
  );
  const indexedCount = Number(totalAll.rows[0]?.c ?? 0);
  const maxRank = Number(totalAll.rows[0]?.max_rank ?? 0);
  const totalDomains = Math.max(indexedCount, maxRank);

  return {
    success: true as const,
    message: "Fetched domains successfully",
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    totalDomains,
    indexedCount,
    maxRank,
    matchCount: total,
    domainsByDate,
    domainsByTimeRange: {
      "0-6": sum(0, 6),
      "6-12": sum(6, 12),
      "12-18": sum(12, 18),
      "18-24": sum(18, 24),
    },
    data: (listRes.rows as unknown as SeekerDomainRow[]).map(rowToDomainInfo),
    source: "turso" as const,
  };
}

function listFromIndex(idx: Index, params: ListParams) {
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
    default:
      sorted.sort(
        (a, b) => b.created_at.localeCompare(a.created_at) || b.rank - a.rank
      );
  }

  const total = sorted.length;
  const offset = (page - 1) * pageSize;
  const indexedCount = idx.rows.length;
  const maxRank = idx.rows.reduce((m, r) => (r.rank > m ? r.rank : m), 0);
  const totalDomains = Math.max(indexedCount, maxRank);
  return {
    success: true as const,
    message: "Fetched domains successfully",
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    totalDomains,
    indexedCount,
    maxRank,
    matchCount: total,
    domainsByDate: idx.domainsByDate,
    domainsByTimeRange: idx.domainsByTimeRange,
    data: sorted.slice(offset, offset + pageSize).map(recordToDomainInfo),
    source: idx.source,
  };
}

export async function getDomainByName(name: string): Promise<DomainRecord | null> {
  let raw = name.trim().toLowerCase();
  if (raw.endsWith(".skr")) raw = raw.slice(0, -4);
  if (raw.startsWith(".")) raw = raw.slice(1);

  if (hasTurso()) {
    try {
      const db = getTurso();
      const res = await db.execute({
        sql: `SELECT rank, domain, subdomain, owner, created_at,
                     name_account, tld_account, subdomain_tx, subdomain_tx_blocktime, non_transferable
              FROM seeker_domains WHERE LOWER(subdomain) = ? LIMIT 1`,
        args: [raw],
      });
      if (res.rows[0]) {
        const r = res.rows[0];
        return {
          rank: Number(r.rank),
          domain: String(r.domain || ".skr"),
          subdomain: String(r.subdomain),
          owner: String(r.owner),
          created_at: String(r.created_at),
          name_account: r.name_account != null ? String(r.name_account) : null,
          tld_account: r.tld_account != null ? String(r.tld_account) : null,
          subdomain_tx: r.subdomain_tx != null ? String(r.subdomain_tx) : null,
          subdomain_tx_blocktime:
            r.subdomain_tx_blocktime != null
              ? String(r.subdomain_tx_blocktime)
              : null,
          non_transferable: Number(r.non_transferable || 0),
        };
      }
      return null;
    } catch {
      /* fall through */
    }
  }
  const idx = await ensureIndex();
  return idx.bySubdomain.get(raw) || null;
}

export async function getDomainsByOwner(wallet: string): Promise<DomainRecord[]> {
  if (hasTurso()) {
    try {
      const db = getTurso();
      const res = await db.execute({
        sql: `SELECT rank, domain, subdomain, owner, created_at,
                     name_account, tld_account, subdomain_tx, subdomain_tx_blocktime, non_transferable
              FROM seeker_domains WHERE owner = ?
              ORDER BY LENGTH(subdomain) ASC`,
        args: [wallet],
      });
      return res.rows.map((r) => ({
        rank: Number(r.rank),
        domain: String(r.domain || ".skr"),
        subdomain: String(r.subdomain),
        owner: String(r.owner),
        created_at: String(r.created_at),
        name_account: r.name_account != null ? String(r.name_account) : null,
        tld_account: r.tld_account != null ? String(r.tld_account) : null,
        subdomain_tx: r.subdomain_tx != null ? String(r.subdomain_tx) : null,
        subdomain_tx_blocktime:
          r.subdomain_tx_blocktime != null
            ? String(r.subdomain_tx_blocktime)
            : null,
        non_transferable: Number(r.non_transferable || 0),
      }));
    } catch {
      /* fall through */
    }
  }
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
  if (hasTurso()) {
    try {
      const db = getTurso();
      const totalRes = await db.execute(
        "SELECT COUNT(*) AS c, COALESCE(MAX(rank), 0) AS max_rank FROM seeker_domains"
      );
      const indexed = Number(totalRes.rows[0]?.c ?? 0);
      const maxRank = Number(totalRes.rows[0]?.max_rank ?? 0);
      const total = Math.max(indexed, maxRank);
      if (total > 0) {
        const byDateRes = await db.execute(
          `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS c
           FROM seeker_domains GROUP BY day`
        );
        const domainsByDate: Record<string, number> = {};
        for (const r of byDateRes.rows) {
          domainsByDate[String(r.day)] = Number(r.c);
        }
        const byHourRes = await db.execute(
          `SELECT CAST(substr(created_at, 12, 2) AS INTEGER) AS hour, COUNT(*) AS c
           FROM seeker_domains WHERE length(created_at) >= 13 GROUP BY hour`
        );
        const hourCounts = new Array(24).fill(0);
        for (const r of byHourRes.rows) {
          const h = Number(r.hour);
          if (h >= 0 && h < 24) hourCounts[h] = Number(r.c);
        }
        const sum = (a: number, b: number) =>
          hourCounts.slice(a, b).reduce((s, n) => s + n, 0);
        return {
          total,
          domainsByDate,
          domainsByTimeRange: {
            "0-6": sum(0, 6),
            "6-12": sum(6, 12),
            "12-18": sum(12, 18),
            "18-24": sum(18, 24),
          },
          loadedAt: Date.now(),
          source: "turso" as const,
        };
      }
    } catch {
      /* fall through */
    }
  }
  const idx = await ensureIndex();
  const maxRank = idx.rows.reduce((m, r) => (r.rank > m ? r.rank : m), 0);
  return {
    total: Math.max(idx.rows.length, maxRank),
    domainsByDate: idx.domainsByDate,
    domainsByTimeRange: idx.domainsByTimeRange,
    loadedAt: idx.loadedAt,
    source: idx.source,
  };
}
