import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// nodejs: more reliable ImageResponse + outbound GraphQL on CF Workers
export const runtime = "nodejs";

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql";
const SC = `{locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}`;
const SITE_URL = "https://seekertracker.com";

/** Satori can't decode WebP — proxy images to PNG */
function pngIcon(uri: string, size = 280): string {
  return `https://images.weserv.nl/?url=${encodeURIComponent(uri)}&output=png&w=${size}&h=${size}&fit=cover`;
}

function pngShot(uri: string, w = 400, h = 720): string {
  return `https://images.weserv.nl/?url=${encodeURIComponent(uri)}&output=png&w=${w}&h=${h}&fit=cover`;
}

function pngWide(uri: string, w = 1200, h = 630): string {
  return `https://images.weserv.nl/?url=${encodeURIComponent(uri)}&output=png&w=${w}&h=${h}&fit=cover`;
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
                banner { uri }
                featureGraphic { uri }
                screenshots { uri }
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
  const shots: string[] = Array.isArray(release?.screenshots)
    ? release.screenshots
        .map((s: { uri?: string } | null) => s?.uri)
        .filter((u: string | undefined): u is string => Boolean(u))
        .slice(0, 3)
    : [];
  const heroArt: string | null =
    release?.featureGraphic?.uri || release?.banner?.uri || null;
  const shortName = name.length > 28 ? name.slice(0, 26) + "..." : name;
  const shortSub =
    subtitle.length > 72 ? subtitle.slice(0, 70) + "..." : subtitle;

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
        {heroArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pngWide(heroArt)}
            width={1200}
            height={630}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              background:
                "radial-gradient(ellipse 90% 80% at 28% 40%, #0e3a2e 0%, #061a14 50%, #020908 100%)",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background:
              "linear-gradient(90deg, rgba(2,10,8,0.92) 0%, rgba(2,10,8,0.78) 42%, rgba(2,10,8,0.35) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 8,
            bottom: 0,
            display: "flex",
            background: "#00ffd9",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 48,
            top: 36,
            width: 560,
            height: 490,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 3,
              color: "#00ffd9",
              marginBottom: 18,
            }}
          >
            SEEKER DAPP STORE
          </div>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            {release?.icon?.uri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pngIcon(release.icon.uri, 160)}
                width={96}
                height={96}
                alt=""
                style={{
                  borderRadius: 22,
                  border: "3px solid #00ffd9",
                  marginRight: 18,
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 96,
                  height: 96,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#00ffd9",
                  fontSize: 42,
                  fontWeight: 800,
                  color: "#001a1a",
                  marginRight: 18,
                }}
              >
                {initial}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: shortName.length > 16 ? 36 : 48,
                  fontWeight: 800,
                  color: "#edeeee",
                  lineHeight: 1.05,
                }}
              >
                {shortName}
              </div>
              {publisher ? (
                <div
                  style={{
                    display: "flex",
                    marginTop: 6,
                    fontSize: 20,
                    color: "rgba(0,255,217,0.75)",
                  }}
                >
                  {publisher}
                </div>
              ) : null}
            </div>
          </div>
          {shortSub ? (
            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontSize: 24,
                color: "#c8e6e2",
                lineHeight: 1.3,
              }}
            >
              {shortSub}
            </div>
          ) : null}
          {rating != null && rating > 0 ? (
            <div
              style={{
                display: "flex",
                marginTop: 18,
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(0,255,217,0.12)",
                border: "1px solid rgba(0,255,217,0.4)",
                fontSize: 20,
                fontWeight: 800,
                color: "#00ffd9",
              }}
            >
              {`${rating.toFixed(1)} / 5`}
              {totalReviews > 0 ? `  ·  ${totalReviews} reviews` : ""}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginTop: "auto",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${SITE_URL}/logo.png`}
              width={44}
              height={44}
              alt=""
              style={{ borderRadius: 10, marginRight: 12 }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 800,
                color: "#00ffd9",
              }}
            >
              Seeker Tracker
            </div>
          </div>
        </div>

        {shots.length > 0 ? (
          <div
            style={{
              position: "absolute",
              right: 36,
              top: 24,
              width: 540,
              height: 500,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {shots.map((uri: string, i: number) => (
              <div
                key={uri}
                style={{
                  display: "flex",
                  width: 186,
                  height: 400,
                  marginLeft: i === 0 ? 0 : -28,
                  borderRadius: 28,
                  overflow: "hidden",
                  border: "3px solid #00ffd9",
                  background: "#041616",
                  transform:
                    i === 0
                      ? "rotate(-7deg)"
                      : i === 2
                        ? "rotate(7deg)"
                        : "rotate(0deg)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pngShot(uri)}
                  width={186}
                  height={400}
                  alt=""
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              right: 80,
              top: 140,
              display: "flex",
            }}
          >
            {release?.icon?.uri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pngIcon(release.icon.uri, 320)}
                width={280}
                height={280}
                alt=""
                style={{
                  borderRadius: 48,
                  border: "4px solid #00ffd9",
                }}
              />
            ) : null}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 78,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#00ffd9",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: 2,
              color: "#001a1a",
            }}
          >
            seekertracker.com
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
