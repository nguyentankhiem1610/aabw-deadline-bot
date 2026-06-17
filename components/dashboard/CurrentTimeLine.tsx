"use client";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";

export default function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center gap-3 my-5 pl-10">
      {/* Pulsing dot on the connector */}
      <div className="absolute -left-[21px] flex h-5 w-5 items-center justify-center z-10">
        <span className="absolute inline-flex h-5 w-5 rounded-full bg-green-500 opacity-20 animate-ping" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
      </div>

      {/* Line + label */}
      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-green-500/60 to-transparent" />
        <span className="text-[11px] font-bold text-green-700 shrink-0 px-3 py-1">
          NOW · {format(now, "h:mm a")}
        </span>
        <div className="flex-1 h-px bg-gradient-to-l from-green-500/60 to-transparent" />
      </div>
    </div>
  );
}
