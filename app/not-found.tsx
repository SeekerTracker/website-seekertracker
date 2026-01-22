/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import React from "react";
import Backbutton from "./(components)/shared/Backbutton";

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
            <Backbutton />

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
