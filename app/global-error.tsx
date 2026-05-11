"use client";
import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <body style={{
                margin: 0,
                minHeight: "100vh",
                background: "#020d0d",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.5rem",
                padding: "2rem",
                fontFamily: "'JetBrains Mono', monospace",
                color: "#ededed",
                textAlign: "center",
            }}>
                <div style={{
                    position: "fixed",
                    top: "20%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "600px",
                    height: "400px",
                    background: "radial-gradient(ellipse, rgba(0,255,217,0.06) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                <div style={{ fontSize: "2.5rem", filter: "drop-shadow(0 0 20px rgba(255,80,80,0.4))" }}>⚠</div>

                <div>
                    <h1 style={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        margin: "0 0 0.4em",
                        background: "linear-gradient(135deg, #ff6060, #ff9060)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>
                        Something went wrong
                    </h1>
                    <p style={{ color: "#556060", fontSize: "0.9rem", margin: 0 }}>
                        {error.message || "A critical error occurred."}
                    </p>
                    {error.digest && (
                        <p style={{ color: "#334444", fontSize: "0.7rem", marginTop: "0.5em" }}>
                            ref: {error.digest}
                        </p>
                    )}
                </div>

                <button
                    onClick={reset}
                    style={{
                        padding: "0.6em 1.4em",
                        background: "linear-gradient(135deg, #00ffd9, #00e6c0)",
                        border: "none",
                        borderRadius: "0.5em",
                        color: "#001a1a",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        boxShadow: "0 0 20px rgba(0,255,217,0.3)",
                    }}
                >
                    Try again
                </button>

                <p style={{ color: "#223333", fontSize: "0.7rem" }}>seekertracker.com</p>
            </body>
        </html>
    );
}
