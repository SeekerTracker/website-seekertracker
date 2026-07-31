import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TRACKER Sweep — hourly SOL drip for holders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background:
            "linear-gradient(165deg, #031414 0%, #020a0a 45%, #041a16 100%)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          position: "relative",
          color: "#e8fffa",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,255,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,217,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            right: -60,
            top: -100,
            borderRadius: 999,
            background:
              "radial-gradient(circle, rgba(0,255,217,0.22), transparent 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontSize: 18,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(0,255,217,0.75)",
                fontWeight: 700,
              }}
            >
              Seeker Tracker · $TRACKER
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(0,255,217,0.35)",
              background: "rgba(0,255,217,0.08)",
              color: "#00ffd9",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Hourly drip
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            position: "relative",
            marginTop: 24,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              background:
                "linear-gradient(120deg, #00ffd9 0%, #00ff66 55%, #00e6c0 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Hold TRACKER.
            <br />
            Get paid hourly.
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#8ab8b0",
              maxWidth: 820,
              lineHeight: 1.4,
            }}
          >
            Fee-funded SOL drip · 1M–20M band · LP excluded
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, position: "relative" }}>
          {(
            [
              ["10%", "of fees"],
              ["1–20M", "hold band"],
              ["0.01 SOL", "min payout"],
              ["Hourly", "cadence"],
            ] as const
          ).map(([v, l]) => (
            <div
              key={l}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "18px 16px",
                borderRadius: 14,
                border: "1px solid rgba(0,255,217,0.2)",
                background: "rgba(0,20,20,0.65)",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: "#00ffd9" }}>
                {v}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "#6a9090",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: "#00ffd9" }}>
            seekertracker.com/sweep
          </div>
          <div style={{ fontSize: 18, color: "#6a9090" }}>@Seeker_Tracker</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
