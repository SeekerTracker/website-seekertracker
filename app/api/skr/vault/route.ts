import { NextResponse } from "next/server";
import { getPortfolio } from "app/(utils)/lib/portfolio";
import { CONN_RPC_URL } from "app/(utils)/constant";

const VAULT_ADDRESS = "CYPdPHMh1mD6ioFFVva7L2rFeKLBpcefVv5yv1p6iRqB";
const STAKED_VAULT_ADDRESS = "4HQy82s9CHTv1GsYKnANHMiHfhcqesYkK6sB3RDSYyqw";
const SKR_TOKEN_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

async function getTokenSupply(): Promise<number> {
    try {
        // Use metasal API for faster supply fetch
        const response = await fetch(`https://api.metasal.xyz/api/supply/${SKR_TOKEN_MINT}`, {
            headers: { "Accept": "text/plain" },
        });
        if (response.ok) {
            const text = await response.text();
            const supply = parseFloat(text);
            if (!isNaN(supply)) return supply;
        }
        return 0;
    } catch (error) {
        console.error("Failed to fetch token supply:", error);
        return 0;
    }
}

async function getHeliusPageCount(page: number): Promise<number> {
    const response = await fetch(CONN_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "token-holders",
            method: "getTokenAccounts",
            params: {
                mint: SKR_TOKEN_MINT,
                page,
                limit: 1000,
            },
        }),
    });
    const data = await response.json();
    return data.result?.token_accounts?.length || 0;
}

// Cache for holder count
let cachedHolderCount = 0;
let lastHolderUpdate = 0;
const HOLDER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function getTotalHolders(): Promise<number> {
    // Return cached value if fresh
    if (cachedHolderCount > 0 && Date.now() - lastHolderUpdate < HOLDER_CACHE_DURATION) {
        return cachedHolderCount;
    }

    try {
        // Check pages 10, 20, 30, 40, 50 in parallel to find range
        const checkPages = [10, 20, 30, 40, 50];
        const results = await Promise.all(checkPages.map(p => getHeliusPageCount(p)));

        // Find the last page with results
        let lastFullPage = 0;
        let lastPageWithData = 0;
        for (let i = 0; i < results.length; i++) {
            if (results[i] > 0) {
                lastPageWithData = checkPages[i];
                if (results[i] === 1000) {
                    lastFullPage = checkPages[i];
                }
            }
        }

        // If we found a partial page, calculate
        if (lastPageWithData > 0 && results[checkPages.indexOf(lastPageWithData)] < 1000) {
            const partialCount = results[checkPages.indexOf(lastPageWithData)];
            cachedHolderCount = (lastPageWithData - 1) * 1000 + partialCount;
        } else if (lastFullPage > 0) {
            // Binary search between lastFullPage and next checkpoint
            const nextCheck = checkPages[checkPages.indexOf(lastFullPage) + 1] || lastFullPage + 10;
            for (let p = lastFullPage + 1; p <= nextCheck; p++) {
                const count = await getHeliusPageCount(p);
                if (count < 1000) {
                    cachedHolderCount = (p - 1) * 1000 + count;
                    break;
                }
            }
            if (cachedHolderCount === 0) {
                cachedHolderCount = lastFullPage * 1000;
            }
        } else {
            // Less than 10k holders
            const p1 = await getHeliusPageCount(1);
            cachedHolderCount = p1;
        }

        lastHolderUpdate = Date.now();
        return cachedHolderCount;
    } catch (error) {
        console.error("Failed to fetch token holders:", error);
        return cachedHolderCount || 0;
    }
}

export async function GET() {
    try {
        const [vaultPortfolio, stakedPortfolio, totalSupply, totalHolders] = await Promise.all([
            getPortfolio(VAULT_ADDRESS),
            getPortfolio(STAKED_VAULT_ADDRESS),
            getTokenSupply(),
            getTotalHolders(),
        ]);

        // Find SKR token in both portfolios
        const vaultSkr = vaultPortfolio.tokens.find(t => t.mint === SKR_TOKEN_MINT);
        const stakedSkr = stakedPortfolio.tokens.find(t => t.mint === SKR_TOKEN_MINT);

        const skrPrice = vaultSkr?.price || stakedSkr?.price || 0;
        const marketCap = totalSupply * skrPrice;

        return NextResponse.json({
            success: true,
            skrMint: SKR_TOKEN_MINT,
            skrPrice,
            totalSupply,
            totalHolders,
            marketCap,
            vault: {
                address: VAULT_ADDRESS,
                skrBalance: vaultSkr?.balance || 0,
                skrUsdValue: vaultSkr?.usdValue || 0,
            },
            stakedVault: {
                address: STAKED_VAULT_ADDRESS,
                skrBalance: stakedSkr?.balance || 0,
                skrUsdValue: stakedSkr?.usdValue || 0,
            },
            lastUpdated: Date.now(),
        });
    } catch (error) {
        console.error("Vault API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch vault balance" },
            { status: 500 }
        );
    }
}
