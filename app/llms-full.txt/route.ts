import { buildApiIndex, buildLlmsTxt } from "app/(utils)/lib/publicApi";

export const runtime = "nodejs";
export const dynamic = "force-static";

/** GET /llms-full.txt — extended agent context */
export async function GET() {
  const index = buildApiIndex();
  const body = [
    buildLlmsTxt(),
    "",
    "## Full endpoint JSON index",
    "",
    "```json",
    JSON.stringify(index, null, 2),
    "```",
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
