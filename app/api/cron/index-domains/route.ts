import { NextRequest, NextResponse } from "next/server";
import { PublicKey, Connection } from "@solana/web3.js";
import { createHash } from "crypto";
import BN from "bn.js";
import {
  ensureDomainSchema,
  getTurso,
  hasTurso,
} from "app/(utils)/lib/turso";
import { invalidateDomainCache } from "app/(utils)/lib/domainStore";
import {
  notifyNewDomains,
  telegramConfigured,
  type NewDomainAlert,
} from "app/(utils)/lib/telegram";
import { CONN_RPC_URL } from "app/(utils)/constant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * On-chain indexer for new .skr SeekerIDs.
 *
 * Watches the .skr parent name account on ANS for recent txs, parses
 * "Buying domain X.skr" / transfer logs, resolves owner+createdAt on-chain,
 * and upserts into Turso.
 *
 * Auth: Authorization: Bearer $CRON_SECRET (if set)
 * GET /api/cron/index-domains?limit=50
 */

const ANS_PROGRAM_ID = new PublicKey(
  "ALTNSZ46uaAUU7XUV6awvdorLGqAsPwa9shm7h4uP2FK"
);
const TLD_HOUSE_PROGRAM_ID = new PublicKey(
  "TLDHkysf5pCnKsVA4gXpNvmy7psXLPEu4LAdDJthT9S"
);
const AD_HASH_PREFIX = "ALT Name Service";
/** Parent name account for TLD .skr */
const SKR_PARENT_NA = "F3A8kuikEiu6k2399oSJ1PWfcJYDHqpwoQ2e8psSDNuF";

function getHashedName(name: string): Buffer {
  return createHash("sha256").update(name).digest();
}

function getDomainPubkey(domain: string) {
  const grandHashed = getHashedName(AD_HASH_PREFIX + "ANS");
  const domainHashed = getHashedName(AD_HASH_PREFIX + domain);
  const grand = PublicKey.findProgramAddressSync(
    [grandHashed, Buffer.alloc(32), Buffer.alloc(32)],
    ANS_PROGRAM_ID
  )[0];
  const domain_NA = PublicKey.findProgramAddressSync(
    [domainHashed, Buffer.alloc(32), grand.toBuffer()],
    ANS_PROGRAM_ID
  )[0];
  const domain_TLD = PublicKey.findProgramAddressSync(
    [Buffer.from("tld_house"), Buffer.from(domain.toLowerCase())],
    TLD_HOUSE_PROGRAM_ID
  )[0];
  return { domain_NA, domain_TLD };
}

function getSubdomainPubkey(domain: string, sub: string) {
  const { domain_NA, domain_TLD } = getDomainPubkey(domain);
  const subHashed = getHashedName(AD_HASH_PREFIX + sub);
  const subDomain_NA = PublicKey.findProgramAddressSync(
    [subHashed, Buffer.alloc(32), domain_NA.toBuffer()],
    ANS_PROGRAM_ID
  )[0];
  const subDomain_TLD = PublicKey.findProgramAddressSync(
    [
      getHashedName(AD_HASH_PREFIX + subDomain_NA.toString()),
      domain_TLD.toBuffer(),
      Buffer.alloc(32),
    ],
    ANS_PROGRAM_ID
  )[0];
  return { subDomain_NA, subDomain_TLD };
}

function deserializeNameAccount(data: Buffer) {
  let offset = 0;
  const next = (n: number) => {
    const c = data.subarray(offset, offset + n);
    offset += n;
    return c;
  };
  next(8); // discriminator
  const na = new PublicKey(next(32));
  const owner = new PublicKey(next(32));
  next(32); // class
  const expiresAt = new BN(next(8), "le").toNumber();
  const createdAt = new BN(next(8), "le").toNumber();
  const nonTransferable = next(1)[0] === 1;
  return {
    na: na.toBase58(),
    owner: owner.toBase58(),
    expiresAt,
    createdAt,
    nonTransferable,
  };
}

const DOMAIN_LOG_RE =
  /(?:Buying|Transfering|Transferring|Registering|Claiming)\s+domain\s+([a-z0-9_-]+)\.skr/i;

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(CONN_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.result as T;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!hasTurso()) {
    return NextResponse.json({ error: "Turso not configured" }, { status: 503 });
  }

  const limit = Math.min(
    100,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 40))
  );

  const db = getTurso();
  await ensureDomainSchema(db);

  const maxRankRes = await db.execute(
    "SELECT COALESCE(MAX(rank), 0) AS m FROM seeker_domains"
  );
  let nextRank = Number(maxRankRes.rows[0]?.m ?? 0) + 1;

  const lastSigRes = await db.execute({
    sql: `SELECT value FROM seeker_domain_meta WHERE key = 'last_indexed_sig'`,
    args: [],
  });
  const untilSig =
    (lastSigRes.rows[0]?.value as string | undefined) || undefined;

  type Sig = { signature: string; blockTime: number | null; err: unknown };
  const sigs = await rpc<Sig[]>("getSignaturesForAddress", [
    SKR_PARENT_NA,
    { limit, ...(untilSig ? {} : {}) },
  ]);

  // Process oldest-first among this batch so ranks increase chronologically
  const batch = (sigs || []).filter((s) => !s.err).reverse();

  const conn = new Connection(CONN_RPC_URL, "confirmed");
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const seen = new Set<string>();
  const newDomains: NewDomainAlert[] = [];
  let newestSig: string | null = null;

  for (const s of batch) {
    if (!newestSig) newestSig = s.signature; // after reverse, last in original order...
    // actually after reverse oldest first; track highest (first in unreversed) later
  }
  if (sigs?.length) newestSig = sigs[0].signature;

  for (const s of batch) {
    try {
      const tx = await rpc<{
        meta?: { logMessages?: string[]; err?: unknown };
        blockTime?: number;
        transaction?: { signatures?: string[] };
      } | null>("getTransaction", [
        s.signature,
        { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
      ]);
      if (!tx || tx.meta?.err) {
        skipped++;
        continue;
      }
      const logs = tx.meta?.logMessages || [];
      const names: string[] = [];
      for (const line of logs) {
        const m = line.match(DOMAIN_LOG_RE);
        if (m?.[1]) names.push(m[1].toLowerCase());
      }
      if (!names.length) {
        skipped++;
        continue;
      }

      for (const sub of names) {
        if (seen.has(sub)) continue;
        seen.add(sub);

        const { subDomain_NA, subDomain_TLD } = getSubdomainPubkey(".skr", sub);
        const info = await conn.getAccountInfo(subDomain_NA);
        if (!info?.data) {
          skipped++;
          continue;
        }
        const parsed = deserializeNameAccount(Buffer.from(info.data));
        const created_at = new Date(parsed.createdAt * 1000).toISOString();

        const existing = await db.execute({
          sql: `SELECT rank FROM seeker_domains WHERE LOWER(subdomain) = ? LIMIT 1`,
          args: [sub],
        });

        if (existing.rows.length) {
          await db.execute({
            sql: `UPDATE seeker_domains SET
              owner = ?,
              created_at = ?,
              name_account = ?,
              tld_account = ?,
              subdomain_tx = ?,
              subdomain_tx_blocktime = ?,
              non_transferable = ?
              WHERE LOWER(subdomain) = ?`,
            args: [
              parsed.owner,
              created_at,
              subDomain_NA.toBase58(),
              subDomain_TLD.toBase58(),
              s.signature,
              new Date((tx.blockTime || parsed.createdAt) * 1000).toISOString(),
              parsed.nonTransferable ? 1 : 0,
              sub,
            ],
          });
          updated++;
        } else {
          const rank = nextRank++;
          const txSig = s.signature;
          await db.execute({
            sql: `INSERT INTO seeker_domains
              (rank, domain, subdomain, owner, created_at, name_account, tld_account,
               subdomain_tx, subdomain_tx_blocktime, non_transferable)
              VALUES (?, '.skr', ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              rank,
              sub,
              parsed.owner,
              created_at,
              subDomain_NA.toBase58(),
              subDomain_TLD.toBase58(),
              txSig,
              new Date((tx.blockTime || parsed.createdAt) * 1000).toISOString(),
              parsed.nonTransferable ? 1 : 0,
            ],
          });
          inserted++;
          newDomains.push({
            subdomain: sub,
            domain: ".skr",
            owner: parsed.owner,
            rank,
            created_at,
            subdomain_tx: txSig,
            name_account: subDomain_NA.toBase58(),
          });
        }
      }
    } catch (e) {
      console.error("index tx failed", s.signature, e);
      skipped++;
    }
  }

  if (newestSig) {
    await db.execute({
      sql: `INSERT INTO seeker_domain_meta (key, value) VALUES ('last_indexed_sig', ?)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      args: [newestSig],
    });
  }
  await db.execute({
    sql: `INSERT INTO seeker_domain_meta (key, value) VALUES ('last_indexed_at', ?)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    args: [new Date().toISOString()],
  });
  const countRes = await db.execute(
    "SELECT COUNT(*) AS c, COALESCE(MAX(rank), 0) AS max_rank FROM seeker_domains"
  );
  const indexed = Number(countRes.rows[0]?.c ?? 0);
  const maxRank = Number(countRes.rows[0]?.max_rank ?? 0);
  // Align with homepage: total = max(row count, max rank)
  const totalSeekerIds = Math.max(indexed, maxRank);
  await db.execute({
    sql: `INSERT INTO seeker_domain_meta (key, value) VALUES ('total_domains', ?)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    args: [String(totalSeekerIds)],
  });

  invalidateDomainCache();

  // Ping @Seeker_Tracker for each newly inserted domain
  let telegram: { sent: number; failed: number; errors: string[] } | null =
    null;
  if (newDomains.length && telegramConfigured()) {
    try {
      telegram = await notifyNewDomains(newDomains, {
        total: totalSeekerIds,
      });
    } catch (e) {
      telegram = {
        sent: 0,
        failed: newDomains.length,
        errors: [e instanceof Error ? e.message : String(e)],
      };
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: batch.length,
    inserted,
    updated,
    skipped,
    total: totalSeekerIds,
    indexed,
    maxRank,
    newestSig,
    telegram,
    telegramConfigured: telegramConfigured(),
  });
}
