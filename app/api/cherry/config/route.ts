import { NextResponse } from "next/server";
import { getCherryStatus } from "app/(utils)/lib/cherry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getCherryStatus();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status },
    );
  }
  return NextResponse.json(
    { ok: true, ...result.status },
    { headers: { "Cache-Control": "no-store" } },
  );
}
