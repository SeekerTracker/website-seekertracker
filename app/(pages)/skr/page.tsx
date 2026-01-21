import React, { Suspense } from "react";
import SkrPage from "./SkrPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "SKR Allocation Checker - Seeker Tracker",
    description: "Check your SKR token allocation by .skr domain or wallet address",
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SkrPage />
        </Suspense>
    );
}
