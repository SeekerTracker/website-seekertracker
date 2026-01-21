import { NextResponse } from "next/server";
import { CONN_RPC_URL } from "app/(utils)/constant";

const STAKING_PROGRAM_ID = "SKRskrmtL83pcL4YqLWt6iPefDqwXQWHSw9S9vz94BZ";

export async function GET() {
    try {
        const response = await fetch(CONN_RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getProgramAccounts",
                params: [
                    STAKING_PROGRAM_ID,
                    {
                        encoding: "base64",
                        dataSlice: { offset: 0, length: 0 },
                    },
                ],
            }),
        });

        const data = await response.json();
        const stakerCount = data.result?.length || 0;

        return NextResponse.json({
            success: true,
            programId: STAKING_PROGRAM_ID,
            stakerCount,
            lastUpdated: Date.now(),
        });
    } catch (error) {
        console.error("Stakers API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch staker count" },
            { status: 500 }
        );
    }
}
