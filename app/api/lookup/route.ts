import { NextRequest, NextResponse } from "next/server";

const BE_URL = "https://api.seeker.solana.charity";

type DomainInfo = {
    domain: string;
    subdomain: string;
    owner: string;
    created_at: string;
    rank: string;
};

export async function GET(request: NextRequest) {
    const wallet = request.nextUrl.searchParams.get("wallet");

    if (!wallet) {
        return NextResponse.json(
            { error: "Missing wallet parameter" },
            { status: 400 }
        );
    }

    // Basic wallet validation (Solana addresses are 32-44 chars base58)
    if (wallet.length < 32 || wallet.length > 44) {
        return NextResponse.json(
            { error: "Invalid wallet address format" },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(`${BE_URL}/allDomains`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageSize: 200000 }),
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch domains" },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.data)) {
            return NextResponse.json(
                { error: "Invalid response from domain service" },
                { status: 502 }
            );
        }

        // Find all domains owned by this wallet
        const domains = (data.data as DomainInfo[])
            .filter(d => d.owner === wallet)
            .map(d => ({
                subdomain: d.subdomain,
                domain: d.domain || ".skr",
                createdAt: d.created_at,
                rank: d.rank
            }))
            .sort((a, b) => a.subdomain.length - b.subdomain.length); // Shorter names first

        return NextResponse.json({
            success: true,
            wallet,
            domains,
            count: domains.length
        });
    } catch (error) {
        console.error("Lookup API error:", error);
        return NextResponse.json(
            { error: "Failed to lookup wallet" },
            { status: 500 }
        );
    }
}
