import { NextRequest, NextResponse } from "next/server";
import {
  createClaimToken,
  emailCanClaimDapp,
  getDappRow,
  hasTurso,
  searchDappsForClaim,
} from "app/(utils)/lib/dappStore";
import {
  resendConfigured,
  sendEmail,
  SITE_URL,
} from "app/(utils)/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST { androidPackage, email } — send magic link if email matches listing.
 * GET  ?q= — search packages for claim UI (no emails exposed).
 *
 * Security: never reveal whether the email matched; always return generic OK
 * when package exists (unless clearly invalid input).
 */
export async function GET(request: NextRequest) {
  if (!hasTurso()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }
  if (q.length > 80) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }
  const results = await searchDappsForClaim(q);
  return NextResponse.json({ results });
}

export async function POST(request: NextRequest) {
  if (!hasTurso()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
  if (!resendConfigured()) {
    return NextResponse.json(
      { error: "Email not configured" },
      { status: 503 }
    );
  }

  let body: { androidPackage?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pkg = (body.androidPackage || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  if (!pkg || pkg.length > 200) {
    return NextResponse.json({ error: "Package required" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const row = await getDappRow(pkg);
  // Always same response timing path — generic success to avoid email enumeration
  const generic = {
    ok: true,
    message:
      "If that email is listed as support contact for this app, a magic link is on its way. Check spam too.",
  };

  if (!row) {
    return NextResponse.json(generic);
  }

  if (!emailCanClaimDapp(row, email)) {
    return NextResponse.json(generic);
  }

  try {
    const { token } = await createClaimToken(pkg, email);
    const name =
      row.display_name != null ? String(row.display_name) : pkg;
    const link = `${SITE_URL.replace(/\/$/, "")}/apps/manage?token=${encodeURIComponent(token)}`;

    await sendEmail({
      to: email,
      subject: `Maintain ${name} on Seeker Tracker`,
      tags: [
        { name: "category", value: "dapp_claim" },
        { name: "package", value: pkg.slice(0, 48) },
      ],
      html: claimEmailHtml({ name, pkg, link }),
      text: `Maintain ${name} (${pkg}) on Seeker Tracker.\n\nOpen this link within 30 minutes:\n${link}\n\nIf you did not request this, ignore this email.`,
    });
  } catch (e) {
    console.error("[dapps/claim]", e);
    return NextResponse.json(
      { error: "Could not send email. Try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json(generic);
}

function claimEmailHtml(opts: { name: string; pkg: string; link: string }) {
  const { name, pkg, link } = opts;
  return `<!DOCTYPE html>
<html><body style="margin:0;background:#000;color:#ededed;font-family:ui-monospace,Menlo,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#003333,#001a1a,#000);padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#0a2a2a;border:1px solid rgba(0,255,217,0.28);border-radius:12px;padding:28px;">
        <tr><td>
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#00ffd9;margin-bottom:12px;">Seeker Tracker</div>
          <h1 style="margin:0 0 12px;font-size:20px;color:#fff;">Maintain your listing</h1>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#c5e0e0;">
            Confirm you manage <strong style="color:#00ffd9;">${escapeHtml(name)}</strong>
            <span style="color:#7aa8a8;">(${escapeHtml(pkg)})</span> to update X, Telegram, website, and a short pitch on seekertracker.com.
          </p>
          <a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#00ffd9,#00e6c0);color:#001414;font-weight:700;font-size:13px;text-decoration:none;border-radius:8px;">
            Open manage link →
          </a>
          <p style="margin:20px 0 0;font-size:11px;color:#5f8585;line-height:1.5;">
            Link expires in 30 minutes. Store catalog data still syncs from Solana Mobile — you only control Seeker Tracker extras.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
