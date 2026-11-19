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
 * GET /api/cron/index-domains?limit=200&backfill=80
 *
 * Incremental tip-following uses Solana `until` = last indexed signature.
 * We paginate with `before` until that cursor is actually reached, so a
 * burst larger than `limit` cannot skip a gap and then advance the cursor
 * to the tip (which previously left ~16k historical names unindexed).
 *
 * `backfill` walks older parent-NA signatures and INSERTs missing names
 * into unused rank slots. Existing rows are never updated or deleted.
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

/** Only these log verbs count as a brand-new activation (not secondary market / transfers). */
const NEW_ACTIVATION_LOG_RE =
  /(?:Buying|Registering|Claiming)\s+domain\s+([a-z0-9_-]+)\.skr/i;

/** Don't Telegram-alert domains whose on-chain created_at is older than this (hours). */
const MAX_ALERT_AGE_HOURS = 48;

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

type Sig = { signature: string; blockTime: number | null; err: unknown };

/**
 * Newest-first signatures until `untilSig` is reached (or no more history).
 * Paginates with `before` so we never skip a gap larger than one page.
 */
async function fetchSignaturesUntil(opts: {
  untilSig?: string;
  before?: string;
  max: number;
}): Promise<Sig[]> {
  const out: Sig[] = [];
  let before = opts.before;
  while (out.length < opts.max) {
    const pageLimit = Math.min(1000, opts.max - out.length);
    const batch = await rpc<Sig[]>("getSignaturesForAddress", [
      SKR_PARENT_NA,
      {
        limit: pageLimit,
        ...(before ? { before } : {}),
        ...(opts.untilSig ? { until: opts.untilSig } : {}),
      },
    ]);
    if (!batch?.length) break;
    out.push(...batch);
    if (batch.length < pageLimit) break;
    before = batch[batch.length - 1].signature;
  }
  return out;
}

async function nextUnusedRank(
  db: ReturnType<typeof getTurso>,
  createdAt: string
): Promise<number> {
  const lower = await db.execute({
    sql: `SELECT COALESCE(MAX(rank), 0) AS r FROM seeker_domains WHERE created_at <= ?`,
    args: [createdAt],
  });
  const lowerRank = Number(lower.rows[0]?.r ?? 0);
  const gap = await db.execute({
    sql: `SELECT MIN(rank) AS r FROM seeker_domains WHERE rank > ?`,
    args: [lowerRank],
  });
  const nextExisting = Number(gap.rows[0]?.r ?? 0);
  if (nextExisting && lowerRank + 1 < nextExisting) return lowerRank + 1;
  const after = await db.execute({
    sql: `SELECT r + 1 AS gap
          FROM (SELECT rank AS r FROM seeker_domains
                UNION ALL SELECT 0)
          WHERE r + 1 NOT IN (SELECT rank FROM seeker_domains)
          ORDER BY r ASC LIMIT 1`,
    args: [],
  });
  const found = Number(after.rows[0]?.gap ?? 0);
  if (found > 0) return found;
  const maxRes = await db.execute(
    "SELECT COALESCE(MAX(rank), 0) AS m FROM seeker_domains"
  );
  return Number(maxRes.rows[0]?.m ?? 0) + 1;
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
    1000,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 200))
  );
  const backfillLimit = Math.min(
    1000,
    Math.max(0, Number(request.nextUrl.searchParams.get("backfill") ?? 80))
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

  // Paginate tip → last_indexed_sig so bursts larger than one page are not skipped.
  const sigs = await fetchSignaturesUntil({ untilSig, max: limit });

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
      const activationNames = new Set<string>();
      for (const line of logs) {
        const m = line.match(DOMAIN_LOG_RE);
        if (m?.[1]) names.push(m[1].toLowerCase());
        const act = line.match(NEW_ACTIVATION_LOG_RE);
        if (act?.[1]) activationNames.add(act[1].toLowerCase());
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
        const createdMs = parsed.createdAt * 1000;
        const ageHours = (Date.now() - createdMs) / (1000 * 60 * 60);
        const isFreshActivation =
          activationNames.has(sub) && ageHours <= MAX_ALERT_AGE_HOURS;

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
          // Only TG-alert true new activations (not transfers / historical backfill)
          if (isFreshActivation) {
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

  const backfill = {
    scanned: 0,
    inserted: 0,
    skipped: 0,
    before: null as string | null,
  };
  if (backfillLimit > 0) {
    const cursorRes = await db.execute({
      sql: `SELECT value FROM seeker_domain_meta WHERE key = 'backfill_before'`,
      args: [],
    });
    const startBefore =
      (cursorRes.rows[0]?.value as string | undefined) ||
      untilSig ||
      newestSig ||
      undefined;
    const hist = await fetchSignaturesUntil({
      before: startBefore,
      max: backfillLimit,
    });
    backfill.scanned = hist.length;
    const seenBack = new Set<string>();
    for (const s of hist.filter((x) => !x.err).reverse()) {
      try {
        const tx = await rpc<{
          meta?: { logMessages?: string[]; err?: unknown };
          blockTime?: number;
        } | null>("getTransaction", [
          s.signature,
          { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
        ]);
        if (!tx || tx.meta?.err) {
          backfill.skipped++;
          continue;
        }
        const names: string[] = [];
        for (const line of tx.meta?.logMessages || []) {
          const m = line.match(DOMAIN_LOG_RE);
          if (m?.[1]) names.push(m[1].toLowerCase());
        }
        if (!names.length) {
          backfill.skipped++;
          continue;
        }
        for (const sub of names) {
          if (seenBack.has(sub)) continue;
          seenBack.add(sub);
          const existing = await db.execute({
            sql: `SELECT rank FROM seeker_domains WHERE LOWER(subdomain) = ? LIMIT 1`,
            args: [sub],
          });
          if (existing.rows.length) continue;

          const { subDomain_NA, subDomain_TLD } = getSubdomainPubkey(".skr", sub);
          const info = await conn.getAccountInfo(subDomain_NA);
          if (!info?.data) {
            backfill.skipped++;
            continue;
          }
          const parsed = deserializeNameAccount(Buffer.from(info.data));
          const created_at = new Date(parsed.createdAt * 1000).toISOString();
          const rank = await nextUnusedRank(db, created_at);
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
              s.signature,
              new Date((tx.blockTime || parsed.createdAt) * 1000).toISOString(),
              parsed.nonTransferable ? 1 : 0,
            ],
          });
          backfill.inserted++;
        }
      } catch (e) {
        console.error("backfill tx failed", s.signature, e);
        backfill.skipped++;
      }
    }
    if (hist.length) {
      backfill.before = hist[hist.length - 1].signature;
      await db.execute({
        sql: `INSERT INTO seeker_domain_meta (key, value) VALUES ('backfill_before', ?)
              ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
        args: [backfill.before],
      });
    }
  }

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
    backfill,
    telegram,
    telegramConfigured: telegramConfigured(),
  });
}
