import { buildLlmsTxt } from "app/(utils)/lib/publicApi";

export const runtime = "nodejs";
export const dynamic = "force-static";

/** GET /llms.txt — agent discovery (API-first) */
export async function GET() {
  return new Response(buildLlmsTxt(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
