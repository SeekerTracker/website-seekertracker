import { NextRequest, NextResponse } from "next/server";
import {
  getContact,
  resendConfigured,
  setContactUnsubscribed,
} from "app/(utils)/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseEmail(raw: string | null): string | null {
  if (!raw) return null;
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (email.length > 254) return null;
  return email;
}

/**
 * One-click unsubscribe (RFC 8058) + preference API.
 *
 * GET  ?email=   → status for the UI
 * POST           → body: email=…  or form List-Unsubscribe=One-Click
 *                  blank 200/202 for mail-client one-click
 */
export async function GET(request: NextRequest) {
  if (!resendConfigured()) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 }
    );
  }
  const email = parseEmail(request.nextUrl.searchParams.get("email"));
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  const contact = await getContact(email);
  return NextResponse.json({
    email,
    unsubscribed: Boolean(
      contact && (contact as { unsubscribed?: boolean }).unsubscribed
    ),
    found: Boolean(contact),
  });
}

export async function POST(request: NextRequest) {
  if (!resendConfigured()) {
    // Still return 202 for one-click clients so clients don't retry forever
    return new NextResponse(null, { status: 202 });
  }

  let email: string | null = null;
  let resubscribe = false;

  const ct = request.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const body = (await request.json()) as {
        email?: string;
        unsubscribed?: boolean;
      };
      email = parseEmail(body.email ?? null);
      if (body.unsubscribed === false) resubscribe = true;
    } else {
      const form = await request.formData();
      email = parseEmail(
        (form.get("email") as string) ||
          (form.get("List-Unsubscribe") as string) ||
          null
      );
      // RFC 8058 mail clients POST List-Unsubscribe=One-Click with no email —
      // we cannot process without an email; still 202.
    }
  } catch {
    email = parseEmail(request.nextUrl.searchParams.get("email"));
  }

  if (!email) {
    email = parseEmail(request.nextUrl.searchParams.get("email"));
  }

  if (!email) {
    return new NextResponse(null, { status: 202 });
  }

  try {
    await setContactUnsubscribed(email, !resubscribe);
  } catch (e) {
    console.error("[unsubscribe]", e);
    // Prefer silent success for one-click UX; UI can poll GET
  }

  // Mail clients expect empty body + 200/202
  if (ct.includes("application/json")) {
    return NextResponse.json({
      ok: true,
      email,
      unsubscribed: !resubscribe,
    });
  }
  return new NextResponse(null, { status: 202 });
}
