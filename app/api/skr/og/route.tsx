import { ImageResponse } from "next/og";

export const runtime = "edge";

async function fetchVaultData() {
    try {
        const [vaultRes, stakersRes, summaryRes] = await Promise.all([
            fetch("https://api.metasal.xyz/api/allocation/CYPdPHMh1mD6ioFFVva7L2rFeKLBpcefVv5yv1p6iRqB", { next: { revalidate: 300 } }),
            fetch("https://mainnet.helius-rpc.com/?api-key=38d87a91-14f5-45fa-b517-09d7c89ace29", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getProgramAccounts",
                    params: ["SKRskrmtL83pcL4YqLWt6iPefDqwXQWHSw9S9vz94BZ", { encoding: "base64", dataSlice: { offset: 0, length: 0 } }],
                }),
            }),
            fetch("https://api.metasal.xyz/api/summary", { next: { revalidate: 300 } }),
        ]);

        const stakersData = await stakersRes.json();
        const summaryData = await summaryRes.json();

        return {
            stakerCount: stakersData.result?.length || 0,
            totalAllocations: summaryData.totalAllocations || 0,
            grandTotal: summaryData.grandTotal || 0,
        };
    } catch {
        return { stakerCount: 0, totalAllocations: 0, grandTotal: 0 };
    }
}

function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
}

export async function GET() {
    const data = await fetchVaultData();

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
                    fontFamily: "system-ui, sans-serif",
                }}
            >
                {/* Border glow effect */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "40px 60px",
                        borderRadius: "24px",
                        border: "2px solid rgba(0, 255, 217, 0.5)",
                        background: "rgba(0, 0, 0, 0.6)",
                        boxShadow: "0 0 60px rgba(0, 255, 217, 0.2)",
                    }}
                >
                    {/* Title */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "30px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "56px",
                                fontWeight: "bold",
                                background: "linear-gradient(45deg, #00ffd9, #00ff66)",
                                backgroundClip: "text",
                                color: "transparent",
                            }}
                        >
                            SKR Season 1 Stats
                        </span>
                    </div>

                    {/* Stats Grid */}
                    <div
                        style={{
                            display: "flex",
                            gap: "40px",
                            marginBottom: "20px",
                        }}
                    >
                        {/* Stakers */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "24px 40px",
                                background: "rgba(0, 255, 217, 0.1)",
                                borderRadius: "16px",
                                border: "1px solid rgba(0, 255, 217, 0.3)",
                            }}
                        >
                            <span style={{ fontSize: "20px", color: "#a0a0a0", marginBottom: "8px" }}>
                                STAKERS
                            </span>
                            <span
                                style={{
                                    fontSize: "48px",
                                    fontWeight: "bold",
                                    color: "#00ffd9",
                                }}
                            >
                                {formatNumber(data.stakerCount)}
                            </span>
                        </div>

                        {/* Allocations */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "24px 40px",
                                background: "rgba(0, 255, 217, 0.1)",
                                borderRadius: "16px",
                                border: "1px solid rgba(0, 255, 217, 0.3)",
                            }}
                        >
                            <span style={{ fontSize: "20px", color: "#a0a0a0", marginBottom: "8px" }}>
                                ALLOCATIONS
                            </span>
                            <span
                                style={{
                                    fontSize: "48px",
                                    fontWeight: "bold",
                                    color: "#00ffd9",
                                }}
                            >
                                {formatNumber(data.totalAllocations)}
                            </span>
                        </div>

                        {/* Total SKR */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "24px 40px",
                                background: "rgba(0, 255, 217, 0.1)",
                                borderRadius: "16px",
                                border: "1px solid rgba(0, 255, 217, 0.3)",
                            }}
                        >
                            <span style={{ fontSize: "20px", color: "#a0a0a0", marginBottom: "8px" }}>
                                TOTAL SKR
                            </span>
                            <span
                                style={{
                                    fontSize: "48px",
                                    fontWeight: "bold",
                                    color: "#00ffd9",
                                }}
                            >
                                {formatNumber(data.grandTotal)}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            display: "flex",
                            marginTop: "20px",
                            color: "#606060",
                            fontSize: "18px",
                        }}
                    >
                        seekertracker.xyz/skr
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
