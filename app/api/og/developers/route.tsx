import { ImageResponse } from "next/og";
import { LOGO_OG_DATA_URL } from "app/(utils)/lib/logoOgDataUrl";

export const runtime = "nodejs";

const SITE = "https://seekertracker.com";

/**
 * Dedicated developers OG card.
 * Served from /api so it never collides with /image/{domain} or dynamic pages.
 * GET /api/og/developers
 */
export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            position: "relative",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            background: "#020a08",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              background:
                "radial-gradient(ellipse 90% 80% at 30% 20%, #0a3d34 0%, #041812 45%, #010605 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              opacity: 0.45,
              backgroundImage:
                "linear-gradient(rgba(0,255,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,217,0.05) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 28,
              left: 28,
              right: 28,
              bottom: 28,
              border: "2px solid rgba(0,255,217,0.32)",
              borderRadius: 24,
              display: "flex",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              padding: "56px 64px",
              position: "relative",
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LOGO_OG_DATA_URL}
                  width={56}
                  height={56}
                  alt=""
                  style={{
                    borderRadius: 14,
                    border: "2px solid rgba(0,255,217,0.45)",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#ededed",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Seeker Tracker
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: "rgba(0,255,217,0.7)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    seekertracker.com/developers
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(0,255,217,0.12)",
                  border: "1.5px solid rgba(0,255,217,0.45)",
                  borderRadius: 999,
                  padding: "10px 20px",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#00ffd9",
                    letterSpacing: "0.14em",
                  }}
                >
                  API-FIRST
                </span>
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 48,
                gap: 14,
              }}
            >
              <div
                style={{
                  fontSize: 68,
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  display: "flex",
                }}
              >
                Public API for agents
              </div>
              <div
                style={{
                  fontSize: 28,
                  color: "#00ffd9",
                  display: "flex",
                  maxWidth: 920,
                  lineHeight: 1.35,
                }}
              >
                .skr domains · Seeker dApps · SKR · prices · no auth
              </div>
            </div>

            {/* Endpoint chips */}
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: "auto",
                width: "100%",
              }}
            >
              {[
                { path: "/llms.txt", label: "Discovery" },
                { path: "/api", label: "JSON index" },
                { path: "/openapi.json", label: "OpenAPI 3.1" },
                { path: "CORS open", label: "Public reads" },
              ].map((item) => (
                <div
                  key={item.path}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "18px 12px",
                    background: "rgba(0,255,217,0.08)",
                    border: "1.5px solid rgba(0,255,217,0.3)",
                    borderRadius: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#00ffd9",
                      display: "flex",
                    }}
                  >
                    {item.path}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      color: "rgba(255,255,255,0.5)",
                      marginTop: 6,
                      display: "flex",
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=600",
        },
      }
    );
  } catch (e) {
    console.error("/api/og/developers", e);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#001a1a",
            color: "#00ffd9",
            fontFamily: "system-ui, sans-serif",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 800, display: "flex" }}>
            Seeker Tracker API
          </div>
          <div style={{ fontSize: 24, color: "#8eb5b5", display: "flex" }}>
            {SITE}/developers
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
