"use client";

import React, { useState } from "react";
import styles from "./page.module.css";
import Backbutton from "app/(components)/shared/Backbutton";
import Link from "next/link";

type Segment = {
  label: string;
  value: number;
  color: string;
  description: string;
  token?: string;
  address?: string;
  status?: string;
};

const segments: Segment[] = [
  {
    label: "Compound liquidity",
    value: 50,
    color: "#00ffd9",
    description: "Bags fees compound back into TRACKER liquidity",
  },
  {
    label: "AMM",
    value: 30,
    color: "#66ffe8",
    description: "Market-making / AMM inventory",
  },
  {
    label: "Dividends",
    value: 20,
    color: "#00ff66",
    description: "Holder dividends",
  },
];

function PieChart({
  segments,
  activeSegment,
  setActiveSegment,
}: {
  segments: Segment[];
  activeSegment: number | null;
  setActiveSegment: (index: number | null) => void;
}) {
  const size = 280;
  const center = size / 2;
  const radius = 110;
  const hoverRadius = 118;
  let currentAngle = -90;

  const createArcPath = (startAngle: number, endAngle: number, r: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = center + r * Math.cos(startRad);
    const y1 = center + r * Math.sin(startRad);
    const x2 = center + r * Math.cos(endRad);
    const y2 = center + r * Math.sin(endRad);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={styles.pieChart}
      role="img"
      aria-label="Revenue distribution pie chart"
    >
      {segments.map((segment, index) => {
        const angle = (segment.value / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        const isActive = activeSegment === index;
        const r = isActive ? hoverRadius : radius;
        return (
          <path
            key={segment.label}
            d={createArcPath(startAngle, endAngle, r)}
            fill={segment.color}
            opacity={activeSegment === null || isActive ? 1 : 0.35}
            className={styles.pieSegment}
            onMouseEnter={() => setActiveSegment(index)}
            onMouseLeave={() => setActiveSegment(null)}
            onFocus={() => setActiveSegment(index)}
            onBlur={() => setActiveSegment(null)}
            tabIndex={0}
          />
        );
      })}
      <circle cx={center} cy={center} r={48} fill="#020a0a" />
      <text
        x={center}
        y={center - 6}
        textAnchor="middle"
        fill="#7aa8a8"
        fontSize="11"
        fontWeight="600"
      >
        Bags fees
      </text>
      <text
        x={center}
        y={center + 14}
        textAnchor="middle"
        fill="#00ffd9"
        fontSize="13"
        fontWeight="700"
      >
        1% volume
      </text>
    </svg>
  );
}

export default function WhitepaperPage() {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  return (
    <div className={styles.main}>
      <Backbutton />

      <header className={styles.hero}>
        <p className={styles.eyebrow}>$TRACKER · tokenomics</p>
        <h1 className={styles.title}>Whitepaper</h1>
        <p className={styles.slogan}>
          How TRACKER Bags fees are split. Unofficial product docs - subject
          to change.
        </p>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Revenue model</h2>
        <div className={styles.revenueHighlight}>
          <span className={styles.revenuePercent}>1%</span>
          <span className={styles.revenueLabel}>of TRACKER trading volume</span>
        </div>
        <p className={styles.body}>
          Protocol fee on TRACKER trades (Bags) is split across liquidity,
          AMM, and dividends. Exact routing can change with ops needs.
        </p>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Distribution</h2>
        <p className={styles.panelSub}>
          <strong>50%</strong> compound liquidity · <strong>30%</strong> AMM ·{" "}
          <strong>20%</strong> dividends
        </p>
        <div className={styles.chartContainer}>
          <PieChart
            segments={segments}
            activeSegment={activeSegment}
            setActiveSegment={setActiveSegment}
          />
          <div className={styles.legend}>
            {segments.map((segment, index) => (
              <button
                type="button"
                key={segment.label}
                className={`${styles.legendItem} ${
                  activeSegment === index ? styles.legendItemActive : ""
                }`}
                onMouseEnter={() => setActiveSegment(index)}
                onMouseLeave={() => setActiveSegment(null)}
                onFocus={() => setActiveSegment(index)}
                onBlur={() => setActiveSegment(null)}
              >
                <span
                  className={styles.legendColor}
                  style={{ backgroundColor: segment.color }}
                />
                <span className={styles.legendLabel}>{segment.label}</span>
                <span className={styles.legendValue}>{segment.value}%</span>
              </button>
            ))}
          </div>
        </div>
        {activeSegment !== null && (
          <p className={styles.segmentDetail}>
            <strong style={{ color: segments[activeSegment].color }}>
              {segments[activeSegment].label}
            </strong>
            {" - "}
            {segments[activeSegment].description}
          </p>
        )}
      </section>

      <section className={styles.cards}>
        {segments.map((s) => (
          <article
            key={s.label}
            className={styles.card}
            style={{ borderColor: `${s.color}55` }}
          >
            <span className={styles.cardPct} style={{ color: s.color }}>
              {s.value}%
            </span>
            <h3 className={styles.cardTitle}>{s.label}</h3>
            <p className={styles.cardDesc}>{s.description}</p>
            {s.status && <p className={styles.cardStatus}>{s.status}</p>}
            {s.token && <p className={styles.cardToken}>Paid in {s.token}</p>}
            {s.address && (
              <Link
                href={`https://orbmarkets.io/address/${s.address}/history?hideSpam=true`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.cardLink}
              >
                View address →
              </Link>
            )}
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Sweep (live rules)</h2>
        <ul className={styles.bullets}>
          <li>Hold <strong>1M-20M TRACKER</strong> (LP wallets excluded)</li>
          <li>
            <strong>Equal-odds</strong> hourly lottery among eligible holders
          </li>
          <li>
            Prize is <strong>$SKR</strong> (floor <strong>1 SKR</strong> when
            volume is low)
          </li>
          <li>
            On-chain memo: <em>Congrats from SeekerTracker.com</em>
          </li>
          <li>
            Details: <Link href="/sweep">seekertracker.com/sweep</Link>
          </li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Key points</h2>
        <ul className={styles.bullets}>
          <li>1% fee on TRACKER trading volume (Bags)</li>
          <li>
            Split: <strong>50%</strong> compound liquidity ·{" "}
            <strong>30%</strong> AMM · <strong>20%</strong> dividends
          </li>
          <li>Snake: hold ≥250k TRACKER to play</li>
          <li>Allocations can change - not financial advice</li>
        </ul>
      </section>

      <p className={styles.disclaimer}>
        Unofficial docs · percentages may change · DYOR
      </p>
    </div>
  );
}
