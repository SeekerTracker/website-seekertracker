import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const revalidate = 300;
export const alt = "Seeker Tracker — Search and track .skr SeekerIDs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getActivations(): Promise<string> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://seekertracker.com/api/health", {
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    clearTimeout(t);
    if (!res.ok) return "120k+";
    const data = await res.json();
    const n = Number(data.domains ?? 0);
    return n > 0 ? n.toLocaleString() : "120k+";
  } catch {
    return "120k+";
  }
}

export default async function Image() {
  const activations = await getActivations();

  try {
    return new ImageResponse(
      (
        <div
          style={{
            background: "linear-gradient(135deg, #002a2a 0%, #001a1a 50%, #000000 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            fontFamily: "system-ui, sans-serif",
            position: "relative",
            padding: 56,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(0,255,217,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,217,0.06) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 22,
              left: 22,
              right: 22,
              bottom: 22,
              border: "2px solid rgba(0,255,217,0.28)",
              borderRadius: 20,
              display: "flex",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "linear-gradient(135deg, #00FF66 0%, #00E6C0 100%)",
              padding: "12px 22px",
              borderRadius: 999,
              width: "auto",
              alignSelf: "flex-start",
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 800, color: "#07271D" }}>
              Seeker Tracker
            </span>
          </div>

          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#00ffd9",
              marginTop: 28,
              lineHeight: 1.08,
              display: "flex",
            }}
          >
            Track .skr on Solana
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#a8c8c8",
              marginTop: 12,
              display: "flex",
            }}
          >
            Domains · dApps · SKR · public API for agents
          </div>

          <div
            style={{
              display: "flex",
              gap: 20,
              position: "absolute",
              bottom: 52,
              left: 56,
              right: 56,
            }}
          >
            {[
              { value: activations, label: "Activations" },
              { value: "API", label: "llms.txt + OpenAPI" },
              { value: "Live", label: "Catalog + prices" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "18px 16px",
                  background: "rgba(0,255,217,0.1)",
                  borderRadius: 16,
                  border: "2px solid rgba(0,255,217,0.3)",
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#00ffd9",
                    display: "flex",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: "#b0b0b0",
                    marginTop: 4,
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
    console.error("twitter-image failed", e);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#001a1a",
            color: "#00ffd9",
            fontSize: 64,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Seeker Tracker
        </div>
      ),
      { ...size }
    );
  }
}
