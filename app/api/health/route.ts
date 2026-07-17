import { NextResponse } from "next/server";
import { domainStats } from "app/(utils)/lib/domainStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = domainStats();
    return NextResponse.json({
      status: stats.total > 0 ? "ok" : "empty",
      domains: stats.total,
      loadedAt: stats.loadedAt,
    });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
