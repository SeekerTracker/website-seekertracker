import React from "react";
import ExportPage from "./ExportPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "https://seekertracker.com/export" },
    title: "Export SKR List",
    description: "Download CSV export of all SeekerID holders",
};

export default function Page() {
    return <ExportPage />;
}
