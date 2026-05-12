import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        TURSO_DAS_URL: process.env.TURSO_DAS_URL ? "set:" + process.env.TURSO_DAS_URL.slice(0, 30) : "MISSING",
        TURSO_DAS_TOKEN: process.env.TURSO_DAS_TOKEN ? "set:" + process.env.TURSO_DAS_TOKEN.slice(0, 20) : "MISSING",
        TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "set:" + process.env.TURSO_DATABASE_URL.slice(0, 30) : "MISSING",
        TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "set:" + process.env.TURSO_AUTH_TOKEN.slice(0, 20) : "MISSING",
    });
}
