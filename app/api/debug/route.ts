import { NextResponse } from "next/server";

export async function GET() {
    const url = process.env.TURSO_DATABASE_URL ?? "";
    const token = process.env.TURSO_AUTH_TOKEN ?? "";
    const httpUrl = url.startsWith("libsql://") ? url.replace("libsql://", "https://") : url;

    const envCheck = { urlSet: !!url, tokenSet: !!token, httpUrl };

    let tursoResult: unknown = null;
    let tursoError: string | null = null;
    try {
        const res = await fetch(httpUrl, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ statements: [{ q: "SELECT COUNT(*) FROM seeker_usage", params: [] }] }),
        });
        tursoResult = await res.json();
    } catch (e) {
        tursoError = String(e);
    }

    return NextResponse.json({ envCheck, tursoResult, tursoError });
}
