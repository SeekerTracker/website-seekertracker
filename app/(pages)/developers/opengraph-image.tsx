import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const revalidate = 600;
export const alt =
  "Seeker Tracker Public API — llms.txt, OpenAPI, JSON for agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            background: "linear-gradient(135deg, #001414 0%, #002a2a 50%, #000808 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            fontFamily: "system-ui, sans-serif",
            position: "relative",
            padding: "52px 56px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(0,255,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,217,0.05) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              right: 20,
              bottom: 20,
              border: "2px solid rgba(0,255,217,0.3)",
              borderRadius: 22,
              display: "flex",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                background: "rgba(0,255,217,0.12)",
                border: "1.5px solid rgba(0,255,217,0.45)",
                borderRadius: 999,
                padding: "8px 18px",
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
            <span style={{ fontSize: 16, color: "rgba(0,255,217,0.55)" }}>
              seekertracker.com/developers
            </span>
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.05,
              marginTop: 26,
              zIndex: 1,
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            Public API for agents
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#00ffd9",
              marginTop: 14,
              zIndex: 1,
              display: "flex",
              maxWidth: 900,
            }}
          >
            .skr domains · Seeker dApps · SKR · prices · no auth
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              position: "absolute",
              bottom: 52,
              left: 56,
              right: 56,
              zIndex: 1,
            }}
          >
            {[
              { value: "/llms.txt", label: "Discovery" },
              { value: "/api", label: "JSON index" },
              { value: "/openapi.json", label: "OpenAPI 3.1" },
              { value: "CORS", label: "Open reads" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px 10px",
                  background: "rgba(0,255,217,0.07)",
                  border: "1.5px solid rgba(0,255,217,0.28)",
                  borderRadius: 14,
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
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: "rgba(255,255,255,0.5)",
                    marginTop: 6,
                    display: "flex",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      { ...size }
    );
  } catch (e) {
    console.error("developers opengraph-image failed", e);
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
          <div style={{ fontSize: 48, fontWeight: 800, display: "flex" }}>
            Seeker Tracker API
          </div>
          <div style={{ fontSize: 24, color: "#8eb5b5", display: "flex" }}>
            /developers · /llms.txt · /openapi.json
          </div>
        </div>
      ),
      { ...size }
    );
  }
}
