"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from "react";
import { SeekerData } from "../constantTypes";

type Ctx = {
  solPrice: number;
  skrPrice: number;
  /** True while first price poll is in flight (or still zero after error) */
  pricesLoading: boolean;
  backendHealth: boolean;
  seekerData: SeekerData;
  /** True when Turso-backed APIs are healthy (replaces old WebSocket "Live") */
  live: boolean;
  /**
   * @deprecated Socket.io removed with Supabase/charity backend.
   * Always null — kept so older call sites compile during migration.
   */
  backendWS: null;
};

const emptySeeker: SeekerData = {
  lifeTimeSolFees: 0,
  token24hVol: 0,
  fundBalance: 0,
};

const defaultCtx: Ctx = {
  solPrice: 0,
  skrPrice: 0,
  pricesLoading: true,
  backendHealth: false,
  seekerData: emptySeeker,
  live: false,
  backendWS: null,
};

const DataContext = createContext<Ctx>(defaultCtx);

type InitialData = {
  solPrice?: number;
  skrPrice?: number;
  backendHealth?: boolean;
  seekerData?: SeekerData;
};

export default function DataProviderClient({
  children,
  initialData,
}: {
  children: ReactNode;
  /** Optional SSR seed — prefer empty so root layout never blocks */
  initialData?: InitialData;
}) {
  const [solPrice, setSolPrice] = useState<number>(initialData?.solPrice ?? 0);
  const [skrPrice, setSkrPrice] = useState<number>(initialData?.skrPrice ?? 0);
  const [pricesLoading, setPricesLoading] = useState<boolean>(
    !(initialData?.solPrice && initialData.solPrice > 0)
  );
  const [live, setLive] = useState<boolean>(initialData?.backendHealth ?? false);
  const [seekerData, setSeekerData] = useState<SeekerData>(
    initialData?.seekerData ?? emptySeeker
  );

  // Health + SOL/SKR prices — non-blocking, client-only
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const [h, p] = await Promise.all([
          fetch("/api/health", { cache: "no-store" }),
          fetch("/api/price", {
            method: "GET",
            cache: "no-store",
          }),
        ]);
        if (cancelled) return;
        setLive(h.ok);
        if (p.ok) {
          const j = await p.json();
          const sol = Number(j.solPrice ?? j.usdPrice ?? 0);
          const skr = Number(j.skrPrice ?? 0);
          if (sol > 0) setSolPrice(sol);
          if (skr > 0) setSkrPrice(skr);
        }
      } catch {
        if (!cancelled) setLive(false);
      } finally {
        if (!cancelled) setPricesLoading(false);
      }
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Fund / volume stats — secondary, never blocks paint
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/seeker-fund", {
          next: { revalidate: 120 } as RequestInit["next"],
        });
        if (!res.ok || cancelled) return;
        const j = await res.json();
        if (cancelled) return;
        setSeekerData({
          lifeTimeSolFees: Number(j.lifeTimeSolFees ?? 0),
          token24hVol: Number(j.token24hVol ?? 0),
          fundBalance: Number(j.fundBalance ?? 0),
        });
      } catch {
        /* soft fail — UI shows zeros */
      }
    };
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const toSend = useMemo<Ctx>(
    () => ({
      solPrice,
      skrPrice,
      pricesLoading,
      backendHealth: live,
      seekerData,
      live,
      backendWS: null,
    }),
    [solPrice, skrPrice, pricesLoading, seekerData, live]
  );

  return (
    <DataContext.Provider value={toSend}>{children}</DataContext.Provider>
  );
}

export const useDataContext = () => {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useDataContext must be used within DataProviderClient");
  }
  return ctx;
};
