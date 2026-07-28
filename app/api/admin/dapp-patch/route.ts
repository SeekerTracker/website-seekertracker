import { NextRequest, NextResponse } from "next/server";
import {
  ensureDappSchema,
  getDappRow,
  hasTurso,
  sanitizeOwnerFields,
  updateOwnerFields,
} from "app/(utils)/lib/dappStore";
import { getTurso } from "app/(utils)/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Internal admin: PATCH owner curated fields without magic-link session.
 * Auth: Authorization: Bearer $ADMIN_PATCH_SECRET (or CRON_SECRET)
 *
 * Body: { androidPackage, twitter?, telegram?, blurb?, website_override?, contact_email?, displayName? }
 */
export async function PATCH(request: NextRequest) {
  const secret =
    process.env.ADMIN_PATCH_SECRET || process.env.CRON_SECRET || "";
  if (!secret) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasTurso()) {
    return NextResponse.json({ error: "Turso unavailable" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const androidPackage = String(body.androidPackage || "").trim();
  if (!androidPackage) {
    return NextResponse.json(
      { error: "androidPackage required" },
      { status: 400 }
    );
  }

  const db = getTurso();
  await ensureDappSchema(db);

  const existing = await getDappRow(androidPackage, db);
  const now = new Date().toISOString();
  if (!existing) {
    await db.execute({
      sql: `INSERT INTO seeker_dapps (
              android_package, display_name, status,
              claimed_at, claimed_email, first_seen_at, last_seen_at
            ) VALUES (?, ?, 'active', ?, ?, ?, ?)
            ON CONFLICT(android_package) DO NOTHING`,
      args: [
        androidPackage,
        String(body.displayName || androidPackage),
        now,
        "admin@patch",
        now,
        now,
      ],
    });
  }

  const fields = sanitizeOwnerFields({
    twitter: body.twitter as string | undefined,
    telegram: body.telegram as string | undefined,
    blurb: body.blurb as string | undefined,
    website_override: body.website_override as string | undefined,
    contact_email: body.contact_email as string | undefined,
  });

  const row = await getDappRow(androidPackage, db);
  const merged = {
    twitter:
      body.twitter !== undefined
        ? fields.twitter
        : row?.twitter != null
          ? String(row.twitter)
          : fields.twitter,
    telegram:
      body.telegram !== undefined
        ? fields.telegram
        : row?.telegram != null
          ? String(row.telegram)
          : fields.telegram,
    blurb:
      body.blurb !== undefined
        ? fields.blurb
        : row?.blurb != null
          ? String(row.blurb)
          : fields.blurb,
    website_override:
      body.website_override !== undefined
        ? fields.website_override
        : row?.website_override != null
          ? String(row.website_override)
          : fields.website_override,
    contact_email:
      body.contact_email !== undefined
        ? fields.contact_email
        : row?.contact_email != null
          ? String(row.contact_email)
          : fields.contact_email,
  };

  await updateOwnerFields(androidPackage, merged, db);
  await db.execute({
    sql: `UPDATE seeker_dapps SET claimed_at = COALESCE(claimed_at, ?), claimed_email = COALESCE(claimed_email, ?) WHERE android_package = ?`,
    args: [now, "admin@patch", androidPackage],
  });

  const after = await getDappRow(androidPackage, db);
  return NextResponse.json({
    ok: true,
    androidPackage,
    twitter: after?.twitter ?? null,
    telegram: after?.telegram ?? null,
    blurb: after?.blurb ?? null,
    website_override: after?.website_override ?? null,
    claimed_at: after?.claimed_at ?? null,
  });
}
