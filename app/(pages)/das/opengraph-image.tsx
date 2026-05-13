import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 300;

export const alt = "DAS — Daily Active Seekers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getStats() {
    try {
        const res = await fetch("https://seeker-das-scanner.gm-4e8.workers.dev/public/das", {
            next: { revalidate: 300 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function Image() {
    const stats = await getStats();
    const das = stats?.das ?? 0;
    const was = stats?.was ?? 0;
    const mas = stats?.mas ?? 0;
    const total = stats?.totalIndexed ?? 0;

    const fmt = (n: number) => n.toLocaleString();
    const pct = (n: number) => total > 0 ? `${((n / total) * 100).toFixed(2)}%` : "—";

    return new ImageResponse(
        (
            <div
                style={{
                    background: "linear-gradient(135deg, #020d0d 0%, #001a1a 50%, #002525 100%)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    fontFamily: "system-ui, sans-serif",
                    position: "relative",
                    padding: 60,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `
                            linear-gradient(rgba(0, 255, 217, 0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 217, 0.04) 1px, transparent 1px)
                        `,
                        backgroundSize: "40px 40px",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        top: 24,
                        left: 24,
                        right: 24,
                        bottom: 24,
                        border: "3px solid rgba(0, 255, 217, 0.3)",
                        borderRadius: 22,
                    }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ fontSize: 64 }}>📱</div>
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 800,
                            background: "linear-gradient(45deg, #00ffd9, #00ff66)",
                            backgroundClip: "text",
                            color: "transparent",
                        }}
                    >
                        DAS — Daily Active Seekers
                    </div>
                </div>

                <div style={{ fontSize: 28, color: "#889999", marginTop: 12 }}>
                    On-chain activity across {fmt(total)} .skr IDs
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 24,
                        position: "absolute",
                        bottom: 120,
                        left: 60,
                        right: 60,
                    }}
                >
                    {[
                        { label: "DAS · 24h", value: das, accent: "#00ffd9" },
                        { label: "WAS · 7d",  value: was, accent: "#00ffae" },
                        { label: "MAS · 30d", value: mas, accent: "#ffc800" },
                    ].map((s) => (
                        <div
                            key={s.label}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "28px 18px",
                                background: "rgba(0, 255, 217, 0.06)",
                                borderRadius: 18,
                                border: `2px solid ${s.accent}55`,
                            }}
                        >
                            <div style={{ fontSize: 22, color: "#5d7777", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                                {s.label}
                            </div>
                            <div style={{ fontSize: 72, fontWeight: 800, color: s.accent, lineHeight: 1 }}>
                                {fmt(s.value)}
                            </div>
                            <div style={{ fontSize: 20, color: "#889999", marginTop: 8 }}>
                                {pct(s.value)} of all IDs
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        position: "absolute",
                        bottom: 48,
                        left: 60,
                        fontSize: 26,
                        fontWeight: 600,
                        color: "#00ffd9",
                    }}
                >
                    seekertracker.com/das
                </div>
                <div
                    style={{
                        position: "absolute",
                        bottom: 48,
                        right: 60,
                        fontSize: 18,
                        color: "#5d7777",
                    }}
                >
                    Unofficial · estimates only
                </div>
            </div>
        ),
        { ...size }
    );
}
