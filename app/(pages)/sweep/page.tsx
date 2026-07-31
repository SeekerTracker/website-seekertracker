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
  capped?: boolean;
};

type Stats = {
  totalEligible: number;
  totalBalance: number;
  totalCounted?: number;
  minRequired?: number;
  maxCounted?: number;
};

const MIN_HOLD = 1_000_000;
const MAX_COUNTED = 20_000_000;

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

const Sweep = () => {
  const { address } = useAccount();
  const { connected } = useConnector();
  const { trackerBalance, openWalletModal } = useWalletContext();
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [countdown, setCountdown] = useState(msToNextHour());
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

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
      setLastUpdated(data.lastUpdated || Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setCountdown(msToNextHour()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatNumber = (num: number) => {
    const rounded = Math.floor(num);
    if (rounded >= 1_000_000) return `${(rounded / 1_000_000).toFixed(2)}M`;
    if (rounded >= 1_000) return `${(rounded / 1_000).toFixed(0)}K`;
    return rounded.toLocaleString();
  };

  const truncateWallet = (wallet: string) =>
    `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contestants;
    return contestants.filter((c) => c.wallet.toLowerCase().includes(q));
  }, [contestants, query]);

  const shown = filtered.slice(0, 100);

  const totalCounted =
    stats?.totalCounted ??
    contestants.reduce((s, c) => s + (c.counted ?? Math.min(c.balance, MAX_COUNTED)), 0);

  const you = useMemo(() => {
    if (!connected || !address) return null;
    const row = contestants.find((c) => c.wallet === address);
    if (row) return { ...row, inList: true as const };
    const balance = trackerBalance || 0;
    const eligible = balance >= MIN_HOLD && balance <= MAX_COUNTED;
    const counted = eligible ? balance : 0;
    const weight = totalCounted > 0 && eligible ? counted / totalCounted : 0;
    return {
      wallet: address,
      balance,
      counted,
      weight,
      eligible,
      capped: false,
      inList: false as const,
    };
  }, [connected, address, contestants, trackerBalance, totalCounted]);

  return (
    <div className={styles.main}>
      <Backbutton />
      <div className={styles.topBar}>
        <span className={styles.header}>
          <Image src="/icons/bags-icon.png" alt="" width={36} height={36} />
          &nbsp;TRACKER Sweep
        </span>
        <span className={styles.tokenDesc}>
          Hourly SOL drip · 10% of fees · hold 1M–20M TRACKER
        </span>
        <div className={styles.countdownRow}>
          <span className={styles.countdownLabel}>Next drip window</span>
          <span className={styles.countdownValue}>{formatCountdown(countdown)}</span>
          <span className={styles.countdownHint}>top of each hour · UTC cadence via bot</span>
        </div>
      </div>

      <div className={styles.infoCards}>
        <div className={styles.infoCard}>
          <span className={styles.cardIcon}>💧</span>
          <span className={styles.cardTitle}>Model</span>
          <span className={styles.cardValue}>Drip</span>
          <span className={styles.cardDesc}>
            Fee-funded SOL every hour — not a one-time dump
          </span>
        </div>
        <div className={styles.infoCard}>
          <span className={styles.cardIcon}>📊</span>
          <span className={styles.cardTitle}>Min hold</span>
          <span className={styles.cardValue}>1M</span>
          <span className={styles.cardDesc}>TRACKER required to enter the pool</span>
        </div>
        <div className={styles.infoCard}>
          <span className={styles.cardIcon}>🎯</span>
          <span className={styles.cardTitle}>Max hold</span>
          <span className={styles.cardValue}>20M</span>
          <span className={styles.cardDesc}>
            Must hold ≤20M TRACKER to stay eligible (LP excluded)
          </span>
        </div>
        <div className={styles.infoCard}>
          <span className={styles.cardIcon}>⚡</span>
          <span className={styles.cardTitle}>Min payout</span>
          <span className={styles.cardValue}>0.01 SOL</span>
          <span className={styles.cardDesc}>Dust below floor is skipped</span>
        </div>
      </div>

      {you && (
        <div
          className={`${styles.youCard} ${
            you.eligible ? styles.youEligible : styles.youIneligible
          }`}
        >
          <div className={styles.youTitle}>Your wallet</div>
          <div className={styles.youWallet}>{truncateWallet(you.wallet)}</div>
          {you.inList || you.eligible ? (
            <>
              <div className={styles.youStats}>
                <span>
                  Balance <strong>{formatNumber(you.balance)}</strong>
                </span>
                <span>
                  Counted <strong>{formatNumber(you.counted ?? 0)}</strong>
                  {you.capped ? " · capped" : ""}
                </span>
                <span>
                  Est. weight{" "}
                  <strong>
                    {(((you.weight ?? 0) * 100) || 0).toFixed(2)}%
                  </strong>
                </span>
              </div>
              <div className={styles.youBadge}>
                {you.eligible ? "Eligible for drip" : "Below minimum"}
              </div>
            </>
          ) : (
            <div className={styles.youStats}>
              <span>
                Need ≥ {formatNumber(MIN_HOLD)} TRACKER · balance{" "}
                <strong>{formatNumber(you.balance)}</strong>
              </span>
              <button type="button" className={styles.refreshBtn} onClick={openWalletModal}>
                Wallet
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.contestantsSection}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Eligible holders</span>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={load}
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
        {stats && (
          <div className={styles.contestantStats}>
            <span>{stats.totalEligible.toLocaleString()} wallets</span>
            <span>·</span>
            <span>{formatNumber(totalCounted)} TRACKER counted</span>
            {lastUpdated && (
              <>
                <span>·</span>
                <span>updated {new Date(lastUpdated).toLocaleTimeString()}</span>
              </>
            )}
          </div>
        )}
        <input
          type="search"
          className={styles.search}
          placeholder="Search wallet…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {error && <div className={styles.errorBox}>{error}</div>}
        {loading && contestants.length === 0 ? (
          <div className={styles.loadingContestants}>Loading contestants…</div>
        ) : shown.length > 0 ? (
          <>
            <div className={styles.contestantsList}>
              <div className={styles.contestantHeader}>
                <span className={styles.contestantRank}>#</span>
                <span className={styles.contestantWallet}>Wallet</span>
                <span className={styles.contestantBalance}>Balance</span>
                <span className={styles.contestantCounted}>Counted</span>
                <span className={styles.contestantWeight}>Weight</span>
              </div>
              {shown.map((c, index) => {
                const counted = c.counted ?? Math.min(c.balance, MAX_COUNTED);
                const weight =
                  c.weight ?? (totalCounted > 0 ? counted / totalCounted : 0);
                const isYou = !!address && c.wallet === address;
                return (
                  <div
                    key={c.wallet}
                    className={`${styles.contestantRow} ${
                      isYou ? styles.contestantYou : ""
                    }`}
                  >
                    <span className={styles.contestantRank}>{index + 1}</span>
                    <span className={styles.contestantWallet}>
                      <Link
                        href={`https://solscan.io/account/${c.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.walletLink}
                      >
                        {truncateWallet(c.wallet)}
                      </Link>
                      {c.capped && <span className={styles.capTag}>cap</span>}
                      {isYou && <span className={styles.youTag}>you</span>}
                    </span>
                    <span className={styles.contestantBalance}>
                      {formatNumber(c.balance)}
                    </span>
                    <span className={styles.contestantCounted}>
                      {formatNumber(counted)}
                    </span>
                    <span className={styles.contestantWeight}>
                      {(weight * 100).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
            {filtered.length > shown.length && (
              <div className={styles.listFoot}>
                Showing top {shown.length} of {filtered.length}
                {query ? " matches" : " eligible"}
              </div>
            )}
          </>
        ) : (
          <div className={styles.noContestants}>
            {query ? "No wallets match that search" : "No eligible contestants found"}
          </div>
        )}
      </div>

      <div className={styles.howItWorks}>
        <span className={styles.sectionTitle}>How the drip works</span>
        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepTitle}>Hold TRACKER</span>
            <span className={styles.stepDesc}>
              Hold between 1M and 20M TRACKER in a non-custodial wallet. LP wallets excluded.
            </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepTitle}>Fees fund the pot</span>
            <span className={styles.stepDesc}>
              ~10% of platform fees set aside as SOL for holders
            </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepTitle}>Hourly drip</span>
            <span className={styles.stepDesc}>
              Share ∝ balance in band. Min 0.01 SOL per payout. Winners in Telegram.
            </span>
          </div>
        </div>
      </div>

      <div className={styles.announcements}>
        <span className={styles.announcementIcon}>📢</span>
        <span className={styles.announcementText}>
          Results posted hourly in Telegram
        </span>
        <Link
          href="https://t.me/seeker_tracker"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.telegramButton}
        >
          Join Telegram
        </Link>
      </div>

      <div className={styles.eligibility}>
        <span className={styles.sectionTitle}>Eligibility</span>
        <div className={styles.requirements}>
          <div className={styles.requirement}>
            <span className={styles.checkmark}>✓</span>
            <span>Minimum 1,000,000 TRACKER</span>
          </div>
          <div className={styles.requirement}>
            <span className={styles.checkmark}>✓</span>
            <span>Maximum 20,000,000 TRACKER (above 20M not eligible)</span>
          </div>
          <div className={styles.requirement}>
            <span className={styles.checkmark}>✓</span>
            <span>LP / protocol wallets excluded</span>
          </div>
          <div className={styles.requirement}>
            <span className={styles.checkmark}>✓</span>
            <span>Minimum reward 0.01 SOL</span>
          </div>
          <div className={styles.requirement}>
            <span className={styles.checkmark}>✓</span>
            <span>Non-custodial wallet (not CEX)</span>
          </div>
        </div>
      </div>

      <span className={styles.disclaimer}>
        Unofficial product surface · rules subject to change · fee-funded drip
      </span>
    </div>
  );
};

export default Sweep;
