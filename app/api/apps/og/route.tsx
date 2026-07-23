import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// nodejs: more reliable ImageResponse + outbound GraphQL on CF Workers
export const runtime = "nodejs";

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql";
const SC = `{locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}`;
const SITE_URL = "https://seekertracker.com";

/** Satori can't decode WebP — proxy icons to PNG */
function pngIcon(uri: string, size = 280): string {
  return `https://images.weserv.nl/?url=${encodeURIComponent(uri)}&output=png&w=${size}&h=${size}&fit=cover`;
}

async function fetchAppsData(): Promise<{ count: number; icons: string[] }> {
  try {
    const response = await fetch(`${SITE_URL}/api/dappstore`, {
      next: { revalidate: 1800 },
    });
    const data = await response.json();
    const count = typeof data?.totalApps === "number" ? data.totalApps : 0;
    const icons: string[] = [];
    const units = data?.data?.explore?.units?.edges || [];
    for (const unit of units) {
      for (const app of unit.node?.dApps?.edges || []) {
        const iconUri = app.node?.lastRelease?.icon?.uri;
        if (iconUri && icons.length < 8) icons.push(iconUri);
      }
      if (icons.length >= 8) break;
    }
    return { count: count || 500, icons };
  } catch {
    return { count: 500, icons: [] };
  }
}

async function fetchAppData(androidPackage: string) {
  const pkg = androidPackage.replace(/"/g, '\\"');
  const query = `query {
        dAppByAndroidPackage(
            systemContext: ${SC},
            androidPackage: "${pkg}"
        ) {
            androidPackage
            rating { rating reviewsByRating }
            lastRelease(systemContext: ${SC}) {
                displayName
                subtitle
                description
                updatedOn
                icon { uri }
                publisherDetails { name }
            }
        }
    }`;

  try {
    const response = await fetch(DAPPSTORE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "SeekerTracker/1.0 OG",
      },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    if (data.data?.dAppByAndroidPackage) {
      return data.data.dAppByAndroidPackage;
    }
  } catch {
    /* fall through */
  }

  // Fallback: our catalog package endpoint
  try {
    const res = await fetch(
      `${SITE_URL}/api/dappstore?package=${encodeURIComponent(androidPackage)}`,
      { next: { revalidate: 600 } }
    );
    if (res.ok) {
      const j = await res.json();
      return j.app || null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appPackage = searchParams.get("app");

  // ── Catalog OG (no ?app=) ──
  if (!appPackage) {
    const { count: appCount, icons } = await fetchAppsData();

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: "#020a08",
            position: "relative",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              background:
                "radial-gradient(ellipse 80% 70% at 40% 40%, #0c3228 0%, #041510 50%, #010605 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              opacity: 0.4,
              backgroundImage:
                "linear-gradient(rgba(20,241,149,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,241,149,0.04) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Icon scatter — fixed positions (Satori-safe) */}
          {icons[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngIcon(icons[0], 140)} width={72} height={72} alt=""
              style={{ position: "absolute", top: 48, left: 48, borderRadius: 16, border: "2px solid rgba(20,241,149,0.35)" }} />
          ) : null}
          {icons[1] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngIcon(icons[1], 140)} width={64} height={64} alt=""
              style={{ position: "absolute", top: 160, left: 140, borderRadius: 14, border: "2px solid rgba(20,241,149,0.35)" }} />
          ) : null}
          {icons[2] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngIcon(icons[2], 140)} width={56} height={56} alt=""
              style={{ position: "absolute", top: 300, left: 56, borderRadius: 12, border: "2px solid rgba(20,241,149,0.35)" }} />
          ) : null}
          {icons[3] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngIcon(icons[3], 140)} width={60} height={60} alt=""
              style={{ position: "absolute", top: 440, left: 130, borderRadius: 14, border: "2px solid rgba(20,241,149,0.35)" }} />
          ) : null}
          {icons[4] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngIcon(icons[4], 140)} width={68} height={68} alt=""
              style={{ position: "absolute", top: 48, right: 48, borderRadius: 16, border: "2px solid rgba(20,241,149,0.35)" }} />
          ) : null}
          {icons[5] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngIcon(icons[5], 140)} width={58} height={58} alt=""
              style={{ position: "absolute", top: 160, right: 130, borderRadius: 14, border: "2px solid rgba(20,241,149,0.35)" }} />
          ) : null}
          {icons[6] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngIcon(icons[6], 140)} width={62} height={62} alt=""
              style={{ position: "absolute", top: 300, right: 56, borderRadius: 14, border: "2px solid rgba(20,241,149,0.35)" }} />
          ) : null}
          {icons[7] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngIcon(icons[7], 140)} width={54} height={54} alt=""
              style={{ position: "absolute", top: 440, right: 120, borderRadius: 12, border: "2px solid rgba(20,241,149,0.35)" }} />
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: 48,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${SITE_URL}/logo.png`}
                width={64}
                height={64}
                alt=""
                style={{
                  borderRadius: 16,
                  border: "2px solid rgba(20,241,149,0.5)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  marginLeft: 16,
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#edfdf6",
                }}
              >
                Seeker Tracker
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 120,
                fontWeight: 800,
                color: "#14f195",
                lineHeight: 1,
                letterSpacing: -4,
              }}
            >
              {appCount.toLocaleString()}+
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 3,
                color: "rgba(20,241,149,0.75)",
              }}
            >
              SEEKER APPS
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontSize: 42,
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              Seeker dApp Store
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 10,
                fontSize: 22,
                color: "rgba(180,210,200,0.7)",
              }}
            >
              Apps optimized for Solana Seeker
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 28,
                padding: "12px 28px",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #00e68a 0%, #14f195 50%, #00d4aa 100%)",
                fontSize: 20,
                fontWeight: 800,
                color: "#04140e",
              }}
            >
              Browse all apps
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontSize: 18,
                color: "rgba(160,190,180,0.5)",
              }}
            >
              seekertracker.com/dapps
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // ── Per-app OG ──
  const app = await fetchAppData(appPackage);

  if (!app) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(ellipse at center, #0a2a22 0%, #020808 70%)",
            color: "#edfdf6",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          }}
        >
          <div style={{ display: "flex", fontSize: 48, fontWeight: 800 }}>
            App not found
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 16,
              fontSize: 24,
              color: "rgba(20,241,149,0.7)",
            }}
          >
            seekertracker.com/dapps
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const release = app.lastRelease;
  const rating =
    typeof app.rating?.rating === "number" ? app.rating.rating : null;
  const reviews: number[] = app.rating?.reviewsByRating || [];
  const totalReviews = reviews.reduce(
    (a: number, b: number) => a + (Number(b) || 0),
    0
  );
  const name = release?.displayName || appPackage;
  const subtitle = release?.subtitle || "";
  const publisher = release?.publisherDetails?.name || "";
  const initial = name.charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#020808",
          position: "relative",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
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
              "radial-gradient(ellipse 90% 80% at 30% 45%, #0e3a2e 0%, #061a14 45%, #020908 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -20,
            width: 480,
            height: 400,
            display: "flex",
            background:
              "radial-gradient(circle, rgba(20,241,149,0.16) 0%, transparent 65%)",
          }}
        />

        {/* Depth plate */}
        <div
          style={{
            position: "absolute",
            top: 78,
            left: 88,
            width: 1040,
            height: 500,
            borderRadius: 32,
            display: "flex",
            background: "rgba(0, 32, 26, 0.55)",
          }}
        />

        {/* Main card */}
        <div
          style={{
            position: "relative",
            marginTop: 52,
            marginLeft: 60,
            width: 1080,
            height: 526,
            borderRadius: 32,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "40px 48px",
            background:
              "linear-gradient(145deg, #12382e 0%, #0a241e 40%, #051612 100%)",
            border: "2px solid rgba(20,241,149,0.4)",
            overflow: "hidden",
          }}
        >
          {/* Left neon edge */}
          <div
            style={{
              position: "absolute",
              top: 28,
              bottom: 28,
              left: 0,
              width: 5,
              borderRadius: 4,
              display: "flex",
              background:
                "linear-gradient(180deg, #00ffa3 0%, #14f195 50%, #00c98a 100%)",
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
                "linear-gradient(90deg, transparent 5%, rgba(180,255,230,0.9) 40%, rgba(20,241,149,0.8) 60%, transparent 95%)",
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
                "linear-gradient(118deg, transparent 40%, rgba(255,255,255,0.04) 48%, rgba(20,241,149,0.08) 52%, transparent 62%)",
            }}
          />

          {/* Icon */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginRight: 48,
              flexShrink: 0,
            }}
          >
            {release?.icon?.uri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pngIcon(release.icon.uri, 280)}
                width={240}
                height={240}
                alt=""
                style={{
                  borderRadius: 48,
                  border: "3px solid rgba(20,241,149,0.55)",
                  boxShadow:
                    "0 20px 50px rgba(0,0,0,0.45), 0 0 40px rgba(20,241,149,0.25)",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 240,
                  height: 240,
                  borderRadius: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, #00e68a 0%, #14f195 100%)",
                  fontSize: 100,
                  fontWeight: 800,
                  color: "#04140e",
                  border: "3px solid rgba(20,241,149,0.55)",
                }}
              >
                {initial}
              </div>
            )}
          </div>

          {/* Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
              height: "100%",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2.5,
                color: "rgba(20,241,149,0.65)",
                marginBottom: 10,
              }}
            >
              SEEKER DAPP STORE
            </div>

            <div
              style={{
                display: "flex",
                fontSize: name.length > 22 ? 42 : 54,
                fontWeight: 800,
                color: "#edfdf6",
                letterSpacing: -1.2,
                lineHeight: 1.05,
                marginBottom: 12,
              }}
            >
              {name.length > 36 ? name.slice(0, 34) + "…" : name}
            </div>

            {subtitle ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "#14f195",
                  lineHeight: 1.3,
                  marginBottom: 16,
                }}
              >
                {subtitle.length > 90
                  ? subtitle.slice(0, 88) + "…"
                  : subtitle}
              </div>
            ) : null}

            {publisher ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: "rgba(180,210,200,0.7)",
                  marginBottom: 18,
                }}
              >
                by {publisher}
              </div>
            ) : null}

            {rating != null ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    padding: "8px 16px",
                    borderRadius: 999,
                    background: "rgba(20,241,149,0.12)",
                    border: "1px solid rgba(20,241,149,0.35)",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#14f195",
                  }}
                >
                  {`${rating.toFixed(1)} / 5`}
                </div>
                {totalReviews > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      marginLeft: 14,
                      fontSize: 20,
                      color: "rgba(160,190,180,0.65)",
                    }}
                  >
                    {`${totalReviews.toLocaleString()} reviews`}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Footer brand */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "auto",
                paddingTop: 20,
                borderTop: "1px solid rgba(20,241,149,0.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${SITE_URL}/logo.png`}
                  width={40}
                  height={40}
                  alt=""
                  style={{
                    borderRadius: 10,
                    border: "1.5px solid rgba(20,241,149,0.45)",
                    marginRight: 12,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
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
                    Seeker Tracker
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 14,
                      color: "rgba(160,190,180,0.55)",
                    }}
                  >
                    seekertracker.com/dapps
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, #00e68a 0%, #14f195 100%)",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#04140e",
                }}
              >
                View on Seeker
              </div>
            </div>
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
}
