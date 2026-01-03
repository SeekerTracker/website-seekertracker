import React from "react";
import ExportPage from "./ExportPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Export SeekerIDs - Seeker Tracker",
    description: "Download CSV export of all SeekerID holders",
};

export default function Page() {
    return <ExportPage />;
}
