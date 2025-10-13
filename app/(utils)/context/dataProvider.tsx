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
    backendWS?: Socket
};

const defaultCtx: Ctx = {
    solPrice: 0,
    backendHealth: false,
    seekerData: {
        lifeTimeSolFees: 0,
    },
    backendWS: undefined
};

const DataContext = createContext<Ctx>(defaultCtx);

export default function DataProviderClient({ children, initialData }: { children: ReactNode, initialData: Ctx }) {
    const [solPrice, setSolPrice] = useState<number>(initialData.solPrice);
    const backendWS = getWebSocket();

    useEffect(() => {
        if (!backendWS) return;
        console.log("Setting up WS listeners");
        backendWS.on("priceUpdate", (data) => {
            const { usdPrice } = data;
            console.log("Received price update:", usdPrice);
            setSolPrice(usdPrice);
        })

        backendWS.on("disconnect", () => {
            console.log("WebSocket disconnected");
        });


    }, [backendWS]);

    // we only want to set sol price on client side
    const toSend = useMemo(() => ({
        solPrice,
        backendHealth: initialData.backendHealth,
        seekerData: initialData.seekerData,
        backendWS
    }), [solPrice, initialData]);

    return <DataContext.Provider value={toSend}>{children}</DataContext.Provider>;
}

export const useDataContext = () => {
    const ctx = useContext(DataContext);
    if (!ctx) {
        throw new Error("useDataContext must be used within DataProviderClient");
    }
    return ctx;
};
