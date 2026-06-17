"use client";
import React, { useMemo } from "react";
import { groupDeadlinesByDate, getEventDayNumber, formatDayHeader, isDeadlinePast } from "@/lib/utils";
import DayGroup from "./DayGroup";
import CurrentTimeLine from "./CurrentTimeLine";
import type { Deadline } from "@/lib/types";

interface TimelineViewProps {
  deadlines: Deadline[];
  onEdit: (deadline: Deadline) => void;
  onRefresh: () => void;
}

export default function TimelineView({ deadlines, onEdit, onRefresh }: TimelineViewProps) {
  const grouped = useMemo(() => groupDeadlinesByDate(deadlines), [deadlines]);

  if (deadlines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📅</div>
        <p className="text-gray-600 font-medium">No deadlines found</p>
        <p className="text-gray-500 text-sm mt-1">
          Add a team deadline or parse a schedule to get started.
        </p>
      </div>
    );
  }

  const dates = Array.from(grouped.keys());

  // Determine where to insert the "now" line — between past and future dates
  const now = new Date();
  let nowInsertAfterIndex = -1;
  for (let i = 0; i < dates.length; i++) {
    const dateDeadlines = grouped.get(dates[i])!;
    const allPast = dateDeadlines.every((d) => isDeadlinePast(d.datetime));
    if (allPast) {
      nowInsertAfterIndex = i;
    }
  }

  return (
    <div className="space-y-0">
      {dates.map((date, idx) => {
        const dayDeadlines = grouped.get(date)!;
        const dayNumber = getEventDayNumber(date);
        const dayHeader = formatDayHeader(date, dayNumber);

        return (
          <React.Fragment key={date}>
            <DayGroup
              date={date}
              dayHeader={dayHeader}
              deadlines={dayDeadlines}
              onEdit={onEdit}
              onRefresh={onRefresh}
            />
            {idx === nowInsertAfterIndex && (
              <CurrentTimeLine />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
