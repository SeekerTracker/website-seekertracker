import { io, Socket } from "socket.io-client";
import { WS_URL } from "../constant";

let socket: Socket | null = null;

export function getWebSocket() {
    if (socket && socket.connected) return socket;

    if (typeof window === "undefined") {
        // ❌ Don't run on server / build
        return null;
    }


    if (!socket) {
        socket = io(WS_URL, {
            autoConnect: true,
            transports: ["websocket"],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
            console.log("✅ WebSocket connected:", socket?.id);
        });

        socket.on("disconnect", (reason) => {
            console.log("❌ WebSocket disconnected:", reason);
        });

        socket.on("connect_error", (err) => {
            console.error("⚠️ Connection error:", err.message);
        });
    }

    return socket;
}
