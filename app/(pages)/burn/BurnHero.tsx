"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { fmtRelative, fmtSkr, fmtWhen } from "./format";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function useCountUp(target: number, reduced: boolean, duration = 1800): number {
  const [display, setDisplay] = useState(reduced ? target : 0);
  const rafRef = useRef<number | null>(null);

  const animate = useCallback(
    (from: number, to: number, startTime: number) => {
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(from + (to - from) * eased));
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [duration]
  );

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (reduced || !Number.isFinite(target) || target <= 0) {
      setDisplay(Number.isFinite(target) ? target : 0);
      return;
    }
    setDisplay(0);
    const id = requestAnimationFrame((t) => animate(0, target, t));
    return () => {
      cancelAnimationFrame(id);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, reduced, animate]);

  return display;
}

const EMBER_COUNT = 12;

export default function BurnHero({
  totalBurned,
  burnCount,
  lastBurnAt,
}: {
  totalBurned: number;
  burnCount: number;
  lastBurnAt: string | null;
}) {
  const reduced = usePrefersReducedMotion();
  const display = useCountUp(totalBurned, reduced);
  const finalLabel = fmtSkr(totalBurned, 0);
  const label = fmtSkr(display, 0);

  return (
    <section className={styles.hero} aria-labelledby="burn-total-label">
      <div className={styles.hearth} aria-hidden="true">
        <div className={styles.hearthGlow} />
        <div className={`${styles.flame} ${styles.flameA}`} />
        <div className={`${styles.flame} ${styles.flameB}`} />
        <div className={`${styles.flame} ${styles.flameC}`} />
        <div className={styles.embers}>
          {Array.from({ length: EMBER_COUNT }, (_, i) => (
            <span key={i} style={{ ["--i" as string]: String(i) }} />
          ))}
        </div>
      </div>
      <p className={styles.heroLive}>
        <span className={styles.liveDot} aria-hidden />
        Live on-chain
      </p>
      <p
        className={styles.heroNum}
        style={{ minWidth: `${finalLabel.length}ch` }}
        aria-live="polite"
      >
        {label}
      </p>
      <p id="burn-total-label" className={styles.heroUnit}>
        SKR burned
      </p>
      <p className={styles.heroMeta}>
        {burnCount.toLocaleString("en-US")} official burns
        {lastBurnAt ? (
          <>
            {" · "}Latest {fmtRelative(lastBurnAt)}
            {" · "}
            {fmtWhen(lastBurnAt)}
          </>
        ) : null}
      </p>
    </section>
  );
}
