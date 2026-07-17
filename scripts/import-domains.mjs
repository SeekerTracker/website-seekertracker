#!/usr/bin/env node
/**
 * Bulk-import .skr SeekerIDs from api.seeker.solana.charity into Turso.
 *
 * Usage (from website-seekertracker root):
 *   node --env-file=.env.local scripts/import-domains.mjs
 *   # or with env already exported:
 *   node scripts/import-domains.mjs
 *
 * Env: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
 * Optional: SOURCE_API (default https://api.seeker.solana.charity)
 * Optional: PAGE_SIZE (default 500), START_PAGE (default 1)
 */
import { createClient } from "@libsql/client";

const SOURCE = process.env.SOURCE_API || "https://api.seeker.solana.charity";
const PAGE_SIZE = Number(process.env.PAGE_SIZE || 500);
const START_PAGE = Number(process.env.START_PAGE || 1);

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN");
  process.exit(1);
}

const db = createClient({ url, authToken });

async function ensureSchema() {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS seeker_domains (
        rank INTEGER PRIMARY KEY,
        domain TEXT NOT NULL DEFAULT '.skr',
        subdomain TEXT NOT NULL,
        owner TEXT NOT NULL,
        created_at TEXT NOT NULL,
        name_account TEXT,
        tld_account TEXT,
        subdomain_tx TEXT,
        subdomain_tx_blocktime TEXT,
        non_transferable INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE INDEX IF NOT EXISTS idx_seeker_domains_owner ON seeker_domains(owner)`,
      `CREATE INDEX IF NOT EXISTS idx_seeker_domains_subdomain ON seeker_domains(subdomain)`,
      `CREATE INDEX IF NOT EXISTS idx_seeker_domains_created ON seeker_domains(created_at)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_seeker_domains_name ON seeker_domains(subdomain, domain)`,
      `CREATE TABLE IF NOT EXISTS seeker_domain_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
    ],
    "write"
  );
}

async function fetchPage(page) {
  const res = await fetch(`${SOURCE}/allDomains`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageSize: PAGE_SIZE, page }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on page ${page}`);
  }
  return res.json();
}

async function upsertBatch(rows) {
  if (!rows.length) return;
  // libsql batch of parameterized inserts
  const stmts = rows.map((d) => ({
    sql: `INSERT INTO seeker_domains
      (rank, domain, subdomain, owner, created_at, name_account, tld_account, subdomain_tx, subdomain_tx_blocktime, non_transferable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(rank) DO UPDATE SET
        domain=excluded.domain,
        subdomain=excluded.subdomain,
        owner=excluded.owner,
        created_at=excluded.created_at`,
    args: [
      Number(d.rank) || 0,
      d.domain || ".skr",
      d.subdomain,
      d.owner,
      d.created_at,
      d.name_account || null,
      d.tld_account || null,
      d.subdomain_tx || null,
      d.subdomain_tx_blocktime || null,
      d.non_transferable ? 1 : 0,
    ],
  }));
  await db.batch(stmts, "write");
}

async function main() {
  console.log("Ensuring schema…");
  await ensureSchema();

  console.log(`Fetching page ${START_PAGE}…`);
  const first = await fetchPage(START_PAGE);
  if (!first.success || !Array.isArray(first.data)) {
    console.error("Unexpected response", first);
    process.exit(1);
  }
  const total = first.pagination?.total ?? 0;
  const totalPages = first.pagination?.totalPages ?? Math.ceil(total / PAGE_SIZE);
  console.log(`Total domains: ${total}, pages: ${totalPages}, pageSize: ${PAGE_SIZE}`);

  let imported = 0;
  await upsertBatch(first.data);
  imported += first.data.length;
  console.log(`Page ${START_PAGE}/${totalPages}: +${first.data.length} (total ${imported})`);

  for (let page = START_PAGE + 1; page <= totalPages; page++) {
    let attempt = 0;
    // retry flaky pages
    while (true) {
      try {
        const data = await fetchPage(page);
        if (!data.success || !Array.isArray(data.data)) {
          throw new Error("bad payload");
        }
        await upsertBatch(data.data);
        imported += data.data.length;
        if (page % 10 === 0 || page === totalPages) {
          console.log(`Page ${page}/${totalPages}: total imported ~${imported}`);
        }
        break;
      } catch (e) {
        attempt++;
        if (attempt >= 5) {
          console.error(`Failed page ${page} after retries:`, e.message || e);
          process.exit(1);
        }
        const wait = attempt * 1500;
        console.warn(`Retry page ${page} in ${wait}ms (${e.message || e})`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }

  const count = await db.execute("SELECT COUNT(*) AS c FROM seeker_domains");
  const finalCount = count.rows[0].c;
  await db.execute({
    sql: `INSERT INTO seeker_domain_meta (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    args: ["last_import_at", new Date().toISOString()],
  });
  await db.execute({
    sql: `INSERT INTO seeker_domain_meta (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    args: ["total_domains", String(finalCount)],
  });
  console.log(`Done. Turso seeker_domains count = ${finalCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
