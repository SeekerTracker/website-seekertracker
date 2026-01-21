import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch("https://api.metasal.xyz/api/summary", {
            headers: { accept: "application/json" },
            next: { revalidate: 300 }, // 5 min cache
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch summary" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Summary API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
