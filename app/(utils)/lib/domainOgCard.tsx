/**
 * SeekerID Open Graph / Telegram share card (1200×630).
 * Flat PNG for scrapers — designed to look like a physical 3D card
 * (layered depth, foil sheen, soft light). Satori-compatible only.
 */

export type DomainOgProps = {
  displayName: string;
  rank?: number | null;
  activatedAt?: string | null;
  /** data: URL or absolute URL for logo mark */
  logoSrc?: string;
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
  if (len <= 10) return 86;
  if (len <= 14) return 72;
  if (len <= 18) return 60;
  if (len <= 24) return 50;
  if (len <= 30) return 42;
  return 36;
}

/** React element tree for ImageResponse */
export function DomainOgCard({
  displayName,
  rank,
  activatedAt,
  logoSrc,
}: DomainOgProps) {
  const rankLabel =
    rank != null && Number.isFinite(rank)
      ? `#${rank.toLocaleString("en-US")}`
      : "—";
  const dateLabel = formatActivated(activatedAt);
  const titleSize = domainFontSize(displayName);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020808",
        position: "relative",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Studio backdrop */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          background:
            "radial-gradient(ellipse 90% 70% at 50% 40%, #0a2a22 0%, #041412 42%, #010706 100%)",
        }}
      />

      {/* Soft floor light under card */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: "16%",
          right: "16%",
          height: 90,
          display: "flex",
          background:
            "radial-gradient(ellipse at center, rgba(20,241,149,0.2) 0%, transparent 72%)",
        }}
      />

      {/* Depth stack — rear plate (offset = fake 3D, no rotate — Satori-safe) */}
      <div
        style={{
          position: "absolute",
          width: 1040,
          height: 500,
          borderRadius: 28,
          background: "rgba(0, 36, 30, 0.65)",
          top: 88,
          left: 100,
          display: "flex",
        }}
      />

      {/* Depth stack — mid plate */}
      <div
        style={{
          position: "absolute",
          width: 1060,
          height: 510,
          borderRadius: 28,
          background: "rgba(6, 48, 40, 0.75)",
          border: "1px solid rgba(20,241,149,0.14)",
          top: 72,
          left: 82,
          display: "flex",
        }}
      />

      {/* Main card body */}
      <div
        style={{
          position: "relative",
          width: 1080,
          height: 520,
          borderRadius: 28,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background:
            "linear-gradient(145deg, #0d2f28 0%, #06201a 38%, #031411 72%, #02100e 100%)",
          border: "2px solid rgba(20, 241, 149, 0.38)",
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(20,241,149,0.08), 0 0 60px rgba(20,241,149,0.12)",
        }}
      >
        {/* Top specular highlight (3D edge light) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            display: "flex",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(20,241,149,0.85) 30%, rgba(180,255,230,0.95) 50%, rgba(20,241,149,0.85) 70%, transparent 100%)",
          }}
        />

        {/* Diagonal foil sheen (gradient only — Satori-safe) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background:
              "linear-gradient(125deg, transparent 0%, transparent 38%, rgba(255,255,255,0.05) 46%, rgba(20,241,149,0.1) 50%, rgba(255,255,255,0.04) 54%, transparent 62%, transparent 100%)",
          }}
        />

        {/* Inner grid texture */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            opacity: 0.45,
            backgroundImage:
              "linear-gradient(rgba(20,241,149,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,241,149,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: "36px 44px 32px 44px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* Logo */}
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  width={56}
                  height={56}
                  alt=""
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    border: "1.5px solid rgba(20,241,149,0.45)",
                    background: "rgba(0,0,0,0.35)",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    border: "2px solid #14f195",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0, 30, 24, 0.8)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      border: "3px solid #14f195",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: "#14f195",
                      }}
                    />
                  </div>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    color: "#14f195",
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: 0.4,
                  }}
                >
                  Seeker Tracker
                </div>
                <div
                  style={{
                    display: "flex",
                    color: "rgba(160, 190, 180, 0.7)",
                    fontSize: 16,
                    fontWeight: 500,
                    marginTop: 2,
                  }}
                >
                  SeekerID Profile
                </div>
              </div>
            </div>

            {/* Activated pill */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: "12px 22px",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #00e68a 0%, #14f195 55%, #00d4aa 100%)",
                boxShadow: "0 0 28px rgba(20, 241, 149, 0.4)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 14 14">
                <path
                  d="M2.5 7.2 L5.5 10.2 L11.5 3.8"
                  fill="none"
                  stroke="#04140e"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                style={{
                  display: "flex",
                  color: "#04140e",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                }}
              >
                Activated
              </div>
            </div>
          </div>

          {/* Domain title with glow plate */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 28,
              width: "100%",
              padding: "20px 24px",
              borderRadius: 18,
              background:
                "linear-gradient(135deg, rgba(20,241,149,0.1) 0%, rgba(0,40,32,0.35) 100%)",
              border: "1px solid rgba(20,241,149,0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 15,
                fontWeight: 600,
                color: "rgba(20,241,149,0.65)",
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Domain
            </div>
            <div
              style={{
                display: "flex",
                fontSize: titleSize,
                fontWeight: 800,
                color: "#14f195",
                letterSpacing: -1.5,
                lineHeight: 1.05,
              }}
            >
              {displayName}
            </div>
          </div>

          {/* Stat row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 18,
              marginTop: 22,
              width: "100%",
            }}
          >
            <StatChip label="Seeker Rank" value={rankLabel} />
            <StatChip label="Activated" value={dateLabel} />
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
              paddingTop: 18,
              borderTop: "1px solid rgba(20,241,149,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 20,
                fontWeight: 600,
                color: "rgba(180, 210, 200, 0.75)",
              }}
            >
              Check yours @ seekertracker.com
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 700,
                color: "#14f195",
                letterSpacing: 0.3,
              }}
            >
              .skr on Solana
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        padding: "18px 22px",
        borderRadius: 16,
        background:
          "linear-gradient(180deg, rgba(0, 60, 48, 0.65) 0%, rgba(0, 28, 24, 0.9) 100%)",
        border: "1.5px solid rgba(20, 241, 149, 0.32)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 14,
          fontWeight: 600,
          color: "rgba(150, 185, 175, 0.75)",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 36,
          fontWeight: 800,
          color: "#14f195",
          letterSpacing: -0.5,
        }}
      >
        {value}
      </div>
    </div>
  );
}
