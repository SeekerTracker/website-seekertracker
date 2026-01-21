import { NextResponse } from "next/server";
import { getPortfolio } from "app/(utils)/lib/portfolio";

const VAULT_ADDRESS = "CYPdPHMh1mD6ioFFVva7L2rFeKLBpcefVv5yv1p6iRqB";
const STAKED_VAULT_ADDRESS = "4HQy82s9CHTv1GsYKnANHMiHfhcqesYkK6sB3RDSYyqw";
const SKR_TOKEN_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

export async function GET() {
    try {
        const [vaultPortfolio, stakedPortfolio] = await Promise.all([
            getPortfolio(VAULT_ADDRESS),
            getPortfolio(STAKED_VAULT_ADDRESS),
        ]);

        // Find SKR token in both portfolios
        const vaultSkr = vaultPortfolio.tokens.find(t => t.mint === SKR_TOKEN_MINT);
        const stakedSkr = stakedPortfolio.tokens.find(t => t.mint === SKR_TOKEN_MINT);

        return NextResponse.json({
            success: true,
            skrMint: SKR_TOKEN_MINT,
            skrPrice: vaultSkr?.price || stakedSkr?.price || 0,
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
