import type { Metadata } from "next";
import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import {
  PUBLIC_ENDPOINTS,
  SITE_ORIGIN,
} from "app/(utils)/lib/publicApi";
import styles from "./page.module.css";

const TITLE = "Seeker Tracker API for agents";
const DESCRIPTION =
  "Public JSON APIs for .skr domains, Seeker dApps, SKR stats, and prices. llms.txt, OpenAPI, open CORS. No auth for reads.";
const URL = `${SITE_ORIGIN}/developers`;
// Absolute /api OG URL — never collides with /image/{domain} or dynamic routes
const OG_IMAGE = `${SITE_ORIGIN}/api/og/developers`;

export const metadata: Metadata = {
  // absolute: avoid layout template lengthening the share title
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: "SeekerTracker",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Seeker Tracker Public API for agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@seeker_tracker",
    site: "@Seeker_Tracker",
    images: [OG_IMAGE],
  },
};

export default function DevelopersPage() {
  return (
    <div className={styles.main}>
      <Backbutton />
      <header className={styles.header}>
        <p className={styles.eyebrow}>API-first</p>
        <h1 className={styles.title}>Developers and agents</h1>
        <p className={styles.lead}>
          Use public JSON APIs for SeekerIDs, dApps, prices, and SKR data.
          Prefer these endpoints over HTML scraping.
        </p>
        <div className={styles.links}>
          <a href="/llms.txt" className={styles.primary}>
            llms.txt
          </a>
          <a href="/api" className={styles.secondary}>
            /api index
          </a>
          <a href="/openapi.json" className={styles.secondary}>
            OpenAPI
          </a>
        </div>
      </header>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Policy</h2>
        <ul className={styles.list}>
          <li>
            <strong>Auth:</strong> none for public read endpoints below
          </li>
          <li>
            <strong>CORS:</strong> open on public read paths (no credentials)
          </li>
          <li>
            <strong>Rate limits:</strong> be polite; cache responses; avoid{" "}
            <code>?refresh=1</code> spam
          </li>
          <li>
            <strong>HTML:</strong> product UI for humans; agents should call JSON
          </li>
        </ul>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Quick start</h2>
        <pre className={styles.code}>{`curl -sS ${SITE_ORIGIN}/api/health
curl -sS ${SITE_ORIGIN}/api/price
curl -sS '${SITE_ORIGIN}/api/domains?page=1&pageSize=20'
curl -sS '${SITE_ORIGIN}/api/domain?domain=metasal.skr'
curl -sS '${SITE_ORIGIN}/api/dappstore?package=com.seekertracker'
curl -sS ${SITE_ORIGIN}/api/skr/vault`}</pre>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Public endpoints</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Methods</th>
                <th>Path</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {PUBLIC_ENDPOINTS.map((e) => (
                <tr key={e.path + e.methods.join()}>
                  <td>
                    <code>{e.methods.join(", ")}</code>
                  </td>
                  <td>
                    <code>{e.path}</code>
                    {e.example ? (
                      <div className={styles.example}>{e.example}</div>
                    ) : null}
                  </td>
                  <td>{e.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Human pages</h2>
        <ul className={styles.list}>
          <li>
            <Link href="/apps">/apps</Link> — dApp catalog
          </li>
          <li>
            <code>/apps/{"{package}"}</code> — dApp detail
          </li>
          <li>
            <code>/id/{"{name.skr}"}</code> — domain profile
          </li>
          <li>
            <Link href="/skr">/skr</Link> — SKR stats UI
          </li>
        </ul>
      </section>
    </div>
  );
}
