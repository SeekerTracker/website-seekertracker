import { NextRequest, NextResponse } from "next/server";
import { getDomainByName } from "app/(utils)/lib/domainStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function domainPayload(row: {
  owner: string;
  created_at: string;
  rank: number;
  domain: string;
  subdomain: string;
}) {
  return {
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
  };
}

async function lookupDomain(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return NextResponse.json({ message: "Invalid domain" }, { status: 400 });
  }
  const row = await getDomainByName(trimmed);
  if (!row) {
    return NextResponse.json({ message: "Domain not found" }, { status: 404 });
  }
  return NextResponse.json(domainPayload(row));
}

/** GET /api/domain?domain=name.skr — preferred for agents */
export async function GET(request: NextRequest) {
  try {
    const domain = request.nextUrl.searchParams.get("domain") || "";
    return await lookupDomain(domain);
  } catch (e) {
    console.error("GET /api/domain", e);
    return NextResponse.json({ message: "Lookup failed" }, { status: 500 });
  }
}

/** POST /api/domain { domain: "name.skr" | "name" } — legacy body form */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { domain?: string };
    return await lookupDomain(body.domain || "");
  } catch (e) {
    console.error("POST /api/domain", e);
    return NextResponse.json({ message: "Lookup failed" }, { status: 500 });
  }
}
