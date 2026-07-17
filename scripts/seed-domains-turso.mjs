#!/usr/bin/env node
/**
 * Seed seeker_domains in Turso from data/seeker-domains.jsonl.gz
 * Requires TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (read-write).
 */
import { createClient } from "@libsql/client";
import { createGunzip } from "zlib";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SNAPSHOT = join(ROOT, "data", "seeker-domains.jsonl.gz");

const url = process.env.TURSO_DATABASE_URL || process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Need TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (RW)");
  process.exit(1);
}

const db = createClient({
  url: url.replace(/^https:/, "libsql:"),
  authToken,
});

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
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_seeker_domains_name ON seeker_domains(subdomain, domain)`,
      `CREATE INDEX IF NOT EXISTS idx_seeker_domains_owner ON seeker_domains(owner)`,
      `CREATE INDEX IF NOT EXISTS idx_seeker_domains_created ON seeker_domains(created_at)`,
      `CREATE TABLE IF NOT EXISTS seeker_domain_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
    ],
    "write"
  );
}

async function main() {
  await ensureSchema();
  const stream = createReadStream(SNAPSHOT).pipe(createGunzip());
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let batch = [];
  let total = 0;
  const BATCH = 200;

  async function flush() {
    if (!batch.length) return;
    const stmts = batch.map((d) => ({
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
    await db.batch(stmts, "write");
    total += batch.length;
    batch = [];
    if (total % 2000 === 0) console.log("seeded", total);
  }

  for await (const line of rl) {
    if (!line.trim()) continue;
    batch.push(JSON.parse(line));
    if (batch.length >= BATCH) await flush();
  }
  await flush();

  const count = await db.execute("SELECT COUNT(*) AS c FROM seeker_domains");
  const n = Number(count.rows[0].c);
  await db.execute({
    sql: `INSERT INTO seeker_domain_meta (key, value) VALUES ('seeded_at', ?)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    args: [new Date().toISOString()],
  });
  await db.execute({
    sql: `INSERT INTO seeker_domain_meta (key, value) VALUES ('total_domains', ?)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    args: [String(n)],
  });
  console.log("done. turso count=", n, "lines processed=", total);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
