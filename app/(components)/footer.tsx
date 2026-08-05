"use client";

import React, { useState } from "react";
import styles from "./footer.module.css";
import { socialMediaLinks } from "./navbar";
import Image from "next/image";
import Link from "next/link";
import { SEEKER_TOKEN_ADDRESS } from "app/(utils)/constant";

const PARTNERS = [
  {
    label: "Launched on",
    href: "https://bags.fm/$SEEKER_TRACKER",
    src: "/icons/bags-icon.png",
    alt: "Bags",
  },
  {
    label: "RPC by",
    href: "https://helius.xyz",
    src: "/icons/helius.png",
    alt: "Helius",
  },
  {
    label: "Domains by",
    href: "https://alldomains.id/?ref=hmKOC9",
    src: "/icons/alldomain.webp",
    alt: "AllDomains",
  },
] as const;

const LEGAL = [
  { href: "/whitepaper", label: "Whitepaper" },
  { href: "/brand", label: "Brand" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/license", label: "License" },
  { href: "/copyright", label: "Copyright" },
  { href: "/getdapp", label: "Get App" },
] as const;

function shortCa(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

const Footer = () => {
  const [copied, setCopied] = useState(false);

  const copyCa = async () => {
    try {
      await navigator.clipboard.writeText(SEEKER_TOKEN_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <footer className={styles.footer}>
      {/* Download — quiet strip, not a hero band */}
      <div className={styles.download}>
        <div className={styles.downloadInner}>
          <div className={styles.downloadCopy}>
            <span className={styles.downloadEyebrow}>Seeker Tracker</span>
            <p className={styles.downloadTitle}>Get the app</p>
          </div>
          <div className={styles.badgeRow}>
            <Link
              href="/dapps/com.seekertracker"
              className={styles.downloadBadge}
              aria-label="Get Seeker Tracker on Solana dApp Store"
            >
              <Image
                src="/sds-badge.svg"
                alt="Get it on Solana dApp Store"
                width={160}
                height={62}
                priority={false}
              />
            </Link>
            <a
              href="https://play.google.com/store/apps/details?id=com.seekertracker"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadBadge}
              aria-label="Get Seeker Tracker on Google Play"
            >
              <Image
                src="/badges/google-play.svg"
                alt="Get it on Google Play"
                width={160}
                height={48}
              />
            </a>
            <a
              href="https://apps.apple.com/us/search?term=Solana%20Mobile%20Seeker"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadBadge}
              aria-label="Download on the App Store"
            >
              <Image
                src="/badges/app-store.svg"
                alt="Download on the App Store"
                width={160}
                height={48}
              />
            </a>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Partners */}
        <ul className={styles.partners} aria-label="Partners">
          {PARTNERS.map((p) => (
            <li key={p.alt}>
              <Link
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.partner}
              >
                <span className={styles.partnerLabel}>{p.label}</span>
                <Image src={p.src} alt={p.alt} width={28} height={28} />
              </Link>
            </li>
          ))}
        </ul>

        {/* Social */}
        <nav className={styles.social} aria-label="Social links">
          {socialMediaLinks.map((link) => (
            <Link
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              title={link.title}
              aria-label={link.title}
            >
              <Image src={link.icon} alt="" width={18} height={18} aria-hidden />
            </Link>
          ))}
        </nav>

        {/* Meta: note, CA, legal */}
        <div className={styles.meta}>
          <p className={styles.note}>
            Regional activity uses UTC timestamps of .skr SeekerID registrations.
          </p>

          <div className={styles.caRow}>
            <span className={styles.copyYear}>© {new Date().getFullYear()} Seeker Tracker</span>
            <span className={styles.dot} aria-hidden>
              ·
            </span>
            <button
              type="button"
              className={styles.ca}
              onClick={copyCa}
              title={copied ? "Copied" : "Copy contract address"}
              aria-label={
                copied
                  ? "Contract address copied"
                  : `Copy contract address ${SEEKER_TOKEN_ADDRESS}`
              }
            >
              <span className={styles.caLabel}>CA</span>
              <code className={styles.caAddr}>
                {copied ? "Copied" : shortCa(SEEKER_TOKEN_ADDRESS)}
              </code>
            </button>
            <span className={styles.dot} aria-hidden>
              ·
            </span>
            <Link
              href="https://milysec.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.madeBy}
              aria-label="Made by Milysec.com"
              title="Made by Milysec.com"
            >
              <Image
                src="/icons/made-by-milysec.png"
                alt="Made by Milysec.com"
                width={114}
                height={36}
                className={styles.madeByImg}
              />
            </Link>
          </div>

          <nav className={styles.legal} aria-label="Legal">
            {LEGAL.map((item, i) => (
              <React.Fragment key={item.href}>
                {i > 0 && (
                  <span className={styles.legalSep} aria-hidden>
                    ·
                  </span>
                )}
                <Link href={item.href}>{item.label}</Link>
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
