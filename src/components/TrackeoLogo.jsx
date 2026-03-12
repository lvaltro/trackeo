// src/components/TrackeoLogo.jsx
import React from "react";
import logoTrackeo from '../assets/logofinal.png';

const TrackeoLogo = ({ size = "md", dark = true }) => {
  const sizes = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-20 w-20" };
  const textSizes = { sm: "text-lg", md: "text-2xl", lg: "text-5xl" };
  const subSizes = { sm: "text-[9px]", md: "text-xs", lg: "text-sm" };
  const lineHeights = { sm: "h-7", md: "h-9", lg: "h-14" };

  return (
    <div className="flex items-center gap-2 pl-1.5">
      <img
        src={logoTrackeo}
        alt="Logo Trackeo"
        className={`${sizes[size]} object-contain drop-shadow-md shrink-0 transition-all`}
      />
      <div className={`w-px ${dark ? "bg-white/40" : "bg-neutral-900/20"} ${lineHeights[size]} rounded-full transition-colors`} />
      <div>
        <h1
          className={`${textSizes[size]} font-black tracking-tight leading-none ${dark ? "text-white" : "text-neutral-900"} transition-colors`}
          style={{ fontFamily: "'SF Pro Display', system-ui, sans-serif" }}
        >
          TRACKEO
        </h1>
        <p className={`${subSizes[size]} font-bold tracking-[0.25em] text-amber-500 leading-none mt-0.5 truncate`}>
          PERSONAS
        </p>
      </div>
    </div>
  );
};

export default TrackeoLogo;
