"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import Backbutton from "app/(components)/shared/Backbutton";
import { useAccount, useConnector } from "@solana/connector/react";
import { useWalletContext } from "app/(utils)/context/walletProvider";

type Contestant = {
  wallet: string;
  balance: number;
  counted?: number;
  weight?: number;
  eligible: boolean;
};

type Winner = {
  wallet: string;
  skr?: number;
  sol?: number;
  signature: string;
  blockTime: number | null;
  receiptUrl: string;
};

type Stats = {
  totalEligible: number;
  totalBalance: number;
  totalCounted?: number;
  rewardWallet?: string;
  rewardWalletSol?: number | null;
  rewardWalletSkr?: number | null;
  walletReserveSol?: number;
  minPrizeSkr?: number;
  minPrizeSol?: number;
  dripActive?: boolean | null;
  dripStatus?: "active" | "paused_unfunded" | "unknown";
};

const MIN_HOLD = 1_000_000;
const MAX_HOLD = 20_000_000;
const REWARD_WALLET_FALLBACK =
  "rwdkZmr8wDN2b2dNLnaTCkTThUBzRdMJJCqtqgbvMug";

function msToNextHour(): number {
  const now = Date.now();
  const next = new Date(now);
  next.setMinutes(60, 0, 0);
  return Math.max(0, next.getTime() - now);
}

function formatCountdown(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

function formatTracker(num: number): string {
  const n = Math.floor(num);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatSkr(n: number): string {
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(3);
}

function winnerSkr(w: Winner): number {
  return typeof w.skr === "number" ? w.skr : w.sol ?? 0;
}

function shortWallet(w: string): string {
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}

function timeAgo(unixSec: number | null): string {
  if (!unixSec) return "—";
  const diff = Math.floor(Date.now() / 1000) - unixSec;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Sweep() {
  const { address } = useAccount();
  const { connected } = useConnector();
  const { trackerBalance, openWalletModal, isLoadingBalance } =
    useWalletContext();

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [winnersLoading, setWinnersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [countdown, setCountdown] = useState(msToNextHour());
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sweep/contestants", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setContestants(data.contestants || []);
      setStats(data.stats || null);
      setUpdatedAt(data.lastUpdated || Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWinners = useCallback(async () => {
    setWinnersLoading(true);
    try {
      const res = await fetch("/api/sweep/winners?limit=20", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) setWinners(data.winners || []);
    } catch {
      /* non-fatal */
    } finally {
      setWinnersLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadWinners();
  }, [load, loadWinners]);

  useEffect(() => {
    const id = setInterval(() => setCountdown(msToNextHour()), 1000);
    return () => clearInterval(id);
  }, []);

  const pool = useMemo(() => {
    return (
      stats?.totalCounted ??
      stats?.totalBalance ??
      contestants.reduce((s, c) => s + c.balance, 0)
    );
  }, [stats, contestants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contestants;
    return contestants.filter((c) => c.wallet.toLowerCase().includes(q));
  }, [contestants, query]);

  const shown = filtered.slice(0, 75);

  const youRank = useMemo(() => {
    if (!address) return null;
    const i = contestants.findIndex((c) => c.wallet === address);
    return i >= 0 ? i + 1 : null;
  }, [address, contestants]);

  const you = useMemo(() => {
    if (!connected || !address) return null;
    const row = contestants.find((c) => c.wallet === address);
    if (row) {
      return {
        wallet: address,
        balance: row.balance,
        weight: row.weight ?? (pool > 0 ? row.balance / pool : 0),
        eligible: true,
        rank: youRank,
      };
    }
    const balance = trackerBalance || 0;
    const eligible = balance >= MIN_HOLD && balance <= MAX_HOLD;
    return {
      wallet: address,
      balance,
      weight: eligible && pool > 0 ? balance / pool : 0,
      eligible,
      rank: null as number | null,
    };
  }, [connected, address, contestants, trackerBalance, pool, youRank]);

  return (
    <div className={styles.main}>
      <Backbutton />

      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.brandBlock}>
            <p className={styles.eyebrow}>$TRACKER · fee share</p>
            <h1 className={styles.title}>Sweep</h1>
            <p className={styles.slogan}>
              Hourly SKR drip for holders in the 1M-20M TRACKER band. Equal-odds
              lottery among eligible wallets. Floor prize when volume is low. LP
              excluded. Hold TRACKER - win SKR.
            </p>
          </div>
          <div className={styles.heroAside}>
            <div className={styles.countdownCard}>
              <span className={styles.countdownLabel}>Next drip</span>
              <span className={styles.countdownValue}>
                {formatCountdown(countdown)}
              </span>
              <span className={styles.countdownHint}>every hour</span>
            </div>
            <div className={styles.heroActions}>
              <a
                className={styles.ctaPrimary}
                href="https://t.me/seeker_tracker"
                target="_blank"
                rel="noopener noreferrer"
              >
                Results on TG
              </a>
              <button
                type="button"
                className={styles.ctaGhost}
                onClick={load}
                disabled={loading}
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Drip funding status */}
      {stats?.dripStatus === "paused_unfunded" && (
        <div className={styles.statusBanner} role="status">
          <strong>Drip paused - prize wallet needs SKR</strong>
          <p>
            Bot is healthy but prize wallet holds only{" "}
            <code>
              {typeof stats.rewardWalletSkr === "number"
                ? `${formatSkr(stats.rewardWalletSkr)} SKR`
                : "no SKR"}
            </code>
            . Send ≥ {stats.minPrizeSkr ?? 1} SKR to resume hourly drips. Keep a
            little SOL for gas ({stats.walletReserveSol ?? 0.01} SOL reserve).
          </p>
          <a
            className={styles.statusLink}
            href={`https://sol.new/address/${stats.rewardWallet || REWARD_WALLET_FALLBACK}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {shortWallet(stats.rewardWallet || REWARD_WALLET_FALLBACK)} on sol.new →
          </a>
        </div>
      )}
      {stats?.dripStatus === "active" &&
        typeof stats.rewardWalletSkr === "number" && (
          <div className={styles.statusOk} role="status">
            Drip active · prize wallet{" "}
            <strong>{formatSkr(stats.rewardWalletSkr)} SKR</strong>
          </div>
        )}

      {/* Metrics */}
      <section className={styles.metrics} aria-label="Sweep stats">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Eligible</span>
          <span className={styles.metricValue}>
            {stats ? stats.totalEligible.toLocaleString() : loading ? "…" : "—"}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Pool TRACKER</span>
          <span className={styles.metricValue}>
            {stats || contestants.length
              ? formatTracker(pool)
              : loading
                ? "…"
                : "—"}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Prize wallet</span>
          <span className={styles.metricValue}>
            {typeof stats?.rewardWalletSkr === "number"
              ? formatSkr(stats.rewardWalletSkr)
              : loading
                ? "…"
                : "—"}
            <em> SKR</em>
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Drip</span>
          <span className={styles.metricValue}>
            {stats?.dripStatus === "paused_unfunded"
              ? "Paused"
              : stats?.dripStatus === "active"
                ? "Live"
                : loading
                  ? "…"
                  : "—"}
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
                Connect a wallet holding 1M–20M TRACKER to check eligibility.
              </p>
            </div>
            <button
              type="button"
              className={styles.ctaPrimary}
              onClick={openWalletModal}
            >
              Connect wallet
            </button>
          </div>
        ) : (
          <div className={styles.youInner}>
            <div className={styles.youMeta}>
              <p className={styles.youLabel}>Your wallet</p>
              <p className={styles.youAddr}>{shortWallet(address)}</p>
            </div>
            <div className={styles.youStats}>
              <div>
                <span className={styles.youStatLabel}>Balance</span>
                <span className={styles.youStatValue}>
                  {isLoadingBalance && !you?.balance
                    ? "…"
                    : formatTracker(you?.balance ?? trackerBalance)}
                </span>
              </div>
              <div>
                <span className={styles.youStatLabel}>Pool share*</span>
                <span className={styles.youStatValue}>
                  {you?.eligible
                    ? `${((you.weight || 0) * 100).toFixed(2)}%`
                    : "—"}
                </span>
              </div>
              {you?.rank != null && (
                <div>
                  <span className={styles.youStatLabel}>Rank</span>
                  <span className={styles.youStatValue}>#{you.rank}</span>
                </div>
              )}
            </div>
            <span
              className={
                you?.eligible ? styles.badgeOk : styles.badgeNo
              }
            >
              {you?.eligible
                ? "Eligible"
                : (you?.balance ?? 0) > MAX_HOLD
                  ? "Above 20M — not eligible"
                  : "Need 1M–20M TRACKER"}
            </span>
          </div>
        )}
      </section>

      {/* Winners */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Recent winners</h2>
            <p className={styles.panelSub}>
              Last 20 SKR drips from reward wallet ·{" "}
              <a
                href="https://solscan.io/account/rwdkZmr8wDN2b2dNLnaTCkTThUBzRdMJJCqtqgbvMug"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.inlineLink}
              >
                rwdk…Mug
              </a>
            </p>
          </div>
        </div>

        {winnersLoading && winners.length === 0 ? (
          <div className={styles.skeletonList} aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : winners.length === 0 ? (
          <p className={styles.empty}>No recent payouts found.</p>
        ) : (
          <div className={styles.table} role="table">
            <div className={styles.whead} role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">Winner</span>
              <span role="columnheader" className={styles.num}>
                SKR
              </span>
              <span role="columnheader" className={styles.num}>
                When
              </span>
              <span role="columnheader" className={styles.num}>
                Receipt
              </span>
            </div>
            {winners.map((w, i) => (
              <div key={w.signature} className={styles.wrow} role="row">
                <span className={styles.rank} role="cell">
                  {i + 1}
                </span>
                <span role="cell" className={styles.walletCell}>
                  <a
                    href={`https://solscan.io/account/${w.wallet}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.walletLink}
                  >
                    {shortWallet(w.wallet)}
                  </a>
                </span>
                <span className={`${styles.num} ${styles.sol}`} role="cell">
                  {formatSkr(winnerSkr(w))}
                </span>
                <span className={`${styles.num} ${styles.when}`} role="cell">
                  {timeAgo(w.blockTime)}
                </span>
                <span className={`${styles.num}`} role="cell">
                  <a
                    href={w.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.receiptLink}
                  >
                    view
                  </a>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Holders */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Eligible holders</h2>
            <p className={styles.panelSub}>
              {stats
                ? `${stats.totalEligible.toLocaleString()} wallets · ${formatTracker(pool)} in band`
                : "Live holder set"}
              {updatedAt
                ? ` · ${new Date(updatedAt).toLocaleTimeString()}`
                : ""}
            </p>
          </div>
          <input
            type="search"
            className={styles.search}
            placeholder="Search wallet"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search wallet"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {loading && contestants.length === 0 ? (
          <div className={styles.skeletonList} aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className={styles.empty}>
            {query ? "No wallets match." : "No eligible holders right now."}
          </p>
        ) : (
          <>
            <div className={styles.table} role="table">
              <div className={styles.thead} role="row">
                <span role="columnheader">#</span>
                <span role="columnheader">Wallet</span>
                <span role="columnheader" className={styles.num}>
                  Balance
                </span>
                <span role="columnheader" className={styles.num}>
                  Odds*
                </span>
              </div>
              {shown.map((c, i) => {
                const weight =
                  c.weight ?? (pool > 0 ? c.balance / pool : 0);
                const isYou = !!address && c.wallet === address;
                return (
                  <div
                    key={c.wallet}
                    className={`${styles.trow} ${isYou ? styles.trowYou : ""}`}
                    role="row"
                  >
                    <span className={styles.rank} role="cell">
                      {i + 1}
                    </span>
                    <span role="cell" className={styles.walletCell}>
                      <a
                        href={`https://solscan.io/account/${c.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.walletLink}
                      >
                        {shortWallet(c.wallet)}
                      </a>
                      {isYou && <span className={styles.youChip}>you</span>}
                    </span>
                    <span className={`${styles.num} ${styles.bal}`} role="cell">
                      {formatTracker(c.balance)}
                    </span>
                    <span className={`${styles.num} ${styles.wt}`} role="cell">
                      {(weight * 100).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
            {filtered.length > shown.length && (
              <p className={styles.foot}>
                Showing {shown.length} of {filtered.length}
                {query ? " matches" : ""}
              </p>
            )}
          </>
        )}
      </section>

      {/* How + rules */}
      <section className={styles.bottomGrid}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>How it works</h2>
          <ol className={styles.steps}>
            <li>
              <strong>Hold 1M–20M TRACKER</strong>
              <span>Non-custodial wallet. Outside the band = out. LP excluded.</span>
            </li>
            <li>
              <strong>Prize from fees / floor</strong>
              <span>
                Target ~0.1% of 1h volume in SKR (capped). If volume is low, floor
                prize 1 SKR while the reward wallet can pay.
              </span>
            </li>
            <li>
              <strong>Hourly lottery</strong>
              <span>
                One winner drawn each hour among eligible holders (equal odds). Memo:
                “Congrats from SeekerTracker.com”. Posted in Telegram.
              </span>
            </li>
          </ol>
        </div>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Rules</h2>
          <ul className={styles.rules}>
            <li>Min 1,000,000 TRACKER</li>
            <li>Max 20,000,000 TRACKER (above = not eligible)</li>
            <li>LP / protocol wallets excluded</li>
            <li>Equal-odds draw among eligible (not balance-weighted)</li>
            <li>Floor prize 1 SKR when volume is low</li>
            <li>No CEX / custodial holdings</li>
          </ul>
          <Link
            href="https://t.me/seeker_tracker"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.tgLink}
          >
            Join @seeker_tracker →
          </Link>
        </div>
      </section>

      <p className={styles.disclaimer}>
        *Pool share is balance / band total (display only). Live draw is equal odds
        among eligible. Fee-funded drip · rules can change · not financial advice
      </p>
    </div>
  );
}
