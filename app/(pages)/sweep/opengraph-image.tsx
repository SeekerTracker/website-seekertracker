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
          padding: "52px 60px",
          background: "#020a0a",
          fontFamily: "sans-serif",
          position: "relative",
          color: "#e8fffa",
        }}
      >
        {/* cyan frame */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: "2px solid rgba(0,255,217,0.28)",
            borderRadius: 20,
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
          <div
            style={{
              fontSize: 20,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#00ffd9",
              fontWeight: 700,
            }}
          >
            Seeker Tracker · $TRACKER
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(0,255,217,0.4)",
              background: "rgba(0,255,217,0.1)",
              color: "#00ffd9",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.08em",
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
            gap: 16,
            position: "relative",
            marginTop: 12,
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#00ffd9",
            }}
          >
            Hold TRACKER.
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#00ff66",
            }}
          >
            Get paid hourly.
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#8ab8b0",
              marginTop: 4,
            }}
          >
            Fee-funded SOL drip · 1M–20M band · LP excluded
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            position: "relative",
          }}
        >
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
                gap: 8,
                padding: "20px 16px",
                borderRadius: 14,
                border: "1px solid rgba(0,255,217,0.25)",
                background: "rgba(0,30,28,0.9)",
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 800, color: "#00ffd9" }}>
                {v}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "#6a9090",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
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
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: "#00ffd9" }}>
            seekertracker.com/sweep
          </div>
          <div style={{ fontSize: 20, color: "#6a9090" }}>@Seeker_Tracker</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
