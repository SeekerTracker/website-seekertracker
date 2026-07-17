import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getTurso(): Client {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not configured");
  }
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export function hasTurso(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

/** Domain row as stored in Turso / returned by list APIs */
export type SeekerDomainRow = {
  rank: number;
  domain: string;
  subdomain: string;
  owner: string;
  created_at: string;
  name_account: string | null;
  tld_account: string | null;
  subdomain_tx: string | null;
  subdomain_tx_blocktime: string | null;
  non_transferable: number;
};

export async function ensureDomainSchema(db: Client = getTurso()) {
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

export function rowToDomainInfo(row: SeekerDomainRow) {
  return {
    domain: row.domain || ".skr",
    subdomain: row.subdomain,
    created_at: row.created_at,
    subdomain_tx: row.subdomain_tx || "",
    subdomain_tx_blocktime: row.subdomain_tx_blocktime || row.created_at,
    name_account: row.name_account || "",
    tld_account: row.tld_account || "",
    owner: row.owner,
    rank: Number(row.rank),
    non_transferable: Boolean(row.non_transferable),
  };
}
