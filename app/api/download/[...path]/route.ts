import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Stream large files from R2 (APKs etc.) — Workers static assets max 25MB.
 * GET /api/download/seekertracker.apk
 * GET /api/download/snake/snake.apk
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const key = path.join("/");
    if (!key || key.includes("..")) {
      return NextResponse.json({ error: "bad path" }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bucket = (env as any).DOWNLOADS as
      | {
          get: (k: string) => Promise<{
            body: ReadableStream | null;
            httpEtag: string;
            writeHttpMetadata: (h: Headers) => void;
            httpMetadata?: { contentType?: string };
          } | null>;
        }
      | undefined;
    if (!bucket) {
      return NextResponse.json(
        { error: "Downloads not configured" },
        { status: 503 }
      );
    }

    const obj = await bucket.get(key);
    if (!obj) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("etag", obj.httpEtag);
    headers.set(
      "content-type",
      obj.httpMetadata?.contentType ||
        "application/vnd.android.package-archive"
    );
    headers.set(
      "content-disposition",
      `attachment; filename="${key.split("/").pop()}"`
    );
    headers.set("cache-control", "public, max-age=86400");

    return new NextResponse(obj.body, { headers });
  } catch (e) {
    console.error("download", e);
    return NextResponse.json({ error: "download failed" }, { status: 500 });
  }
}
