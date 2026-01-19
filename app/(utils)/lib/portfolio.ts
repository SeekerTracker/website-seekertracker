import { CONN_RPC_URL } from "../constant";

export type TokenHolding = {
    mint: string;
    symbol: string;
    name: string;
    logoURI: string | null;
    balance: number;
    decimals: number;
    usdValue: number;
    price: number;
};

export type PortfolioData = {
    solBalance: number;
    solUsdValue: number;
    tokens: TokenHolding[];
    totalUsdValue: number;
    lastUpdated: number;
};

type HeliusAsset = {
    id: string;
    interface: string;
    content: {
        metadata?: {
            name?: string;
            symbol?: string;
        };
        links?: {
            image?: string;
        };
    };
    token_info?: {
        balance: number;
        decimals: number;
        price_info?: {
            price_per_token: number;
            total_price: number;
        };
    };
};

type HeliusResponse = {
    result?: {
        items: HeliusAsset[];
        nativeBalance?: {
            lamports: number;
            price_per_sol?: number;
            total_price?: number;
        };
    };
};

export async function getPortfolio(walletAddress: string): Promise<PortfolioData> {
    const response = await fetch(CONN_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "portfolio",
            method: "getAssetsByOwner",
            params: {
                ownerAddress: walletAddress,
                displayOptions: {
                    showFungible: true,
                    showNativeBalance: true,
                },
            },
        }),
    });

    const data: HeliusResponse = await response.json();

    if (!data.result) {
        return {
            solBalance: 0,
            solUsdValue: 0,
            tokens: [],
            totalUsdValue: 0,
            lastUpdated: Date.now(),
        };
    }

    const { items, nativeBalance } = data.result;

    // Get SOL balance and value
    const solBalance = (nativeBalance?.lamports || 0) / 1e9;
    const solUsdValue = nativeBalance?.total_price || 0;

    // Process fungible tokens
    const tokens: TokenHolding[] = items
        .filter(
            (item) =>
                item.interface === "FungibleToken" ||
                item.interface === "FungibleAsset"
        )
        .filter((item) => item.token_info && item.token_info.balance > 0)
        .map((item) => {
            const balance = item.token_info!.balance / Math.pow(10, item.token_info!.decimals);
            const price = item.token_info?.price_info?.price_per_token || 0;
            const usdValue = item.token_info?.price_info?.total_price || 0;

            return {
                mint: item.id,
                symbol: item.content?.metadata?.symbol || "???",
                name: item.content?.metadata?.name || "Unknown Token",
                logoURI: item.content?.links?.image || null,
                balance,
                decimals: item.token_info!.decimals,
                usdValue,
                price,
            };
        })
        .filter((token) => token.usdValue > 0.01) // Filter dust
        .sort((a, b) => b.usdValue - a.usdValue); // Sort by value

    const totalTokenValue = tokens.reduce((sum, t) => sum + t.usdValue, 0);
    const totalUsdValue = solUsdValue + totalTokenValue;

    return {
        solBalance,
        solUsdValue,
        tokens,
        totalUsdValue,
        lastUpdated: Date.now(),
    };
}

export function formatUsd(value: number): string {
    if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(2)}K`;
    }
    if (value >= 1) {
        return `$${value.toFixed(2)}`;
    }
    return `$${value.toFixed(4)}`;
}

export function formatBalance(value: number): string {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(2)}K`;
    }
    if (value >= 1) {
        return value.toFixed(2);
    }
    return value.toFixed(4);
}
