"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import { useWalletContext } from "app/(utils)/context/walletProvider";
import { useAccount, useConnector } from "@solana/connector/react";
import { useJupiter } from "app/(utils)/context/jupiterProvider";
import {
  SEEKER_TOKEN_ADDRESS,
  JUP_REFERRAL,
} from "app/(utils)/constant";

const PRIZE_WALLET = "snkTEcbUVW5EURccMjBo1YDfW8M8uDZ4b8Li9yeNXsq";
const TRACKER_MINT = SEEKER_TOKEN_ADDRESS;
const DEFAULT_REQUIRED_TRACKER = 1_000_000;
const SNAKE_DAPP = "com.snakeseeker";
const SNAKE_DAPP_URL = `/dapps/${SNAKE_DAPP}`;
const SNAKE_SDS_URL =
  "https://solanamobiledappstore.com/09P8VQ98WIf4Xb2-5f2kGX2TjEj2XthTgHoAEZY2puk";
const APK_URL =
  "https://arweave.net/H9PSe13l-zFtQdsW9IEFBzjrJywIH5xiYadPtf1PWlA";
const JUP_BUY_URL = `https://jup.ag/tokens/${SEEKER_TOKEN_ADDRESS}?ref=${JUP_REFERRAL}`;
/** Official iOS listing */
const APP_STORE_URL = "https://apps.apple.com/app/snake-seeker/id6759360443";
/**
 * No Google Play listing for Snake Seeker yet — Play badge falls back to APK.
 * When listed, set e.g. https://play.google.com/store/apps/details?id=...
 */
const PLAY_STORE_URL = APK_URL;

type LeaderboardEntry = {
  wallet: string;
  username: string | null;
  skrId: string | null;
  high_score: number;
  total_plays: number;
  total_score: number;
  trackerBalance?: number;
  skrBalance?: number;
  eligible?: boolean;
};

type GameConfig = {
  min_tracker_balance?: number;
  tokens_per_pill?: number;
  airdrop_enabled?: boolean;
  airdrop_multiplier?: number;
  maintenance_mode?: boolean;
  leaderboard_limit?: number;
};

function displaySkr(entry: LeaderboardEntry): string | null {
  const raw = (entry.skrId || entry.username || "").trim();
  if (!raw) return null;
  // Only treat pure SeekerIDs as .skr (ignore junk like "foo.sol")
  const base = raw.replace(/\.skr$/i, "");
  if (!base || /[^a-z0-9_-]/i.test(base)) return null;
  if (/\.(sol|bonk|abc|poor|glow)$/i.test(raw) && !/\.skr$/i.test(raw)) {
    return null;
  }
  return `${base}.skr`;
}

function skrProfileUrl(skrLabel: string): string {
  const base = skrLabel.replace(/\.skr$/i, "");
  return `https://myseeker.id/${encodeURIComponent(base)}`;
}

function addressUrl(wallet: string): string {
  return `https://sol.new/address/${wallet}`;
}

/** Compact for balances; exact "1M" for thresholds when whole millions */
function formatToken(num: number, exactMillions = false) {
  if (!Number.isFinite(num) || num <= 0) return "0";
  if (exactMillions && num >= 1_000_000 && num % 1_000_000 === 0) {
    return `${num / 1_000_000}M`;
  }
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    return `${m >= 10 ? m.toFixed(1) : m.toFixed(2)}M`.replace(/\.00M$/, "M");
  }
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  if (num >= 100) return Math.floor(num).toLocaleString();
  if (num >= 1) return num.toFixed(num >= 10 ? 1 : 2).replace(/\.0$/, "");
  return num.toFixed(3).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

/** @deprecated alias */
function formatTracker(num: number, exactMillions = false) {
  return formatToken(num, exactMillions);
}

function shortWallet(w: string) {
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}

export default function SnakePage() {
  const [prizePool, setPrizePool] = useState<{
    skrBalance: number;
    solBalance: number;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbPeriod, setLbPeriod] = useState<"all" | "weekly" | "daily">("all");
  const [gameStats, setGameStats] = useState<{
    totalPlayers: number;
    totalGames: number;
    eligiblePlayers?: number;
    eligibleOnBoard?: number;
    scannedPlayers?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [trackerPrice, setTrackerPrice] = useState<number | null>(null);
  const [requiredTracker, setRequiredTracker] = useState(
    DEFAULT_REQUIRED_TRACKER
  );
  const [config, setConfig] = useState<GameConfig | null>(null);

  const { trackerBalance, isLoadingBalance, openWalletModal } =
    useWalletContext();
  const { connected } = useConnector();
  const { address } = useAccount();
  const { openJupiter, isJupiterReady } = useJupiter();

  const minHoldLabel = formatTracker(requiredTracker, true);

  const loadPrize = useCallback(async () => {
    try {
      const res = await fetch("/api/snake/prize", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setPrizePool({
        skrBalance: Number(data.skrBalance ?? data.trackerBalance) || 0,
        solBalance: Number(data.solBalance) || 0,
      });
    } catch {
      /* soft */
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch(
        `/api/snake/leaderboard?period=${lbPeriod}&limit=20`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (res.status === 401) {
        setLeaderboardError("Leaderboard temporarily unavailable");
        return;
      }
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        setGameStats(data.stats || null);
        if (data.minRewardTracker) {
          setRequiredTracker(Number(data.minRewardTracker));
        }
        setLeaderboardError(null);
      } else {
        setLeaderboardError("Failed to load leaderboard");
      }
    } catch {
      setLeaderboardError("Failed to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [lbPeriod]);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/snake/config", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const cfg = data.config as GameConfig | undefined;
      if (cfg) {
        setConfig(cfg);
        if (cfg.min_tracker_balance) {
          setRequiredTracker(Number(cfg.min_tracker_balance));
        }
      }
    } catch {
      /* soft */
    }
  }, []);

  const loadPrice = useCallback(async () => {
    try {
      // Prefer site price API first
      const local = await fetch("/api/price", { cache: "no-store" });
      if (local.ok) {
        const j = await local.json();
        // TRACKER not always on /api/price — fall through to dexscreener
      }
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${TRACKER_MINT}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const pairs = (data?.pairs || []) as Array<{
        priceUsd?: string;
        liquidity?: { usd?: number };
      }>;
      pairs.sort(
        (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      );
      const p = Number(pairs[0]?.priceUsd || 0);
      if (p > 0) setTrackerPrice(p);
    } catch {
      /* soft */
    }
  }, []);

  useEffect(() => {
    loadPrize();
    loadLeaderboard();
    loadConfig();
    loadPrice();
    const a = setInterval(loadPrize, 30_000);
    const b = setInterval(loadLeaderboard, 60_000);
    const c = setInterval(loadPrice, 60_000);
    return () => {
      clearInterval(a);
      clearInterval(b);
      clearInterval(c);
    };
  }, [loadPrize, loadLeaderboard, loadConfig, loadPrice]);

  const userEligible = trackerBalance >= requiredTracker;
  const airdropOn = config?.airdrop_enabled !== false;
  const tokensPerPill = config?.tokens_per_pill ?? 10;
  const maintenance = !!config?.maintenance_mode;

  const youRank = useMemo(() => {
    if (!address) return null;
    const i = leaderboard.findIndex((e) => e.wallet === address);
    return i >= 0 ? i + 1 : null;
  }, [address, leaderboard]);

  return (
    <div className={styles.main}>
      <Backbutton />

      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.brandBlock}>
            <div className={styles.brandRow}>
              <Image
                src="/snake/icon.png"
                alt=""
                width={64}
                height={64}
                className={styles.appIcon}
                priority
              />
              <div>
                <p className={styles.eyebrow}>$TRACKER · Seeker game</p>
                <h1 className={styles.title}>Snake</h1>
              </div>
            </div>
            <p className={styles.slogan}>
              Classic snake on Solana Seeker. Global leaderboard. TRACKER
              airdrops while you play if you hold the minimum.
            </p>
            {maintenance && (
              <p className={styles.maintBanner}>Maintenance mode — scores may pause</p>
            )}
          </div>
          <div className={styles.heroAside}>
            <div className={styles.heroActions}>
              <Link href={SNAKE_DAPP_URL} className={styles.ctaPrimary}>
                Open on dApp Store
              </Link>
              <button
                type="button"
                className={styles.ctaBuy}
                onClick={openJupiter}
                disabled={!isJupiterReady}
              >
                {isJupiterReady ? "Buy $TRACKER" : "Buy $TRACKER…"}
              </button>
              <a
                href={JUP_BUY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaGhost}
              >
                Buy on Jupiter
              </a>
              <button
                type="button"
                className={styles.ctaGhost}
                onClick={() => {
                  loadLeaderboard();
                  loadPrize();
                }}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics */}
      <section className={styles.metrics} aria-label="Snake stats">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Min hold</span>
          <span className={styles.metricValue}>
            {minHoldLabel}
            <em> TRACKER</em>
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Treasury</span>
          <span className={styles.metricValue}>
            {loading
              ? "…"
              : `${formatTracker(prizePool?.skrBalance || 0)} SKR`}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Players</span>
          <span className={styles.metricValue}>
            {gameStats ? gameStats.totalPlayers.toLocaleString() : "…"}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Games</span>
          <span className={styles.metricValue}>
            {gameStats ? gameStats.totalGames.toLocaleString() : "…"}
          </span>
        </div>
      </section>

      {/* You */}
      <section className={styles.youPanel}>
        {!connected || !address ? (
          <div className={styles.youInner}>
            <div>
              <p className={styles.youLabel}>Your eligibility</p>
              <p className={styles.youCopy}>
                Hold ≥{minHoldLabel} TRACKER to earn airdrops in-game. Connect
                wallet to check.
              </p>
            </div>
            <div className={styles.youActions}>
              <button
                type="button"
                className={styles.ctaPrimary}
                onClick={openWalletModal}
              >
                Connect wallet
              </button>
              <button
                type="button"
                className={styles.ctaBuy}
                onClick={openJupiter}
                disabled={!isJupiterReady}
              >
                Buy $TRACKER
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.youInner}>
            <div className={styles.youMeta}>
              <p className={styles.youLabel}>Your wallet</p>
              <p className={styles.youAddr}>{shortWallet(address)}</p>
            </div>
            <div className={styles.youStats}>
              <div>
                <span className={styles.youStatLabel}>TRACKER</span>
                <span className={styles.youStatValue}>
                  {isLoadingBalance ? "…" : formatTracker(trackerBalance)}
                </span>
              </div>
              <div>
                <span className={styles.youStatLabel}>Min hold</span>
                <span className={styles.youStatValue}>{minHoldLabel}</span>
              </div>
              {youRank != null && (
                <div>
                  <span className={styles.youStatLabel}>Rank</span>
                  <span className={styles.youStatValue}>#{youRank}</span>
                </div>
              )}
            </div>
            <div className={styles.youActions}>
              <span className={userEligible ? styles.badgeOk : styles.badgeNo}>
                {userEligible
                  ? "Eligible for airdrops"
                  : `Need ${formatTracker(Math.max(0, requiredTracker - trackerBalance))} more`}
              </span>
              {!userEligible && (
                <button
                  type="button"
                  className={styles.ctaBuy}
                  onClick={openJupiter}
                  disabled={!isJupiterReady}
                >
                  Buy $TRACKER
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Rules + treasury */}
      <section className={styles.midGrid}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>How rewards work</h2>
          <ul className={styles.bullets}>
            <li>
              Hold ≥ <strong>{minHoldLabel} TRACKER</strong>{" "}
              ({requiredTracker.toLocaleString()})
            </li>
            <li>
              Airdrops:{" "}
              <strong>{airdropOn ? "on" : "off"}</strong>
              {tokensPerPill > 0 && (
                <>
                  {" "}
                  · ~{tokensPerPill} TRACKER base per pill
                </>
              )}
            </li>
            <li>Connect wallet in-app to save scores & receive drops</li>
            <li>Package: <code>{SNAKE_DAPP}</code></li>
          </ul>
          {trackerPrice != null && (
            <p className={styles.panelSub}>
              Min hold ≈ ${(requiredTracker * trackerPrice).toFixed(2)} USD
            </p>
          )}
        </div>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Reward treasury</h2>
          <p className={styles.treasuryBig}>
            {loading
              ? "…"
              : `${formatTracker(prizePool?.skrBalance || 0)} SKR`}
          </p>
          {prizePool && prizePool.solBalance > 0 && (
            <p className={styles.panelSub}>
              + {prizePool.solBalance.toFixed(4)} SOL
            </p>
          )}
          <a
            href={addressUrl(PRIZE_WALLET)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.inlineLink}
          >
            {shortWallet(PRIZE_WALLET)} on sol.new →
          </a>
        </div>
      </section>

      {/* Leaderboard */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Leaderboard</h2>
            <p className={styles.panelSub}>
              {gameStats?.totalPlayers
                ? `${gameStats.totalPlayers.toLocaleString()} players`
                : "Top scores"}
              {gameStats?.totalGames
                ? ` · ${gameStats.totalGames.toLocaleString()} games`
                : ""}
              {" · "}✓ = ≥{minHoldLabel} TRACKER
            </p>
          </div>
        </div>

        <div
          className={styles.periodTabs}
          role="tablist"
          aria-label="Leaderboard period"
        >
          {(
            [
              ["all", "All time"],
              ["weekly", "Weekly"],
              ["daily", "Daily"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={lbPeriod === id}
              className={`${styles.periodTab} ${
                lbPeriod === id ? styles.periodTabActive : ""
              }`}
              onClick={() => setLbPeriod(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.eligibleBanner} aria-live="polite">
          <span className={styles.eligibleLabel}>Eligible to win $SKR</span>
          <strong className={styles.eligibleValue}>
            {leaderboardLoading && gameStats?.eligiblePlayers == null
              ? "…"
              : (
                  gameStats?.eligiblePlayers ??
                  leaderboard.filter(
                    (e) =>
                      e.eligible ??
                      (e.trackerBalance ?? 0) >= requiredTracker
                  ).length
                ).toLocaleString()}
          </strong>
          <span className={styles.eligibleHint}>
            hold ≥{minHoldLabel} TRACKER
            {gameStats?.scannedPlayers
              ? ` · of top ${gameStats.scannedPlayers.toLocaleString()} scorers`
              : ""}
            {typeof gameStats?.eligibleOnBoard === "number"
              ? ` · ${gameStats.eligibleOnBoard} on this board`
              : ""}
          </span>
        </div>

        {leaderboardLoading && leaderboard.length === 0 ? (
          <div className={styles.skeletonList} aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : leaderboardError ? (
          <p className={styles.empty}>{leaderboardError}</p>
        ) : leaderboard.length === 0 ? (
          <p className={styles.empty}>No scores yet for this period.</p>
        ) : (
          <div className={styles.table} role="table">
            <div className={styles.thead} role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">Player</span>
              <span role="columnheader" className={styles.num}>
                TRACKER
              </span>
              <span role="columnheader" className={styles.num}>
                SKR
              </span>
              <span role="columnheader" className={styles.num}>
                High
              </span>
              <span role="columnheader" className={styles.num}>
                Games
              </span>
            </div>
            {leaderboard.map((entry, index) => {
              const bal = entry.trackerBalance ?? 0;
              const skrBal = entry.skrBalance ?? 0;
              const ok = entry.eligible ?? bal >= requiredTracker;
              const skrLabel = displaySkr(entry);
              const isYou = !!address && entry.wallet === address;
              return (
                <div
                  key={`${lbPeriod}-${entry.wallet}-${index}`}
                  className={`${styles.trow} ${isYou ? styles.trowYou : ""} ${
                    ok ? "" : styles.trowInelig
                  }`}
                  role="row"
                >
                  <span className={styles.rank} role="cell">
                    {index + 1}
                  </span>
                  <span className={styles.player} role="cell">
                    {skrLabel && (
                      <a
                        href={skrProfileUrl(skrLabel)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.skrId}
                        title={`${skrLabel} on MySeeker`}
                      >
                        {skrLabel}
                      </a>
                    )}
                    <a
                      href={addressUrl(entry.wallet)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.walletLink}
                      title="View on sol.new"
                    >
                      {shortWallet(entry.wallet)}
                    </a>
                    {isYou && <span className={styles.youChip}>you</span>}
                    {ok && <span className={styles.okChip}>✓</span>}
                  </span>
                  <span
                    className={`${styles.num} ${ok ? styles.balOk : styles.balLow}`}
                    role="cell"
                    title={`${bal.toLocaleString()} TRACKER`}
                  >
                    {formatToken(bal)}
                  </span>
                  <span
                    className={`${styles.num} ${styles.skrBal}`}
                    role="cell"
                    title={`${skrBal.toLocaleString()} SKR`}
                  >
                    {formatToken(skrBal)}
                  </span>
                  <span className={`${styles.num} ${styles.score}`} role="cell">
                    {entry.high_score.toLocaleString()}
                  </span>
                  <span className={`${styles.num} ${styles.plays}`} role="cell">
                    {entry.total_plays.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Get the game */}
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Get the game</h2>
        <div className={styles.badgeRow}>
          <a
            href={SNAKE_SDS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.storeBadge}
            aria-label="Get it on Solana dApp Store"
          >
            <Image
              src="/sds-badge.svg"
              alt="Get it on Solana dApp Store"
              width={180}
              height={70}
            />
          </a>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.storeBadge}
            aria-label="Download Android APK (not on Google Play yet)"
            title="Android APK — not on Google Play yet"
          >
            <Image
              src="/badges/google-play.svg"
              alt="Download Android APK"
              width={180}
              height={54}
            />
          </a>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.storeBadge}
            aria-label="Download Snake Seeker on the App Store"
          >
            <Image
              src="/badges/app-store.svg"
              alt="Download on the App Store"
              width={180}
              height={54}
            />
          </a>
        </div>
        <div className={styles.downloadRow}>
          <Link href={SNAKE_DAPP_URL} className={styles.ctaGhost}>
            Listing on SeekerTracker
          </Link>
          <a href="snakeseeker://" className={styles.ctaGhost}>
            Open app
          </a>
          <a
            href={APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaGhost}
          >
            Download APK
          </a>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaGhost}
          >
            App Store
          </a>
          <button
            type="button"
            className={styles.ctaBuy}
            onClick={openJupiter}
            disabled={!isJupiterReady}
          >
            Buy $TRACKER
          </button>
          <a
            href={JUP_BUY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaGhost}
          >
            Jupiter
          </a>
        </div>
        <p className={styles.panelSub}>
          iOS App Store · Android APK / Seeker dApp Store · package{" "}
          <code>{SNAKE_DAPP}</code> · min hold{" "}
          <strong>{minHoldLabel} TRACKER</strong>
        </p>
      </section>

      {/* Screenshots */}
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Screenshots</h2>
        <div className={styles.screenshots}>
          {[
            ["screenshot-home.jpg", "Home"],
            ["screenshot-gameplay.jpg", "Gameplay"],
            ["screenshot-leaderboard.jpg", "Leaderboard"],
            ["screenshot-gameover.jpg", "Game over"],
          ].map(([file, alt]) => (
            <div key={file} className={styles.shot}>
              <Image
                src={`/snake/${file}`}
                alt={alt}
                width={220}
                height={440}
                className={styles.shotImg}
              />
            </div>
          ))}
        </div>
      </section>

      <p className={styles.disclaimer}>
        Unofficial Seeker game · airdrop rules can change · not financial advice
      </p>
    </div>
  );
}
