import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Brand — Seeker Tracker",
  description:
    "Seeker Tracker brand system: Seeker Cyan palette, typography, voice, and assets for the Solana Mobile ecosystem explorer.",
  openGraph: {
    title: "Brand — Seeker Tracker",
    description:
      "Seeker Cyan palette, JetBrains Mono, and usage guidelines for seekertracker.com.",
    url: "https://www.seekertracker.com/brand",
  },
  alternates: {
    canonical: "https://www.seekertracker.com/brand",
  },
};

const COLORS = [
  {
    name: "Primary",
    hex: "#00ffd9",
    role: "CTAs, links, key metrics, focus",
  },
  {
    name: "Primary soft",
    hex: "#66ffe8",
    role: "Hover, badges, soft fills",
  },
  {
    name: "Secondary",
    hex: "#00ff66",
    role: "Accent gradient end, success-ish signal",
  },
  {
    name: "BG base",
    hex: "#001a1a",
    role: "Page depth under gradient",
  },
  {
    name: "BG elevated",
    hex: "#0a2a2a",
    role: "Cards, panels, elevated surfaces",
  },
  {
    name: "Foreground",
    hex: "#ededed",
    role: "Body text on dark",
  },
  {
    name: "Muted",
    hex: "#7aa8a8",
    role: "Captions, helper text",
  },
  {
    name: "Danger",
    hex: "#ff8a8a",
    role: "Destructive / unsubscribe",
  },
] as const;

export default function BrandPage() {
  return (
    <div className={styles.main}>
      <Backbutton />

      <header className={styles.hero}>
        <span className={styles.eyebrow}>Brand system · Seeker Cyan</span>
        <h1 className={styles.title}>Seeker Tracker</h1>
        <p className={styles.tagline}>
          The unofficial Solana Mobile ecosystem explorer. Dark teal, electric
          cyan, mono type — built for ranks, SeekerIDs, and dApp data you can
          scan for hours.
        </p>
        <div className={styles.logoRow}>
          <div className={styles.logoFrame}>
            <Image
              src="/logo.png"
              alt="Seeker Tracker logo"
              width={48}
              height={48}
              priority
            />
          </div>
          <div className={styles.logoMeta}>
            <strong>Mark</strong>
            /logo.png · 12px radius on dark
            <br />
            Never claim official Solana Mobile affiliation
          </div>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="palette-heading">
        <h2 id="palette-heading">Palette</h2>
        <p className={styles.sectionLead}>
          Seeker Cyan — formalized from the live product. High-signal primary on
          deep teal bases. Product UI is dark-first.
        </p>
        <div className={styles.swatches}>
          {COLORS.map((c) => (
            <div key={c.hex} className={styles.swatch}>
              <div
                className={styles.swatchChip}
                style={{ background: c.hex }}
                aria-hidden
              />
              <div className={styles.swatchMeta}>
                <p className={styles.swatchName}>{c.name}</p>
                <p className={styles.swatchHex}>{c.hex}</p>
                <p className={styles.swatchRole}>{c.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="grad-heading">
        <h2 id="grad-heading">Gradients</h2>
        <p className={styles.sectionLead}>
          Page atmosphere and CTA energy. Keep accent gradients off long body
          text.
        </p>
        <div className={styles.gradRow}>
          <div className={styles.gradCard}>
            <div
              className={styles.gradPreview}
              style={{
                background:
                  "linear-gradient(135deg, #003333 0%, #001a1a 50%, #000000 100%)",
              }}
            />
            <div className={styles.gradMeta}>
              <strong>Background</strong>
              135deg · #003333 → #001a1a → #000 · page shell
            </div>
          </div>
          <div className={styles.gradCard}>
            <div
              className={styles.gradPreview}
              style={{
                background:
                  "linear-gradient(135deg, #00ffd9 0%, #00ff66 50%, #00e6c0 100%)",
              }}
            />
            <div className={styles.gradMeta}>
              <strong>Accent</strong>
              #00ffd9 → #00ff66 → #00e6c0 · CTAs, titles, badges
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="type-heading">
        <h2 id="type-heading">Typography</h2>
        <p className={styles.sectionLead}>
          JetBrains Mono everywhere — terminal clarity for ranks, wallets, and
          package IDs.
        </p>
        <div className={styles.typeSample}>
          <p className={styles.typeDisplay}>metasal.skr</p>
          <p className={styles.typeBody}>
            Search and track .skr SeekerIDs, on-chain activity, apps, and
            analytics. Prefer short sentences, exact product names, and numbers
            you can trust.
          </p>
          <p className={styles.typeCaption}>Section label · uppercase · cyan</p>
          <p className={styles.typeMono}>Rank #120,482 · Total 120,482</p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="ui-heading">
        <h2 id="ui-heading">UI sample</h2>
        <p className={styles.sectionLead}>
          Same language as email, unsubscribe, and product dashboards.
        </p>
        <div className={styles.uiPreview}>
          <div className={styles.card}>
            <p className={styles.cardLabel}>Indexed SeekerIDs</p>
            <p className={styles.cardValue}>120,482</p>
            <p className={styles.cardSub}>max(row count, max rank) · Turso</p>
            <div className={styles.btnRow}>
              <span className={styles.btnPrimary}>Explore apps</span>
              <span className={styles.btnSecondary}>Lookup .skr</span>
            </div>
          </div>
          <div className={styles.card}>
            <p className={styles.cardLabel}>Active dApps</p>
            <p className={styles.cardValue}>1,173</p>
            <p className={styles.cardSub}>Solana Mobile store catalog</p>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="voice-heading">
        <h2 id="voice-heading">Voice</h2>
        <p className={styles.sectionLead}>
          Builder-first. No fluff. On-chain precise. Unofficial but serious.
        </p>
        <div className={styles.rules}>
          <div className={`${styles.ruleCard} ${styles.do}`}>
            <h3>Do</h3>
            <ul>
              <li>Lead with ranks, counts, and working links</li>
              <li>Say SeekerID, .skr, Solana Mobile, dApp Store</li>
              <li>Cyan for action; muted for meta</li>
              <li>Tabular numbers for ranks and totals</li>
            </ul>
          </div>
          <div className={`${styles.ruleCard} ${styles.dont}`}>
            <h3>Don&apos;t</h3>
            <ul>
              <li>Claim official Solana Mobile status</li>
              <li>Use sol.new purple/orange on this product</li>
              <li>Hashtags in product or marketing copy</li>
              <li>Emoji in product UI (Telegram templates OK)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="assets-heading">
        <h2 id="assets-heading">Assets &amp; links</h2>
        <p className={styles.sectionLead}>
          Production paths and related surfaces.
        </p>
        <div className={styles.links}>
          <Link className={styles.linkChip} href="/logo.png">
            Logo PNG
          </Link>
          <Link className={styles.linkChip} href="/unsubscribe">
            Email preferences
          </Link>
          <Link className={styles.linkChip} href="/dapps">
            dApp catalog
          </Link>
          <Link className={styles.linkChip} href="/privacy">
            Privacy
          </Link>
          <a
            className={styles.linkChip}
            href="https://t.me/Seeker_Tracker"
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram
          </a>
        </div>
      </section>

      <p className={styles.footerNote}>
        Source of truth for agents and humans:{" "}
        <code>brand.md</code> in the website repo. Email templates live under{" "}
        <code>emails/</code>. Resend from{" "}
        <code>noreply@seekertracker.com</code>.{" "}
        <Link href="/">Back to seekertracker.com</Link>
      </p>
    </div>
  );
}
