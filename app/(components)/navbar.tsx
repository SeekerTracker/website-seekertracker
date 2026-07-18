"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./navbar.module.css";
import { useDataContext } from "app/(utils)/context/dataProvider";
import { useJupiter } from "app/(utils)/context/jupiterProvider";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SEEKER_TOKEN_ADDRESS } from "app/(utils)/constant";

export const socialMediaLinks = [
  {
    name: "GetApp",
    title: "Download Mobile App",
    url: "/getdapp",
    icon: "/sds-badge.svg",
    clickToCopy: false,
    internal: true,
  },
  {
    name: "Bags",
    title: "Bags Token Analytics",
    url: `https://bags.fm/${SEEKER_TOKEN_ADDRESS}`,
    icon: "/icons/bags-icon.png",
    clickToCopy: false,
  },
  {
    name: "Token",
    title: "Copy Token Address",
    url: SEEKER_TOKEN_ADDRESS,
    icon: "/icons/token.png",
    clickToCopy: true,
  },
  {
    name: "RugCheck",
    title: "RugCheck",
    url: `https://rugcheck.xyz/tokens/${SEEKER_TOKEN_ADDRESS}`,
    icon: "/icons/rugcheck.png",
  },
  {
    name: "DexScreener",
    title: "DexScreener",
    url: `https://dexscreener.com/solana/${SEEKER_TOKEN_ADDRESS}`,
    icon: "/icons/dexscreener.png",
  },
  {
    name: "Telegram",
    title: "Telegram",
    url: "https://t.me/seeker_tracker",
    icon: "/icons/tg.png",
  },
  {
    name: "Twitter",
    title: "X / Twitter",
    url: "https://x.com/Seeker_Tracker",
    icon: "/icons/x.png",
  },
];

const NAV = [
  { href: "/skr", label: "SKR" },
  { href: "/das", label: "DAS" },
  { href: "/activations", label: "Activations" },
  { href: "/sweep", label: "Sweep" },
  { href: "/apps", label: "Apps" },
  { href: "/winners", label: "Winners" },
  { href: "/competitors", label: "Competitors" },
  { href: "/snake", label: "Snake" },
] as const;

function navClass(pathname: string, href: string) {
  const active =
    pathname === href ||
    pathname.startsWith(href + "/") ||
    (href === "/apps" && pathname.startsWith("/dapps"));
  return `${styles.navLink}${active ? ` ${styles.navLinkActive}` : ""}`;
}

const Navbar = () => {
  const { solPrice, backendHealth, live, seekerData } = useDataContext();
  const { openJupiter, isJupiterReady } = useJupiter();
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [skrPrice, setSkrPrice] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchSkrPrice = async () => {
      try {
        const response = await fetch("/api/skr/vault");
        if (response.ok) {
          const data = await response.json();
          setSkrPrice(data.skrPrice);
        }
      } catch (err) {
        console.error("Failed to fetch SKR price:", err);
      }
    };
    fetchSkrPrice();
    const interval = setInterval(fetchSkrPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleCopy = async (name: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedName(name);
      setTimeout(() => setCopiedName(null), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const renderNav = (keyPrefix: string) => (
    <>
      {NAV.map((item) => (
        <Link
          key={`${keyPrefix}-${item.href}`}
          href={item.href}
          className={navClass(pathname, item.href)}
          onClick={() => setMenuOpen(false)}
        >
          {item.label}
        </Link>
      ))}
      <button
        type="button"
        key={`${keyPrefix}-buy`}
        className={styles.buyButton}
        onClick={() => {
          openJupiter();
          setMenuOpen(false);
        }}
        disabled={!isJupiterReady}
        title="Buy $TRACKER"
      >
        Buy $TRACKER
      </button>
    </>
  );

  return (
    <header className={styles.main} ref={menuRef}>
      <div className={styles.mobileBar}>
        <Link href="/" className={styles.mobileBrand}>
          <Image src="/logo.png" alt="" width={28} height={28} />
          <span>Seeker Tracker</span>
        </Link>
        <div className={styles.mobileRight}>
          <div
            className={`${styles.liveButton} ${live ? styles.live : styles.offline}`}
          >
            <div className={styles.dot} />
            <span>{live ? "Live" : "Offline"}</span>
          </div>
          <button
            type="button"
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}
      >
        <div className={styles.mobileMenuPrices}>
          <Link
            href="https://jup.ag/tokens/So11111111111111111111111111111111111111112?ref=yfgv2ibxy07v"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.priceLink}
          >
            SOL <strong>${solPrice.toFixed(2)}</strong>
          </Link>
          {skrPrice !== null && (
            <Link
              href="https://jup.ag/tokens/SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3?ref=yfgv2ibxy07v"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.priceLink}
            >
              SKR <strong>${skrPrice.toFixed(6)}</strong>
            </Link>
          )}
        </div>
        <nav className={styles.mobileNavLinks} aria-label="Primary">
          {renderNav("m")}
        </nav>
      </div>

      <div className={styles.priceInfo}>
        <Link
          href="https://jup.ag/tokens/So11111111111111111111111111111111111111112?ref=yfgv2ibxy07v"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.priceLink}
        >
          <span>
            SOL <strong>${solPrice.toFixed(2)}</strong>
          </span>
        </Link>
        {skrPrice !== null && (
          <Link
            href="https://jup.ag/tokens/SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3?ref=yfgv2ibxy07v"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.priceLink}
          >
            <span>
              SKR <strong>${skrPrice.toFixed(6)}</strong>
            </span>
          </Link>
        )}
        <Link
          href={`https://jup.ag/tokens/${SEEKER_TOKEN_ADDRESS}?ref=yfgv2ibxy07v`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.priceLink}
        >
          <span>
            $TRACKER 24h <strong>${seekerData.token24hVol}</strong>
          </span>
        </Link>
      </div>

      <nav className={styles.navButtons} aria-label="Primary">
        {renderNav("d")}
      </nav>

      <div className={styles.socialMediaTab}>
        <div
          className={`${styles.liveButton} ${live ? styles.live : styles.offline}`}
          title={backendHealth ? "Systems healthy" : "Systems degraded"}
        >
          <div className={styles.dot} />
          <span>{live ? "Live" : "Offline"}</span>
        </div>

        <div className={styles.socialLinks}>
          {socialMediaLinks.map((link) => {
            const isCopied = copiedName === link.name;

            if (link.clickToCopy) {
              return (
                <button
                  type="button"
                  key={link.name}
                  className={styles.socialLink}
                  onClick={() => handleCopy(link.name, link.url)}
                  title={isCopied ? "Copied" : link.title}
                >
                  {isCopied ? (
                    <span className={styles.checkIcon} aria-hidden>
                      ✓
                    </span>
                  ) : (
                    <Image
                      src={link.icon}
                      alt=""
                      width={24}
                      height={24}
                    />
                  )}
                  <span className={styles.hoverName}>{link.title}</span>
                </button>
              );
            }

            return (
              <div key={link.name} className={styles.socialLink}>
                <Link
                  href={link.url}
                  {...(link.internal
                    ? {}
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  title={link.title}
                >
                  <Image src={link.icon} alt="" width={24} height={24} />
                  <span className={styles.hoverName}>{link.title}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
