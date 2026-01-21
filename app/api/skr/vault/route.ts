import { NextResponse } from "next/server";
import { getPortfolio } from "app/(utils)/lib/portfolio";
import { CONN_RPC_URL } from "app/(utils)/constant";

const VAULT_ADDRESS = "CYPdPHMh1mD6ioFFVva7L2rFeKLBpcefVv5yv1p6iRqB";
const STAKED_VAULT_ADDRESS = "4HQy82s9CHTv1GsYKnANHMiHfhcqesYkK6sB3RDSYyqw";
const SKR_TOKEN_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

async function getTokenSupply(): Promise<number> {
    try {
        const response = await fetch(CONN_RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "token-supply",
                method: "getTokenSupply",
                params: [SKR_TOKEN_MINT],
            }),
        });
        const data = await response.json();
        if (data.result?.value) {
            const { amount, decimals } = data.result.value;
            return Number(amount) / Math.pow(10, decimals);
        }
        return 0;
    } catch (error) {
        console.error("Failed to fetch token supply:", error);
        return 0;
    }
}

async function getTotalHolders(): Promise<number> {
    try {
        const response = await fetch(CONN_RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "token-holders",
                method: "getTokenAccounts",
                params: {
                    mint: SKR_TOKEN_MINT,
                    limit: 1,
                    options: { showZeroBalance: false },
                },
            }),
        });
        const data = await response.json();
        return data.result?.total || 0;
    } catch (error) {
        console.error("Failed to fetch token holders:", error);
        return 0;
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
