"use client";
import React from "react";
import { cn } from "@/lib/utils";
import type { TimelineFilter } from "@/lib/types";

interface FilterBarProps {
  filter: TimelineFilter;
  onChange: (filter: TimelineFilter) => void;
  totalCounts: { all: number; global: number; team: number };
}

const TABS: { value: TimelineFilter; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "" },
  { value: "global", label: "Event", emoji: "" },
  { value: "team", label: "Team", emoji: "" },
];

export default function FilterBar({ filter, onChange, totalCounts }: FilterBarProps) {
  return (
    <div className="flex items-center gap-1.5">
      {TABS.map((tab) => {
        const count = totalCounts[tab.value];
        const isActive = filter === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border",
              isActive
                ? "bg-green-600 border-green-500 text-white"
                : "bg-white border-gray-200 text-gray-600"
            )}
          >
            <span className="text-base leading-none">{tab.emoji}</span>
            {tab.label}
            <span
              className={cn(
                "text-xs tabular-nums px-1.5 py-0.5 rounded-full",
                isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
