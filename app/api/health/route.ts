import { NextResponse } from "next/server";
import { domainStats } from "app/(utils)/lib/domainStore";
import { hasTurso } from "app/(utils)/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await domainStats();
    return NextResponse.json({
      status: stats.total > 0 ? "ok" : "empty",
      domains: stats.total,
      source: stats.source ?? (hasTurso() ? "turso" : "snapshot"),
      turso: hasTurso(),
      loadedAt: stats.loadedAt,
    });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
