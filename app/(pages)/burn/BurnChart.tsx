"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

/** Scrolls the daily chart to the latest day on mount (narrow viewports). */
export default function BurnChart({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <div className={styles.chartFrame} ref={ref}>
      {children}
    </div>
  );
}
