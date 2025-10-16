/* eslint-disable @next/next/no-img-element */
import React from "react";

const Custom404 = () => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "80vh",
            }}
        >
            <img src="/error.svg" alt="Error Image" width="600px" />
        </div>
    );
};

export default Custom404;
