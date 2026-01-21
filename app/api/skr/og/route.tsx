import { ImageResponse } from "next/og";

export const runtime = "edge";

const VAULT_ADDRESS = "CYPdPHMh1mD6ioFFVva7L2rFeKLBpcefVv5yv1p6iRqB";
const STAKED_VAULT_ADDRESS = "4HQy82s9CHTv1GsYKnANHMiHfhcqesYkK6sB3RDSYyqw";
const SKR_TOKEN_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";
const HELIUS_API_KEY = "38d87a91-14f5-45fa-b517-09d7c89ace29";
const STAKING_PROGRAM_ID = "SKRskrmtL83pcL4YqLWt6iPefDqwXQWHSw9S9vz94BZ";

async function fetchData() {
    try {
        // Fetch vault portfolios, staker count in parallel
        const [vaultRes, stakedRes, stakersRes] = await Promise.all([
            fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getAssetsByOwner",
                    params: { ownerAddress: VAULT_ADDRESS, displayOptions: { showFungible: true } },
                }),
            }),
            fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 2,
                    method: "getAssetsByOwner",
                    params: { ownerAddress: STAKED_VAULT_ADDRESS, displayOptions: { showFungible: true } },
                }),
            }),
            fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 3,
                    method: "getProgramAccounts",
                    params: [STAKING_PROGRAM_ID, { encoding: "base64", dataSlice: { offset: 0, length: 0 } }],
                }),
            }),
        ]);

        const [vaultData, stakedData, stakersData] = await Promise.all([
            vaultRes.json(),
            stakedRes.json(),
            stakersRes.json(),
        ]);

        // Find SKR token in vault
        const vaultSkr = vaultData.result?.items?.find(
            (item: { id: string; token_info?: { balance?: number; price_info?: { price_per_token?: number } } }) =>
                item.id === SKR_TOKEN_MINT
        );
        const vaultBalance = vaultSkr?.token_info?.balance
            ? vaultSkr.token_info.balance / 1e6
            : 0;
        const skrPrice = vaultSkr?.token_info?.price_info?.price_per_token || 0;
        const vaultUsd = vaultBalance * skrPrice;

        // Find SKR token in staked vault
        const stakedSkr = stakedData.result?.items?.find(
            (item: { id: string; token_info?: { balance?: number; price_info?: { price_per_token?: number } } }) =>
                item.id === SKR_TOKEN_MINT
        );
        const stakedBalance = stakedSkr?.token_info?.balance
            ? stakedSkr.token_info.balance / 1e6
            : 0;
        const stakedUsd = stakedBalance * skrPrice;

        // Count stakers
        const stakerCount = stakersData.result?.length || 0;

        return {
            vaultBalance,
            vaultUsd,
            stakedBalance,
            stakedUsd,
            stakerCount,
        };
    } catch (error) {
        console.error("OG fetch error:", error);
        return {
            vaultBalance: 0,
            vaultUsd: 0,
            stakedBalance: 0,
            stakedUsd: 0,
            stakerCount: 0,
        };
    }
}

function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
}

function formatUsd(num: number): string {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
}

export async function GET() {
    const data = await fetchData();

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
                    background: "linear-gradient(135deg, #003333 0%, #001a1a 50%, #000000 100%)",
                    fontFamily: "system-ui, sans-serif",
                    position: "relative",
                }}
            >
                {/* Grid pattern overlay */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: "linear-gradient(rgba(0, 255, 217, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 217, 0.08) 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                        display: "flex",
                    }}
                />

                {/* Content card */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "36px 50px",
                        borderRadius: "24px",
                        border: "2px solid rgba(0, 255, 217, 0.4)",
                        background: "linear-gradient(135deg, rgba(0, 51, 51, 0.8) 0%, rgba(0, 26, 26, 0.9) 100%)",
                        boxShadow: "0 0 80px rgba(0, 255, 217, 0.15), inset 0 0 60px rgba(0, 255, 217, 0.05)",
                    }}
                >
                    {/* Title */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "24px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "48px",
                                fontWeight: "bold",
                                background: "linear-gradient(45deg, #00ffd9, #00ff66)",
                                backgroundClip: "text",
                                color: "transparent",
                            }}
                        >
                            SKR Season 1 Stats
                        </span>
                    </div>

                    {/* Stats Grid - Top Row: Vaults */}
                    <div
                        style={{
                            display: "flex",
                            gap: "30px",
                            marginBottom: "20px",
                        }}
                    >
                        {/* Seeker Vault */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "20px 36px",
                                background: "linear-gradient(135deg, rgba(0, 255, 217, 0.1) 0%, rgba(0, 255, 102, 0.1) 100%)",
                                borderRadius: "16px",
                                border: "1px solid rgba(0, 255, 217, 0.3)",
                                minWidth: "240px",
                            }}
                        >
                            <span style={{ fontSize: "16px", color: "#a0a0a0", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Seeker Vault
                            </span>
                            <span
                                style={{
                                    fontSize: "36px",
                                    fontWeight: "bold",
                                    background: "linear-gradient(45deg, #00ffd9, #00ff66)",
                                    backgroundClip: "text",
                                    color: "transparent",
                                }}
                            >
                                {formatNumber(data.vaultBalance)} SKR
                            </span>
                            <span style={{ fontSize: "18px", color: "#c0c0c0", marginTop: "4px" }}>
                                {formatUsd(data.vaultUsd)}
                            </span>
                        </div>

                        {/* Staked Vault */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "20px 36px",
                                background: "linear-gradient(135deg, rgba(0, 255, 217, 0.1) 0%, rgba(0, 255, 102, 0.1) 100%)",
                                borderRadius: "16px",
                                border: "1px solid rgba(0, 255, 217, 0.3)",
                                minWidth: "240px",
                            }}
                        >
                            <span style={{ fontSize: "16px", color: "#a0a0a0", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Staked Vault
                            </span>
                            <span
                                style={{
                                    fontSize: "36px",
                                    fontWeight: "bold",
                                    background: "linear-gradient(45deg, #00ffd9, #00ff66)",
                                    backgroundClip: "text",
                                    color: "transparent",
                                }}
                            >
                                {formatNumber(data.stakedBalance)} SKR
                            </span>
                            <span style={{ fontSize: "18px", color: "#c0c0c0", marginTop: "4px" }}>
                                {formatUsd(data.stakedUsd)}
                            </span>
                        </div>
                    </div>

                    {/* Bottom Row: Stakers */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "16px 60px",
                            background: "linear-gradient(135deg, rgba(0, 255, 217, 0.1) 0%, rgba(0, 255, 102, 0.1) 100%)",
                            borderRadius: "16px",
                            border: "1px solid rgba(0, 255, 217, 0.3)",
                        }}
                    >
                        <span style={{ fontSize: "16px", color: "#a0a0a0", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Total Stakers
                        </span>
                        <span
                            style={{
                                fontSize: "40px",
                                fontWeight: "bold",
                                background: "linear-gradient(45deg, #00ffd9, #00ff66)",
                                backgroundClip: "text",
                                color: "transparent",
                            }}
                        >
                            {formatNumber(data.stakerCount)}
                        </span>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            display: "flex",
                            marginTop: "20px",
                            color: "#00ffd9",
                            fontSize: "18px",
                            opacity: 0.7,
                        }}
                    >
                        seekertracker.com/skr
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
