import { NextRequest, NextResponse } from "next/server";
import { getDomainByName } from "app/(utils)/lib/domainStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/domain { domain: "name.skr" | "name" } */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { domain?: string };
    const raw = (body.domain || "").trim();
    if (!raw) {
      return NextResponse.json({ message: "Invalid domain" }, { status: 400 });
    }
    const row = await getDomainByName(raw);
    if (!row) {
      return NextResponse.json({ message: "Domain not found" }, { status: 404 });
    }
    return NextResponse.json({
      owner: row.owner,
      createdAt: row.created_at,
      expiresAt: "",
      nonTransferable: false,
      domainNA: "",
      domainTLD: "",
      subDomainNA: "",
      subDomainTLD: "",
      rank: row.rank,
      domain: row.domain,
      subdomain: row.subdomain,
    });
  } catch (e) {
    console.error("POST /api/domain", e);
    return NextResponse.json({ message: "Lookup failed" }, { status: 500 });
  }
}
