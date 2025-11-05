"use client";
import React from "react";

export default function Videobg(){
    return(
        <div className="fixed top-0 left-0 w-full overflow-hidden z-0">
            <video
                src={"/Herochewyfinal.mp4"}
                autoPlay
                loop
                muted
                className="abosolute top-0 left-0 min-w-full min-h-full object-cover"
                />
        </div>
    );
}