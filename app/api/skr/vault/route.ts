import { NextResponse } from "next/server";
import { getPortfolio } from "app/(utils)/lib/portfolio";

const VAULT_ADDRESS = "CYPdPHMh1mD6ioFFVva7L2rFeKLBpcefVv5yv1p6iRqB";
const SKR_TOKEN_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

export async function GET() {
    try {
        const portfolio = await getPortfolio(VAULT_ADDRESS);

        // Find SKR token in portfolio
        const skrToken = portfolio.tokens.find(t => t.mint === SKR_TOKEN_MINT);

        return NextResponse.json({
            success: true,
            vault: VAULT_ADDRESS,
            skrMint: SKR_TOKEN_MINT,
            skrBalance: skrToken?.balance || 0,
            skrUsdValue: skrToken?.usdValue || 0,
            skrPrice: skrToken?.price || 0,
            lastUpdated: portfolio.lastUpdated,
        });
    } catch (error) {
        console.error("Vault API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch vault balance" },
            { status: 500 }
        );
    }
}
