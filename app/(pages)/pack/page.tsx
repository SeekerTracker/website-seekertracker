import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Pack demo",
};

/** Internal pack demo — not a product page */
export default function PackDemoPage() {
  redirect("/");
}
