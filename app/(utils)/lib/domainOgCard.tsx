/**
 * Shared SeekerID Open Graph / Telegram share card (1200×630).
 * Designed for next/og ImageResponse (Satori-compatible styles only).
 */

export type DomainOgProps = {
  displayName: string;
  rank?: number | null;
  activatedAt?: string | null; // ISO date
};

function formatActivated(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "—";
  }
}

function domainFontSize(name: string): number {
  const len = name.length;
  if (len <= 12) return 88;
  if (len <= 16) return 72;
  if (len <= 22) return 58;
  if (len <= 28) return 48;
  return 40;
}

/** React element tree for ImageResponse */
export function DomainOgCard({ displayName, rank, activatedAt }: DomainOgProps) {
  const rankLabel =
    rank != null && Number.isFinite(rank) ? `#${rank.toLocaleString("en-US")}` : "—";
  const dateLabel = formatActivated(activatedAt);
  const titleSize = domainFontSize(displayName);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(160deg, #021a1a 0%, #031412 45%, #010a0a 100%)",
        position: "relative",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Fine grid */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          backgroundImage:
            "linear-gradient(rgba(0, 255, 200, 0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 200, 0.055) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Soft cyan glow behind title */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: "8%",
          width: "70%",
          height: "40%",
          display: "flex",
          background:
            "radial-gradient(ellipse at center, rgba(0, 255, 200, 0.14) 0%, transparent 70%)",
        }}
      />

      {/* Content frame */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "48px 56px 44px 56px",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Activated pill */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: "12px 22px",
              borderRadius: 999,
              background: "linear-gradient(90deg, #00e68a 0%, #14f195 55%, #00d4aa 100%)",
              boxShadow: "0 0 24px rgba(20, 241, 149, 0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 22,
                height: 22,
                borderRadius: 999,
                background: "rgba(0,0,0,0.18)",
                color: "#04140e",
                fontSize: 16,
                fontWeight: 700,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✓
            </div>
            <div
              style={{
                display: "flex",
                color: "#04140e",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 0.3,
              }}
            >
              Activated
            </div>
          </div>

          {/* Logo mark */}
          <div
            style={{
              display: "flex",
              width: 72,
              height: 72,
              borderRadius: 999,
              border: "3px solid #14f195",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 40, 32, 0.55)",
              boxShadow: "0 0 20px rgba(20, 241, 149, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 36,
                height: 36,
                borderRadius: 999,
                border: "3px solid #14f195",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: "#14f195",
                }}
              />
            </div>
          </div>
        </div>

        {/* Title block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 40,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              fontWeight: 800,
              color: "#14f195",
              letterSpacing: -1.5,
              lineHeight: 1.05,
              textShadow: "0 0 40px rgba(20, 241, 149, 0.35)",
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontSize: 28,
              fontWeight: 500,
              color: "rgba(180, 200, 195, 0.75)",
              letterSpacing: 0.4,
            }}
          >
            SeekerID Profile
          </div>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 24,
            marginTop: 44,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 24px",
              borderRadius: 20,
              background: "linear-gradient(180deg, rgba(0, 55, 45, 0.75) 0%, rgba(0, 30, 26, 0.9) 100%)",
              border: "2px solid rgba(20, 241, 149, 0.35)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 48,
                fontWeight: 800,
                color: "#14f195",
                letterSpacing: -0.5,
              }}
            >
              {rankLabel}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontSize: 18,
                fontWeight: 500,
                color: "rgba(160, 185, 178, 0.7)",
              }}
            >
              Seeker Rank
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 24px",
              borderRadius: 20,
              background: "linear-gradient(180deg, rgba(0, 55, 45, 0.75) 0%, rgba(0, 30, 26, 0.9) 100%)",
              border: "2px solid rgba(20, 241, 149, 0.35)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 42,
                fontWeight: 800,
                color: "#14f195",
                letterSpacing: -0.5,
              }}
            >
              {dateLabel}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontSize: 18,
                fontWeight: 500,
                color: "rgba(160, 185, 178, 0.7)",
              }}
            >
              Activated
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            paddingTop: 28,
            fontSize: 24,
            fontWeight: 600,
            color: "#14f195",
            letterSpacing: 0.2,
          }}
        >
          Check yours @SeekerTracker.com
        </div>
      </div>
    </div>
  );
}
