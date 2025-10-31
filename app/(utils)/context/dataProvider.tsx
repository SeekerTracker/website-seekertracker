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
import { getWebSocket } from "../lib/webSocket";
import { Socket } from "socket.io-client";

type Ctx = {
    solPrice: number;
    backendHealth: boolean;
    seekerData: SeekerData;
    backendWS: Socket | null;
};

const defaultCtx: Ctx = {
    solPrice: 0,
    backendHealth: false,
    seekerData: {
        lifeTimeSolFees: 0,
        token24hVol: 0,
        fundBalance: 0,
    },
    backendWS: null,
};

const DataContext = createContext<Ctx>(defaultCtx);

export default function DataProviderClient({
    children,
    initialData,
}: {
    children: ReactNode;
    initialData: Omit<Ctx, "backendWS">;
}) {
    const [solPrice, setSolPrice] = useState<number>(initialData.solPrice);
    const [backendWS, setBackendWS] = useState<Socket | null>(null);

    // ✅ connect websocket only on client
    useEffect(() => {
        const ws = getWebSocket();
        if (!ws) return;

        setBackendWS(ws);

        ws.on("priceUpdate", (data) => {
            const { usdPrice } = data;
            console.log("💰 Received price update:", usdPrice);
            setSolPrice(usdPrice);
        });

        ws.on("disconnect", () => console.log("❌ WebSocket disconnected"));

        return () => {
            ws.off("priceUpdate");
            ws.off("disconnect");
        };
    }, []);

    // ✅ memoized context data
    const toSend = useMemo<Ctx>(
        () => ({
            solPrice,
            backendHealth: initialData.backendHealth,
            seekerData: initialData.seekerData,
            backendWS,
        }),
        [solPrice, initialData, backendWS]
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
