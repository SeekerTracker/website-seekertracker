import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

/** Serve /solana.txt as plain text (TRACKER mint + related addresses). */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "solana.txt");
    const body = await readFile(filePath, "utf8");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch {
    // Fallback body if public file missing at runtime
    const fallback = `# Seeker Tracker — Solana
# https://seekertracker.com

token: ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS
chain: solana
symbol: TRACKER
name: Seeker Tracker
site: https://seekertracker.com
`;
    return new Response(fallback, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}
