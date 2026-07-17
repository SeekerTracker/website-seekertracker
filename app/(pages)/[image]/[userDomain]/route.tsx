import { generateMetaTagsHtml, isSocialMediaBot } from "app/(utils)/metadata";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

/**
 * Passport-style OG image for .skr domains.
 * Uses next/og (edge-safe) instead of node-canvas so Cloudflare Workers can build.
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
  const baseName = userDomain.replace(/\.skr$/i, "").replace(/\.png$/i, "");
  const displayName = `${baseName}.skr`;

  if (!isRawRequest && isSocialMediaBot(userAgent)) {
    const webDomain = `${url.protocol}//${url.host}`;
    const html = generateMetaTagsHtml(userDomain, webDomain, showAge);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(145deg, #003333 0%, #001a1a 55%, #000 100%)",
          color: "#14F195",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.7, marginBottom: 16 }}>Seeker Tracker</div>
        <div style={{ fontSize: 64, fontWeight: 700 }}>{displayName}</div>
        <div style={{ fontSize: 22, color: "#9945FF", marginTop: 20 }}>
          Solana Mobile SeekerID
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
