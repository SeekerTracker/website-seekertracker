import { NextRequest, NextResponse } from "next/server";
import {
  consumeClaimToken,
  getDappRow,
  getSession,
  hasTurso,
  sanitizeOwnerFields,
  updateOwnerFields,
  type DappOwnerFields,
} from "app/(utils)/lib/dappStore";
import {
  resendConfigured,
  sendEmail,
  SITE_URL,
} from "app/(utils)/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "st_dapp_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7d

/** Notify inbox when a publisher saves the maintain-listing form */
const UPDATE_NOTIFY_TO =
  process.env.DAPP_UPDATE_NOTIFY_EMAIL || "seeker@milysec.com";

function sessionFromRequest(request: NextRequest): string | null {
  return (
    request.cookies.get(COOKIE)?.value ||
    request.headers.get("x-dapp-session") ||
    null
  );
}

function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * POST { token } — exchange magic-link token for session cookie + listing payload
 * GET — current session listing (for manage form)
 * PATCH { fields } — update owner curated fields
 * DELETE — clear session cookie
 */
export async function POST(request: NextRequest) {
  if (!hasTurso()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const token = (body.token || "").trim();
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const session = await consumeClaimToken(token);
  if (!session) {
    return NextResponse.json(
      { error: "Link invalid or expired. Request a new one." },
      { status: 401 }
    );
  }

  const row = await getDappRow(session.androidPackage);
  if (!row) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const res = NextResponse.json({
    ok: true,
    listing: listingPayload(row, session.email),
  });
  setSessionCookie(res, session.sessionToken);
  return res;
}

export async function GET(request: NextRequest) {
  if (!hasTurso()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
  const raw = sessionFromRequest(request);
  if (!raw) {
    return NextResponse.json({ authenticated: false });
  }
  const session = await getSession(raw);
  if (!session) {
    const res = NextResponse.json({ authenticated: false });
    res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }
  const row = await getDappRow(session.androidPackage);
  if (!row) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  return NextResponse.json({
    authenticated: true,
    listing: listingPayload(row, session.email),
  });
}

export async function PATCH(request: NextRequest) {
  if (!hasTurso()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
  const raw = sessionFromRequest(request);
  if (!raw) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const session = await getSession(raw);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fields = sanitizeOwnerFields({
    twitter: body.twitter as string | undefined,
    telegram: body.telegram as string | undefined,
    blurb: body.blurb as string | undefined,
    website_override: body.website_override as string | undefined,
    contact_email: body.contact_email as string | undefined,
  });

  const beforeRow = await getDappRow(session.androidPackage);
  if (!beforeRow) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const before = ownerSnapshot(beforeRow);
  await updateOwnerFields(session.androidPackage, fields);
  const row = await getDappRow(session.androidPackage);
  const after = fields;

  // Fire-and-forget notify — don't fail the save if mail is down
  void notifyListingUpdate({
    androidPackage: session.androidPackage,
    displayName:
      beforeRow.display_name != null
        ? String(beforeRow.display_name)
        : session.androidPackage,
    sessionEmail: session.email,
    before,
    after,
  }).catch((e) => console.error("[dapps/manage] notify failed", e));

  return NextResponse.json({
    ok: true,
    listing: row ? listingPayload(row, session.email) : null,
  });
}

function ownerSnapshot(row: Record<string, unknown>): DappOwnerFields {
  return {
    twitter: row.twitter != null ? String(row.twitter) : null,
    telegram: row.telegram != null ? String(row.telegram) : null,
    blurb: row.blurb != null ? String(row.blurb) : null,
    website_override:
      row.website_override != null ? String(row.website_override) : null,
    contact_email: row.contact_email != null ? String(row.contact_email) : null,
  };
}

function fmt(v: string | null | undefined): string {
  if (v == null || v === "") return "(empty)";
  return v;
}

async function notifyListingUpdate(opts: {
  androidPackage: string;
  displayName: string;
  sessionEmail: string;
  before: DappOwnerFields;
  after: DappOwnerFields;
}) {
  if (!resendConfigured()) {
    console.warn("[dapps/manage] RESEND_API_KEY missing — skip update notify");
    return;
  }

  const labels: { key: keyof DappOwnerFields; label: string }[] = [
    { key: "blurb", label: "Pitch" },
    { key: "twitter", label: "X / Twitter" },
    { key: "telegram", label: "Telegram" },
    { key: "website_override", label: "Website" },
    { key: "contact_email", label: "Contact email" },
  ];

  const changes = labels.filter(
    ({ key }) => (opts.before[key] || null) !== (opts.after[key] || null)
  );

  const when = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
  const catalogUrl = `${SITE_URL.replace(/\/$/, "")}/apps?app=${encodeURIComponent(opts.androidPackage)}`;
  const manageUrl = `${SITE_URL.replace(/\/$/, "")}/apps/manage`;

  const changeRows =
    changes.length === 0
      ? `<tr><td colspan="3" style="padding:10px;color:#6a9090;">No field values changed (re-save).</td></tr>`
      : changes
          .map(
            ({ key, label }) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #1a3333;color:#00ffd9;font-weight:600;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #1a3333;color:#8eb5b5;vertical-align:top;word-break:break-word;">${escapeHtml(fmt(opts.before[key]))}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #1a3333;color:#e8fffa;vertical-align:top;word-break:break-word;">${escapeHtml(fmt(opts.after[key]))}</td>
      </tr>`
          )
          .join("");

  const subject = `[Seeker Tracker] Listing updated: ${opts.displayName}`;

  const textLines = [
    `dApp listing update on Seeker Tracker`,
    ``,
    `App: ${opts.displayName}`,
    `Package: ${opts.androidPackage}`,
    `Saved by: ${opts.sessionEmail}`,
    `When: ${when}`,
    ``,
    changes.length
      ? `Changes:\n${changes
          .map(
            ({ key, label }) =>
              `- ${label}: ${fmt(opts.before[key])} → ${fmt(opts.after[key])}`
          )
          .join("\n")}`
      : `No field values changed (re-save).`,
    ``,
    `Catalog: ${catalogUrl}`,
    `Manage: ${manageUrl}`,
  ];

  const html = `<!DOCTYPE html>
<html><body style="margin:0;background:#000;color:#ededed;font-family:ui-monospace,Menlo,Consolas,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#003333,#001a1a,#000);padding:28px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#0a1f1f;border:1px solid rgba(0,255,217,0.28);border-radius:12px;overflow:hidden;">
        <tr><td style="padding:22px 24px 8px;">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#00ffd9;margin-bottom:10px;">Seeker Tracker · dApp update</div>
          <h1 style="margin:0 0 8px;font-size:18px;color:#fff;">${escapeHtml(opts.displayName)}</h1>
          <p style="margin:0;font-size:12px;color:#7aa8a8;line-height:1.5;">
            <code style="color:#c5e0e0;">${escapeHtml(opts.androidPackage)}</code><br/>
            Saved by <strong style="color:#e8fffa;">${escapeHtml(opts.sessionEmail)}</strong><br/>
            ${escapeHtml(when)}
          </p>
        </td></tr>
        <tr><td style="padding:12px 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(0,255,217,0.15);border-radius:8px;overflow:hidden;font-size:12px;">
            <tr style="background:rgba(0,255,217,0.08);">
              <th align="left" style="padding:8px 10px;color:#7aa8a8;font-weight:600;">Field</th>
              <th align="left" style="padding:8px 10px;color:#7aa8a8;font-weight:600;">Before</th>
              <th align="left" style="padding:8px 10px;color:#7aa8a8;font-weight:600;">After</th>
            </tr>
            ${changeRows}
          </table>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;">
            <a href="${escapeHtml(catalogUrl)}" style="color:#00ffd9;">View in catalog</a>
            &nbsp;·&nbsp;
            <a href="${escapeHtml(manageUrl)}" style="color:#7aa8a8;">Manage form</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await sendEmail({
    to: UPDATE_NOTIFY_TO,
    subject,
    html,
    text: textLines.join("\n"),
    replyTo: opts.sessionEmail,
    tags: [
      { name: "category", value: "dapp_listing_update" },
      {
        name: "android_package",
        value: opts.androidPackage.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 48),
      },
    ],
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

function listingPayload(row: Record<string, unknown>, email: string) {
  return {
    androidPackage: String(row.android_package),
    displayName:
      row.display_name != null
        ? String(row.display_name)
        : String(row.android_package),
    iconUri: row.icon_uri != null ? String(row.icon_uri) : null,
    publisherName:
      row.publisher_name != null ? String(row.publisher_name) : null,
    storeWebsite:
      row.publisher_website != null ? String(row.publisher_website) : null,
    supportEmail:
      row.support_email != null ? String(row.support_email) : null,
    status: String(row.status || "active"),
    claimedAt: row.claimed_at != null ? String(row.claimed_at) : null,
    sessionEmail: email,
    // editable
    twitter: row.twitter != null ? String(row.twitter) : "",
    telegram: row.telegram != null ? String(row.telegram) : "",
    blurb: row.blurb != null ? String(row.blurb) : "",
    website_override:
      row.website_override != null ? String(row.website_override) : "",
    contact_email:
      row.contact_email != null ? String(row.contact_email) : "",
  };
}
