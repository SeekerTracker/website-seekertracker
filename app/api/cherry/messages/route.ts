import { NextResponse } from "next/server";
import { cherry } from "app/(utils)/lib/cherry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOM = /^[A-Za-z0-9_-]+$/;

export async function GET(req: Request) {
  const roomId = new URL(req.url).searchParams.get("roomId") || "";
  if (!ROOM.test(roomId)) {
    return NextResponse.json({ ok: false, error: "roomId required" }, { status: 400 });
  }
  const result = await cherry("GET", `/groups/${roomId}/messages`, undefined, {
    limit: "50",
  });
  return NextResponse.json(
    { ok: result.ok, status: result.status, data: result.data },
    { status: result.ok ? 200 : result.status },
  );
}

export async function POST(req: Request) {
  let body: { roomId?: string; content?: string };
  try {
    body = (await req.json()) as { roomId?: string; content?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "JSON required" }, { status: 400 });
  }
  const roomId = (body.roomId || "").trim();
  const content = (body.content || "").trim();
  if (!ROOM.test(roomId) || content.length < 1) {
    return NextResponse.json(
      { ok: false, error: "roomId and content required" },
      { status: 400 },
    );
  }
  const result = await cherry("POST", `/groups/${roomId}/messages`, { content });
  return NextResponse.json(
    { ok: result.ok, status: result.status, data: result.data },
    { status: result.ok ? 200 : result.status },
  );
}
