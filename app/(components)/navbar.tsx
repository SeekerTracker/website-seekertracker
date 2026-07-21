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
    name: "Telegram",
    title: "Telegram",
    url: "https://t.me/seeker_tracker",
    icon: "/icons/tg.png",
  },
  {
    name: "Twitter",
    title: "X",
    url: "https://x.com/Seeker_Tracker",
    icon: "/icons/x.png",
  },
  {
    name: "DexScreener",
    title: "DexScreener",
    url: `https://dexscreener.com/solana/${SEEKER_TOKEN_ADDRESS}`,
    icon: "/icons/dexscreener.png",
  },
  {
    name: "Bags",
    title: "Bags",
    url: `https://bags.fm/${SEEKER_TOKEN_ADDRESS}`,
    icon: "/icons/bags-icon.png",
  },
];

/** Primary — always visible */
const PRIMARY = [
  { href: "/apps", label: "Apps" },
  { href: "/activations", label: "Activations" },
  { href: "/das", label: "DAS" },
  { href: "/skr", label: "SKR" },
] as const;

/** Secondary — under More */
const MORE = [
  { href: "/sweep", label: "Sweep" },
  { href: "/winners", label: "Winners" },
  { href: "/competitors", label: "Competitors" },
  { href: "/snake", label: "Snake" },
  { href: "/export", label: "Export" },
  { href: "/explore", label: "Explore" },
  { href: "/developers", label: "API" },
] as const;

function isActive(pathname: string, href: string) {
  return (
    pathname === href ||
    pathname.startsWith(href + "/") ||
    (href === "/apps" && pathname.startsWith("/dapps"))
  );
}

function PriceValue({
  loading,
  value,
  digits,
}: {
  loading: boolean;
  value: number;
  digits: number;
}) {
  if (loading && !(value > 0)) {
    return <span className={styles.priceSpinner} aria-label="Loading price" />;
  }
  if (!(value > 0)) {
    return <em className={styles.priceMuted}>—</em>;
  }
  return <em>${value.toFixed(digits)}</em>;
}

const Navbar = () => {
  const { solPrice, skrPrice, pricesLoading, live, seekerData } = useDataContext();
  const { openJupiter, isJupiterReady } = useJupiter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const moreActive = MORE.some((i) => isActive(pathname, i.href));

  const linkClass = (href: string) =>
    `${styles.link}${isActive(pathname, href) ? ` ${styles.linkActive}` : ""}`;

  return (
    <header className={styles.bar} ref={menuRef}>
      {/* Mobile */}
      <div className={styles.mobileRow}>
        <Link href="/" className={styles.brand}>
          <Image src="/logo.png" alt="" width={26} height={26} />
          <span>Seeker Tracker</span>
        </Link>
        <div className={styles.mobileRight}>
          <span
            className={`${styles.status} ${live ? styles.statusLive : styles.statusOff}`}
            title={live ? "Live" : "Offline"}
          >
            <span className={styles.statusDot} />
          </span>
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

      <div className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerPrices}>
          <span>
            SOL{" "}
            <strong>
              {pricesLoading && !(solPrice > 0) ? (
                <span className={styles.priceSpinner} aria-label="Loading price" />
              ) : solPrice > 0 ? (
                `$${solPrice.toFixed(2)}`
              ) : (
                "—"
              )}
            </strong>
          </span>
          <span>
            SKR{" "}
            <strong>
              {pricesLoading && !(skrPrice > 0) ? (
                <span className={styles.priceSpinner} aria-label="Loading price" />
              ) : skrPrice > 0 ? (
                `$${skrPrice.toFixed(6)}`
              ) : (
                "—"
              )}
            </strong>
          </span>
        </div>
        <nav className={styles.drawerNav} aria-label="Primary">
          {[...PRIMARY, ...MORE].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(item.href)}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            className={styles.buy}
            disabled={!isJupiterReady}
            onClick={() => {
              openJupiter();
              setMenuOpen(false);
            }}
          >
            Buy $TRACKER
          </button>
        </nav>
      </div>

      {/* Desktop */}
      <div className={styles.desktop}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand}>
            <Image src="/logo.png" alt="" width={24} height={24} />
            <span>Seeker Tracker</span>
          </Link>
          <div className={styles.prices} aria-label="Prices">
            <a
              href="https://jup.ag/tokens/So11111111111111111111111111111111111111112?ref=yfgv2ibxy07v"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.price}
            >
              SOL{" "}
              <PriceValue loading={pricesLoading} value={solPrice} digits={2} />
            </a>
            <a
              href="https://jup.ag/tokens/SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3?ref=yfgv2ibxy07v"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.price}
            >
              SKR{" "}
              <PriceValue loading={pricesLoading} value={skrPrice} digits={6} />
            </a>
            <a
              href={`https://jup.ag/tokens/${SEEKER_TOKEN_ADDRESS}?ref=yfgv2ibxy07v`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.price}
            >
              24h <em>${seekerData.token24hVol}</em>
            </a>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Primary">
          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}

          <div className={styles.moreWrap} ref={moreRef}>
            <button
              type="button"
              className={`${styles.link} ${styles.moreBtn}${moreActive || moreOpen ? ` ${styles.linkActive}` : ""}`}
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
            >
              More
              <span className={styles.chev} aria-hidden>
                ▾
              </span>
            </button>
            {moreOpen ? (
              <div className={styles.moreMenu} role="menu">
                {MORE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={linkClass(item.href)}
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className={styles.right}>
          <span
            className={`${styles.status} ${live ? styles.statusLive : styles.statusOff}`}
            title={live ? "Live" : "Offline"}
          >
            <span className={styles.statusDot} />
            <span className={styles.statusText}>{live ? "Live" : "Off"}</span>
          </span>

          <div className={styles.socials}>
            {socialMediaLinks.slice(0, 2).map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.social}
                title={s.title}
              >
                <Image src={s.icon} alt="" width={16} height={16} />
              </a>
            ))}
          </div>

          <button
            type="button"
            className={styles.buy}
            onClick={openJupiter}
            disabled={!isJupiterReady}
          >
            Buy $TRACKER
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
