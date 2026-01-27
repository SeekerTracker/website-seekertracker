import { NextResponse } from "next/server";
import { CONN_RPC_URL } from "../../../(utils)/constant";

const PRIZE_WALLET = "snkTEcbUVW5EURccMjBo1YDfW8M8uDZ4b8Li9yeNXsq";
const TRACKER_TOKEN = "ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS";

export async function GET() {
    try {
        const response = await fetch(CONN_RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "snake-prize",
                method: "getAssetsByOwner",
                params: {
                    ownerAddress: PRIZE_WALLET,
                    displayOptions: {
                        showFungible: true,
                        showNativeBalance: true,
                    },
                },
            }),
            next: { revalidate: 60 },
        });

        const data = await response.json();

        if (!data.result) {
            return NextResponse.json({ trackerBalance: 0, solBalance: 0 });
        }

        const { items, nativeBalance } = data.result;
        const solBalance = (nativeBalance?.lamports || 0) / 1e9;

        // Find TRACKER token
        const trackerToken = items?.find(
            (item: { id: string; token_info?: { balance: number; decimals: number } }) =>
                item.id === TRACKER_TOKEN
        );

        const trackerBalance = trackerToken?.token_info
            ? trackerToken.token_info.balance / Math.pow(10, trackerToken.token_info.decimals)
            : 0;

        return NextResponse.json({
            trackerBalance,
            solBalance,
            wallet: PRIZE_WALLET,
        });
    } catch (error) {
        console.error("Snake prize API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch prize pool" },
            { status: 500 }
        );
    }
}
