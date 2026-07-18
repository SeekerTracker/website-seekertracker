import { NextRequest, NextResponse } from "next/server";
import {
  consumeClaimToken,
  getDappRow,
  getSession,
  hasTurso,
  sanitizeOwnerFields,
  updateOwnerFields,
} from "app/(utils)/lib/dappStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "st_dapp_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7d

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

  await updateOwnerFields(session.androidPackage, fields);
  const row = await getDappRow(session.androidPackage);
  return NextResponse.json({
    ok: true,
    listing: row ? listingPayload(row, session.email) : null,
  });
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
