import { NextRequest, NextResponse } from "next/server";
import {
  ensureDomainSchema,
  getTurso,
  hasTurso,
} from "app/(utils)/lib/turso";
import { LEGACY_DOMAIN_API } from "app/(utils)/constant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Incremental sync from legacy charity API → Turso.
 * Pulls newest pages until we hit ranks already in DB (or max pages).
 *
 * Auth: Authorization: Bearer $CRON_SECRET (optional if unset)
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!hasTurso()) {
    return NextResponse.json({ error: "no turso" }, { status: 503 });
  }

  const db = getTurso();
  await ensureDomainSchema(db);

  const maxRankRes = await db.execute(
    "SELECT COALESCE(MAX(rank), 0) AS m FROM seeker_domains"
  );
  const maxRank = Number(maxRankRes.rows[0]?.m ?? 0);

  const pageSize = 500;
  let page = 1;
  let upserted = 0;
  let pages = 0;
  const maxPages = 20; // ~10k newest per run

  while (pages < maxPages) {
    const res = await fetch(`${LEGACY_DOMAIN_API}/allDomains`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageSize,
        page,
        // Prefer newest-first if API supports it; otherwise page 1 is rank order
      }),
      cache: "no-store",
    });
    if (!res.ok) break;
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || !json.data.length) break;

    const rows = json.data as Array<{
      rank: string | number;
      domain?: string;
      subdomain: string;
      owner: string;
      created_at: string;
    }>;

    // If API returns rank-ascending, skip rows we already have
    const newRows = rows.filter((d) => Number(d.rank) > maxRank);
    if (!newRows.length && page === 1 && Number(rows[0]?.rank) <= maxRank) {
      // Full set already imported and no higher ranks — try reverse: page from end
      // For rank-ordered APIs, new domains have higher ranks at the end.
      // Fetch last page via totalPages.
      const totalPages = Number(json.pagination?.totalPages || 1);
      if (totalPages > 1 && page === 1) {
        page = Math.max(1, totalPages - maxPages + 1);
        continue;
      }
      break;
    }

    const batch = (newRows.length ? newRows : rows).map((d) => ({
      sql: `INSERT INTO seeker_domains
        (rank, domain, subdomain, owner, created_at, non_transferable)
        VALUES (?, ?, ?, ?, ?, 0)
        ON CONFLICT(rank) DO UPDATE SET
          subdomain=excluded.subdomain,
          owner=excluded.owner,
          created_at=excluded.created_at`,
      args: [
        Number(d.rank),
        d.domain || ".skr",
        d.subdomain,
        d.owner,
        d.created_at,
      ],
    }));
    await db.batch(batch, "write");
    upserted += batch.length;
    pages++;

    const highest = Math.max(...rows.map((d) => Number(d.rank)));
    if (highest <= maxRank && newRows.length === 0) break;
    page++;
  }

  const count = await db.execute("SELECT COUNT(*) AS c FROM seeker_domains");
  await db.execute({
    sql: `INSERT INTO seeker_domain_meta (key, value) VALUES ('last_sync_at', ?)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    args: [new Date().toISOString()],
  });

  return NextResponse.json({
    ok: true,
    previousMaxRank: maxRank,
    upserted,
    pages,
    total: Number(count.rows[0]?.c ?? 0),
  });
}
