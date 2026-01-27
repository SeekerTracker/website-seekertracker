import { NextResponse } from "next/server";

const TRACKER_TOKEN = "ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS";
const HELIUS_RPC = "https://mainnet.helius-rpc.com/?api-key=38d87a91-14f5-45fa-b517-09d7c89ace29";
const MIN_BALANCE = 1_000_000;
const MAX_BALANCE = 20_000_000;
const TOKEN_DECIMALS = 9;

interface TokenAccount {
    address: string;
    amount: number;
    owner: string;
}

interface Contestant {
    wallet: string;
    balance: number;
    eligible: boolean;
}

export async function GET() {
    try {
        // Use Helius getTokenAccounts to fetch all holders
        let allAccounts: TokenAccount[] = [];
        let cursor: string | undefined;

        // Paginate through all token accounts
        do {
            const body: {
                jsonrpc: string;
                id: string;
                method: string;
                params: {
                    mint: string;
                    limit: number;
                    cursor?: string;
                };
            } = {
                jsonrpc: "2.0",
                id: "sweep-contestants",
                method: "getTokenAccounts",
                params: {
                    mint: TRACKER_TOKEN,
                    limit: 1000,
                },
            };

            if (cursor) {
                body.params.cursor = cursor;
            }

            const response = await fetch(HELIUS_RPC, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`Helius API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.result?.token_accounts) {
                allAccounts = allAccounts.concat(data.result.token_accounts);
            }

            cursor = data.result?.cursor;
        } while (cursor);

        // Filter and format contestants
        const contestants: Contestant[] = allAccounts
            .map((account) => {
                const balance = account.amount / Math.pow(10, TOKEN_DECIMALS);
                return {
                    wallet: account.owner,
                    balance,
                    eligible: balance >= MIN_BALANCE && balance <= MAX_BALANCE,
                };
            })
            .filter((c) => c.balance >= MIN_BALANCE && c.balance <= MAX_BALANCE)
            .sort((a, b) => b.balance - a.balance);

        // Calculate stats
        const totalEligible = contestants.length;
        const totalBalance = contestants.reduce((sum, c) => sum + c.balance, 0);

        return NextResponse.json({
            success: true,
            contestants,
            stats: {
                totalEligible,
                totalBalance,
                minRequired: MIN_BALANCE,
                maxCounted: MAX_BALANCE,
            },
            lastUpdated: Date.now(),
        });
    } catch (error) {
        console.error("Sweep contestants API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch contestants", details: String(error) },
            { status: 500 }
        );
    }
}
