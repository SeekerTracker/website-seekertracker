/**
 * Turso-backed Seeker dApp catalog.
 * Syncs from Solana Mobile GraphQL; marks packages missing from a sync as removed.
 */
import type { Client } from "@libsql/client";
import { getTurso, hasTurso } from "./turso";

export type DappStatus = "active" | "removed";

export type DappRow = {
  android_package: string;
  display_name: string | null;
  subtitle: string | null;
  description: string | null;
  icon_uri: string | null;
  publisher_name: string | null;
  publisher_website: string | null;
  support_email: string | null;
  // Curated contact fields (not synced from upstream; for project outreach)
  twitter: string | null;
  contact_email: string | null;
  rating: number | null;
  reviews_json: string | null;
  category_id: string | null;
  category_name: string | null;
  version: string | null;
  version_code: number | null;
  min_sdk: number | null;
  updated_on: string | null;
  privacy_policy_url: string | null;
  new_in_version: string | null;
  status: DappStatus;
  first_seen_at: string;
  last_seen_at: string;
  removed_at: string | null;
};

export async function ensureDappSchema(db: Client = getTurso()) {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS seeker_dapps (
        android_package TEXT PRIMARY KEY,
        display_name TEXT,
        subtitle TEXT,
        description TEXT,
        icon_uri TEXT,
        publisher_name TEXT,
        publisher_website TEXT,
        support_email TEXT,
        twitter TEXT,
        contact_email TEXT,
        rating REAL,
        reviews_json TEXT,
        category_id TEXT,
        category_name TEXT,
        version TEXT,
        version_code INTEGER,
        min_sdk INTEGER,
        updated_on TEXT,
        privacy_policy_url TEXT,
        new_in_version TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        removed_at TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_seeker_dapps_status ON seeker_dapps(status)`,
      `CREATE INDEX IF NOT EXISTS idx_seeker_dapps_category ON seeker_dapps(category_name)`,
      `CREATE INDEX IF NOT EXISTS idx_seeker_dapps_name ON seeker_dapps(display_name)`,
      `CREATE TABLE IF NOT EXISTS seeker_dapp_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
    ],
    "write"
  );

  // Migrate pre-existing tables: add curated contact columns if absent.
  // (CREATE TABLE IF NOT EXISTS above won't add columns to a table that
  // already exists, so back-fill via ALTER for the live DB.)
  const info = await db.execute(`PRAGMA table_info(seeker_dapps)`);
  const cols = new Set(
    info.rows.map((r) => String((r as Record<string, unknown>).name))
  );
  const migrations: string[] = [];
  if (!cols.has("twitter")) {
    migrations.push(`ALTER TABLE seeker_dapps ADD COLUMN twitter TEXT`);
  }
  if (!cols.has("contact_email")) {
    migrations.push(`ALTER TABLE seeker_dapps ADD COLUMN contact_email TEXT`);
  }
  if (migrations.length) {
    await db.batch(migrations, "write");
  }
}

export type UpstreamApp = {
  androidPackage: string;
  rating?: { rating?: number; reviewsByRating?: number[] };
  lastRelease?: {
    displayName?: string;
    subtitle?: string;
    description?: string;
    updatedOn?: string;
    newInVersion?: string;
    privacyPolicyUrl?: string;
    icon?: { uri?: string };
    publisherDetails?: {
      name?: string;
      website?: string;
      supportEmail?: string;
    };
    androidDetails?: {
      version?: string;
      versionCode?: number;
      minSdk?: number;
    };
  };
};

export type UpstreamCategory = {
  category: { id: string; name: string };
  dApps: { edges: Array<{ node: UpstreamApp }> };
};

/** Upsert live catalog; mark anything not seen this run as removed. */
export async function syncDappsFromCategories(
  categories: UpstreamCategory[],
  db: Client = getTurso()
): Promise<{ active: number; removed: number; upserted: number }> {
  await ensureDappSchema(db);
  const now = new Date().toISOString();
  const seen = new Set<string>();
  let upserted = 0;

  // Prefer first category appearance (stable primary category)
  for (const cat of categories) {
    for (const edge of cat.dApps.edges) {
      const app = edge.node;
      const pkg = app.androidPackage;
      if (!pkg || seen.has(pkg)) continue;
      seen.add(pkg);

      const release = app.lastRelease || {};
      const pub = release.publisherDetails || {};
      const android = release.androidDetails || {};
      const reviews = app.rating?.reviewsByRating || [];

      await db.execute({
        sql: `INSERT INTO seeker_dapps (
          android_package, display_name, subtitle, description, icon_uri,
          publisher_name, publisher_website, support_email,
          rating, reviews_json, category_id, category_name,
          version, version_code, min_sdk, updated_on,
          privacy_policy_url, new_in_version,
          status, first_seen_at, last_seen_at, removed_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?,
          'active', ?, ?, NULL
        )
        ON CONFLICT(android_package) DO UPDATE SET
          display_name = excluded.display_name,
          subtitle = excluded.subtitle,
          description = excluded.description,
          icon_uri = excluded.icon_uri,
          publisher_name = excluded.publisher_name,
          publisher_website = excluded.publisher_website,
          support_email = excluded.support_email,
          rating = excluded.rating,
          reviews_json = excluded.reviews_json,
          category_id = excluded.category_id,
          category_name = excluded.category_name,
          version = excluded.version,
          version_code = excluded.version_code,
          min_sdk = excluded.min_sdk,
          updated_on = excluded.updated_on,
          privacy_policy_url = excluded.privacy_policy_url,
          new_in_version = excluded.new_in_version,
          status = 'active',
          last_seen_at = excluded.last_seen_at,
          removed_at = NULL`,
        args: [
          pkg,
          release.displayName ?? null,
          release.subtitle ?? null,
          release.description ?? null,
          release.icon?.uri ?? null,
          pub.name ?? null,
          pub.website ?? null,
          pub.supportEmail ?? null,
          app.rating?.rating ?? null,
          JSON.stringify(reviews),
          cat.category.id,
          cat.category.name,
          android.version ?? null,
          android.versionCode ?? null,
          android.minSdk ?? null,
          release.updatedOn ?? null,
          release.privacyPolicyUrl ?? null,
          release.newInVersion ?? null,
          now,
          now,
        ],
      });
      upserted++;
    }
  }

  // Mark not-seen packages as removed
  let removed = 0;
  if (seen.size > 0) {
    const placeholders = [...seen].map(() => "?").join(",");
    const res = await db.execute({
      sql: `UPDATE seeker_dapps
            SET status = 'removed', removed_at = COALESCE(removed_at, ?)
            WHERE status = 'active' AND android_package NOT IN (${placeholders})`,
      args: [now, ...seen],
    });
    removed = res.rowsAffected ?? 0;
  }

  await db.execute({
    sql: `INSERT INTO seeker_dapp_meta (key, value) VALUES ('last_sync_at', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [now],
  });
  await db.execute({
    sql: `INSERT INTO seeker_dapp_meta (key, value) VALUES ('last_active_count', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [String(seen.size)],
  });

  return { active: seen.size, removed, upserted };
}

export async function dappCount(
  status: DappStatus | "all" = "active",
  db: Client = getTurso()
): Promise<number> {
  await ensureDappSchema(db);
  if (status === "all") {
    const r = await db.execute(`SELECT COUNT(*) AS c FROM seeker_dapps`);
    return Number(r.rows[0]?.c ?? 0);
  }
  const r = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM seeker_dapps WHERE status = ?`,
    args: [status],
  });
  return Number(r.rows[0]?.c ?? 0);
}

export async function getLastDappSync(
  db: Client = getTurso()
): Promise<string | null> {
  try {
    await ensureDappSchema(db);
    const r = await db.execute(
      `SELECT value FROM seeker_dapp_meta WHERE key = 'last_sync_at' LIMIT 1`
    );
    return r.rows[0]?.value != null ? String(r.rows[0].value) : null;
  } catch {
    return null;
  }
}

function rowToApiApp(row: Record<string, unknown>) {
  let reviews: number[] = [];
  try {
    reviews = JSON.parse(String(row.reviews_json || "[]"));
  } catch {
    reviews = [];
  }
  return {
    androidPackage: String(row.android_package),
    status: String(row.status || "active"),
    removedAt: row.removed_at != null ? String(row.removed_at) : null,
    rating:
      row.rating != null
        ? { rating: Number(row.rating), reviewsByRating: reviews }
        : null,
    lastRelease: {
      displayName: row.display_name != null ? String(row.display_name) : "",
      subtitle: row.subtitle != null ? String(row.subtitle) : "",
      description: row.description != null ? String(row.description) : "",
      updatedOn: row.updated_on != null ? String(row.updated_on) : "",
      newInVersion:
        row.new_in_version != null ? String(row.new_in_version) : "",
      privacyPolicyUrl:
        row.privacy_policy_url != null ? String(row.privacy_policy_url) : "",
      icon: row.icon_uri ? { uri: String(row.icon_uri) } : null,
      publisherDetails: {
        name: row.publisher_name != null ? String(row.publisher_name) : "",
        website:
          row.publisher_website != null ? String(row.publisher_website) : "",
        supportEmail:
          row.support_email != null ? String(row.support_email) : "",
        // Curated project X/Twitter (public); contact_email intentionally omitted
        twitter: row.twitter != null ? String(row.twitter) : "",
      },
      androidDetails: {
        version: row.version != null ? String(row.version) : "",
        versionCode:
          row.version_code != null ? Number(row.version_code) : null,
        minSdk: row.min_sdk != null ? Number(row.min_sdk) : null,
      },
    },
  };
}

/** Build explore-shaped response from Turso for the apps UI. */
export async function listDappsAsExplore(
  status: DappStatus | "all" = "active",
  db: Client = getTurso()
) {
  await ensureDappSchema(db);

  const where =
    status === "all" ? "" : "WHERE status = ?";
  const args = status === "all" ? [] : [status];

  const res = await db.execute({
    sql: `SELECT * FROM seeker_dapps ${where}
          ORDER BY category_name ASC, display_name ASC`,
    args,
  });

  type CatBucket = {
    category: { id: string; name: string };
    dApps: { edges: Array<{ node: ReturnType<typeof rowToApiApp> }> };
  };
  const map = new Map<string, CatBucket>();
  const seen = new Set<string>();

  for (const row of res.rows as unknown as Record<string, unknown>[]) {
    const pkg = String(row.android_package);
    if (seen.has(pkg)) continue;
    seen.add(pkg);

    const catName = String(row.category_name || "Other");
    const catId = String(row.category_id || catName);
    if (!map.has(catId)) {
      map.set(catId, {
        category: { id: catId, name: catName },
        dApps: { edges: [] },
      });
    }
    map.get(catId)!.dApps.edges.push({ node: rowToApiApp(row) });
  }

  // Removed bucket when filtering all — keep category structure
  if (status === "removed" && map.size === 0 && res.rows.length === 0) {
    /* empty */
  }

  const categories = Array.from(map.values());
  const activeCount = await dappCount("active", db);
  const removedCount = await dappCount("removed", db);

  return {
    data: {
      explore: {
        units: {
          edges: categories.map((cat) => ({
            node: { __typename: "DAppsByCategoryUnit", ...cat },
          })),
        },
      },
    },
    totalApps: seen.size,
    activeCount,
    removedCount,
    source: "turso" as const,
    lastSyncAt: await getLastDappSync(db),
  };
}

export async function getDappByPackage(
  androidPackage: string,
  db: Client = getTurso()
) {
  await ensureDappSchema(db);
  const res = await db.execute({
    sql: `SELECT * FROM seeker_dapps WHERE android_package = ? LIMIT 1`,
    args: [androidPackage],
  });
  const row = res.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToApiApp(row);
}

export { hasTurso };
