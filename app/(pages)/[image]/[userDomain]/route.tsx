import { generateMetaTagsHtml, isSocialMediaBot } from "app/(utils)/metadata";
import { DomainOgCard } from "app/(utils)/lib/domainOgCard";
import { getDomainByName } from "app/(utils)/lib/domainStore";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * SeekerID Open Graph / Telegram share image (1200×630).
 * Path: /image/{name}.skr?raw=true
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  let userDomain = decodeURIComponent(url.pathname.replace(/^\/image\//, ""));
  const showAge = url.searchParams.get("age") === "true";
  const isRawRequest = url.searchParams.get("raw") === "true";
  const userAgent = request.headers.get("user-agent") || "";

  if (!userDomain.includes(".")) {
    userDomain = `${userDomain}.skr`;
  }
  const baseName = userDomain
    .replace(/\.skr$/i, "")
    .replace(/\.png$/i, "")
    .toLowerCase();
  const displayName = `${baseName}.skr`;

  // Bots that need HTML meta shell (Telegram sometimes scrapes without raw)
  if (!isRawRequest && isSocialMediaBot(userAgent)) {
    const webDomain = `${url.protocol}//${url.host}`;
    const html = generateMetaTagsHtml(userDomain, webDomain, showAge);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  }

  let rank: number | null = null;
  let activatedAt: string | null = null;
  try {
    const row = await getDomainByName(baseName);
    if (row) {
      rank = row.rank;
      activatedAt = row.created_at;
    }
  } catch (e) {
    console.error("OG domain lookup failed", e);
  }

  return new ImageResponse(
    (
      <DomainOgCard
        displayName={displayName}
        rank={rank}
        activatedAt={activatedAt}
      />
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    }
  );
}
