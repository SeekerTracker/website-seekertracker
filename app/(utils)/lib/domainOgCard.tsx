/**
 * SeekerID Open Graph / Telegram share card (1200×630).
 * Holographic digital passport — flat PNG, Satori-safe styles only.
 */

export type DomainOgProps = {
  displayName: string;
  rank?: number | null;
  activatedAt?: string | null;
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
  if (len <= 8) return 92;
  if (len <= 12) return 76;
  if (len <= 16) return 62;
  if (len <= 20) return 50;
  if (len <= 26) return 42;
  return 34;
}

function rankFontSize(label: string): number {
  const len = label.length;
  if (len <= 4) return 68;
  if (len <= 6) return 56;
  if (len <= 8) return 48;
  return 40;
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
  const rankSize = rankFontSize(rankLabel);
  const base = displayName.replace(/\.skr$/i, "");
  const chars = base.length;
  const watermark =
    rank != null && Number.isFinite(rank) ? String(rank) : "SKR";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#030a08",
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
            "radial-gradient(ellipse 80% 70% at 30% 35%, #0c3228 0%, #041510 48%, #010605 100%)",
        }}
      />

      {/* Bloom TR */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 520,
          height: 420,
          display: "flex",
          background:
            "radial-gradient(circle at 70% 30%, rgba(20,241,149,0.16) 0%, transparent 65%)",
        }}
      />

      {/* Floor glow */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 140,
          right: 140,
          height: 48,
          display: "flex",
          background:
            "radial-gradient(ellipse at center, rgba(20,241,149,0.2) 0%, transparent 75%)",
        }}
      />

      {/* Depth far */}
      <div
        style={{
          position: "absolute",
          top: 92,
          left: 92,
          width: 1020,
          height: 480,
          borderRadius: 32,
          display: "flex",
          background: "rgba(0, 28, 22, 0.55)",
        }}
      />

      {/* Depth mid */}
      <div
        style={{
          position: "absolute",
          top: 74,
          left: 72,
          width: 1050,
          height: 500,
          borderRadius: 32,
          display: "flex",
          background: "rgba(4, 42, 34, 0.72)",
          border: "1px solid rgba(20,241,149,0.1)",
        }}
      />

      {/* Main card */}
      <div
        style={{
          position: "relative",
          marginTop: 55,
          marginLeft: 52,
          width: 1096,
          height: 520,
          borderRadius: 32,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background:
            "linear-gradient(155deg, #12382e 0%, #0a241e 28%, #061814 62%, #03100d 100%)",
          border: "2px solid rgba(20, 241, 149, 0.42)",
        }}
      >
        {/* Left neon bar */}
        <div
          style={{
            position: "absolute",
            top: 24,
            bottom: 24,
            left: 0,
            width: 5,
            display: "flex",
            borderRadius: 4,
            background:
              "linear-gradient(180deg, #00ffa3 0%, #14f195 40%, #00c98a 100%)",
          }}
        />

        {/* Top specular */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            display: "flex",
            background:
              "linear-gradient(90deg, transparent 5%, rgba(180,255,230,0.95) 35%, rgba(20,241,149,0.9) 55%, transparent 92%)",
          }}
        />

        {/* Holo band */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background:
              "linear-gradient(118deg, transparent 0%, transparent 42%, rgba(255,255,255,0.035) 48%, rgba(20,241,149,0.09) 52%, rgba(255,255,255,0.03) 56%, transparent 64%)",
          }}
        />

        {/* Grid */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            opacity: 0.35,
            backgroundImage:
              "linear-gradient(rgba(20,241,149,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(20,241,149,0.035) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Watermark rank */}
        <div
          style={{
            position: "absolute",
            right: 28,
            bottom: 20,
            display: "flex",
            fontSize: 160,
            fontWeight: 800,
            color: "rgba(20,241,149,0.06)",
            letterSpacing: -6,
            lineHeight: 1,
          }}
        >
          {watermark}
        </div>

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: "32px 44px 28px 48px",
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
                gap: 16,
              }}
            >
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  width={58}
                  height={58}
                  alt=""
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    border: "2px solid rgba(20,241,149,0.65)",
                    background: "#000000",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    border: "2px solid #14f195",
                    background: "#000000",
                  }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 3.2,
                    color: "rgba(20,241,149,0.7)",
                  }}
                >
                  DIGITAL PASSPORT
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: 2,
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#edfdf6",
                    letterSpacing: -0.3,
                  }}
                >
                  SeekerID
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: "11px 20px 11px 14px",
                borderRadius: 999,
                background:
                  "linear-gradient(100deg, #00e887 0%, #14f195 50%, #00d4a8 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: "rgba(4,20,14,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path
                    d="M2.5 7.2 L5.5 10.2 L11.5 3.8"
                    fill="none"
                    stroke="#04140e"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div
                style={{
                  display: "flex",
                  color: "#04140e",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                }}
              >
                Activated
              </div>
            </div>
          </div>

          {/* Hero: domain + rank */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              width: "100%",
              marginTop: 36,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: 720,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 2.8,
                  color: "rgba(20,241,149,0.55)",
                  marginBottom: 10,
                }}
              >
                DOMAIN NAME
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: titleSize,
                  fontWeight: 800,
                  color: "#14f195",
                  letterSpacing: -2,
                  lineHeight: 1,
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "rgba(20,241,149,0.08)",
                    border: "1px solid rgba(20,241,149,0.22)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgba(180, 220, 205, 0.85)",
                    marginRight: 10,
                  }}
                >
                  .skr · Solana
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "rgba(20,241,149,0.08)",
                    border: "1px solid rgba(20,241,149,0.22)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgba(180, 220, 205, 0.85)",
                  }}
                >
                  {`${chars} chars`}
                </div>
              </div>
            </div>

            {/* Rank seal */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 220,
                height: 176,
                borderRadius: 24,
                background:
                  "linear-gradient(160deg, rgba(20,241,149,0.14) 0%, rgba(0,40,32,0.55) 55%, rgba(0,20,16,0.8) 100%)",
                border: "2px solid rgba(20,241,149,0.4)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 2.4,
                  color: "rgba(20,241,149,0.65)",
                  marginBottom: 6,
                }}
              >
                SEEKER RANK
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: rankSize,
                  fontWeight: 800,
                  color: "#edfdf6",
                  letterSpacing: -1.5,
                  lineHeight: 1,
                }}
              >
                {rankLabel}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  width: 48,
                  height: 3,
                  borderRadius: 2,
                  background:
                    "linear-gradient(90deg, transparent, #14f195, transparent)",
                }}
              />
            </div>
          </div>

          {/* Footer meta */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "auto",
              paddingTop: 22,
              borderTop: "1px solid rgba(20,241,149,0.14)",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginRight: 40,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.8,
                    color: "rgba(20,241,149,0.5)",
                    marginBottom: 4,
                  }}
                >
                  ACTIVATED
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#edfdf6",
                  }}
                >
                  {dateLabel}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginRight: 40,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.8,
                    color: "rgba(20,241,149,0.5)",
                    marginBottom: 4,
                  }}
                >
                  NETWORK
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#edfdf6",
                  }}
                >
                  Solana
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.8,
                    color: "rgba(20,241,149,0.5)",
                    marginBottom: 4,
                  }}
                >
                  TYPE
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#edfdf6",
                  }}
                >
                  SeekerID
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#14f195",
                }}
              >
                seekertracker.com
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 2,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(160, 190, 180, 0.55)",
                }}
              >
                Check yours · share this card
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
