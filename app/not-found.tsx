/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import React from "react";

const Custom404 = () => {
    return (

        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: "2em",
                gap: "2em",
                width: "100%",
                height: "100%",
                flexGrow: 1,

            }}
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                width: "fit-content",
                justifyContent: "center",
                padding: "1em",
                borderRadius: "1em",
                background: "linear-gradient(45deg, #00ff66, #00cc52)",
                color: "black",
                fontSize: "0.9em",
                cursor: "pointer",
            }}>
                <Link href={"/"}>
                    ← Back to Tracker
                </Link>
            </div>

            <img src="/error.svg" alt="Error Image" width="600px" style={
                {
                    maxWidth: "100%",
                    height: "auto",
                    margin: "auto",
                }

            } />
        </div>
    );
};

export default Custom404;
