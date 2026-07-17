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

const defaultCtx: Ctx = {
    solPrice: 0,
    backendHealth: false,
    seekerData: {
        lifeTimeSolFees: 0,
        token24hVol: 0,
        fundBalance: 0,
    },
    live: false,
    backendWS: null,
};

const DataContext = createContext<Ctx>(defaultCtx);

export default function DataProviderClient({
    children,
    initialData,
}: {
    children: ReactNode;
    initialData: Omit<Ctx, "backendWS" | "live">;
}) {
    const [solPrice, setSolPrice] = useState<number>(initialData.solPrice);
    const [live, setLive] = useState<boolean>(initialData.backendHealth);

    // Poll health + SOL price (replaces WebSocket priceUpdate)
    useEffect(() => {
        let cancelled = false;

        const tick = async () => {
            try {
                const [h, p] = await Promise.all([
                    fetch("/api/health", { cache: "no-store" }),
                    fetch("/api/price", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: "{}",
                        cache: "no-store",
                    }),
                ]);
                if (cancelled) return;
                setLive(h.ok);
                if (p.ok) {
                    const j = await p.json();
                    if (typeof j.usdPrice === "number" && j.usdPrice > 0) {
                        setSolPrice(j.usdPrice);
                    }
                }
            } catch {
                if (!cancelled) setLive(false);
            }
        };

        tick();
        const id = setInterval(tick, 30_000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    const toSend = useMemo<Ctx>(
        () => ({
            solPrice,
            backendHealth: live,
            seekerData: initialData.seekerData,
            live,
            backendWS: null,
        }),
        [solPrice, initialData.seekerData, live]
    );

    return <DataContext.Provider value={toSend}>{children}</DataContext.Provider>;
}

export const useDataContext = () => {
    const ctx = useContext(DataContext);
    if (!ctx) {
        throw new Error("useDataContext must be used within DataProviderClient");
    }
    return ctx;
};
