"use client";
import React from "react";
import { cn } from "@/lib/utils";
import TimelineItem from "./TimelineItem";
import type { Deadline } from "@/lib/types";

interface DayGroupProps {
  date: string;
  dayHeader: string;
  deadlines: Deadline[];
  onEdit: (deadline: Deadline) => void;
  onRefresh: () => void;
}

export default function DayGroup({ dayHeader, deadlines, onEdit, onRefresh }: DayGroupProps) {
  const allPast = deadlines.every((d) => new Date(d.datetime) < new Date());

  return (
    <div className="mb-8">
      {/* Day header */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className={cn(
            "text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
            allPast
              ? "text-gray-500 bg-transparent border-gray-200"
              : "text-green-700"
          )}
        >
          {dayHeader}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Items with vertical line */}
      <div className="relative pl-10">
        <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gray-200" />
        <div className="space-y-3">
          {deadlines.map((deadline, idx) => (
            <TimelineItem
              key={deadline.id}
              deadline={deadline}
              isLast={idx === deadlines.length - 1}
              onEdit={onEdit}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
