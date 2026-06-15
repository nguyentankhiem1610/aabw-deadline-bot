import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isWithinInterval, addMinutes, parseISO } from "date-fns";
import type { DeadlineCategory, CategoryMeta, Deadline } from "./types";

// ============================================================
// Tailwind class merging utility (shadcn/ui pattern)
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// Category metadata: colors, labels
// ============================================================
export const CATEGORY_META: Record<DeadlineCategory, CategoryMeta> = {
  workshop: {
    label: "Workshop",
    color: "bg-blue-500/20",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/40",
  },
  submission: {
    label: "Submission",
    color: "bg-red-500/20",
    textColor: "text-red-400",
    borderColor: "border-red-500/40",
  },
  food_perks: {
    label: "Food & Perks",
    color: "bg-green-500/20",
    textColor: "text-green-400",
    borderColor: "border-green-500/40",
  },
  team: {
    label: "Team",
    color: "bg-purple-500/20",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/40",
  },
  hackathon: {
    label: "Hackathon",
    color: "bg-orange-500/20",
    textColor: "text-orange-400",
    borderColor: "border-orange-500/40",
  },
  ceremony: {
    label: "Ceremony",
    color: "bg-yellow-500/20",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500/40",
  },
  general: {
    label: "General",
    color: "bg-gray-500/20",
    textColor: "text-gray-400",
    borderColor: "border-gray-500/40",
  },
};

export function getCategoryMeta(category: DeadlineCategory): CategoryMeta {
  return CATEGORY_META[category] ?? CATEGORY_META.general;
}

// ============================================================
// Date / time formatting helpers
// ============================================================

/** Format a datetime string for display: "Wed, Jul 8 at 9:00 AM" */
export function formatDeadlineDateTime(datetime: string): string {
  try {
    const date = parseISO(datetime);
    return format(date, "EEE, MMM d 'at' h:mm a");
  } catch {
    return datetime;
  }
}

/** Format just the date: "Wednesday, July 8, 2026" */
export function formatDeadlineDate(date: string): string {
  try {
    // Parse as local date (no timezone shift for date-only strings)
    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return format(d, "EEEE, MMMM d, yyyy");
  } catch {
    return date;
  }
}

/** Format day header: "Day 1 · Wednesday, July 8" */
export function formatDayHeader(date: string, dayNumber?: number): string {
  try {
    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const dayLabel = dayNumber != null ? `Day ${dayNumber} · ` : "";
    return `${dayLabel}${format(d, "EEEE, MMMM d")}`;
  } catch {
    return date;
  }
}

/** Format just the time: "9:00 AM" */
export function formatTime(time: string): string {
  try {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date(2000, 0, 1, hours, minutes);
    return format(d, "h:mm a");
  } catch {
    return time;
  }
}

/** Returns a human-readable relative time: "in 25 minutes", "2 hours ago" */
export function formatTimeRemaining(datetime: string): string {
  try {
    const date = parseISO(datetime);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "";
  }
}

/** Returns the exact number of minutes until a deadline (negative if past) */
export function minutesUntilDeadline(datetime: string): number {
  try {
    const date = parseISO(datetime);
    return Math.floor((date.getTime() - Date.now()) / 60000);
  } catch {
    return Infinity;
  }
}

// ============================================================
// Deadline state helpers
// ============================================================

/** Returns true if the deadline datetime is in the past */
export function isDeadlinePast(datetime: string): boolean {
  try {
    return isPast(parseISO(datetime));
  } catch {
    return false;
  }
}

/** Returns true if the deadline is within `windowMinutes` of now */
export function isDeadlineApproaching(datetime: string, windowMinutes: 15 | 30): boolean {
  try {
    const date = parseISO(datetime);
    const now = new Date();
    return isWithinInterval(date, { start: now, end: addMinutes(now, windowMinutes) });
  } catch {
    return false;
  }
}

/** Sorts deadlines chronologically by datetime */
export function sortDeadlines(deadlines: Deadline[]): Deadline[] {
  return [...deadlines].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
}

/** Returns the next upcoming deadline relative to now, or null if none */
export function getNextDeadline(deadlines: Deadline[]): Deadline | null {
  const now = new Date();
  const upcoming = deadlines
    .filter((d) => new Date(d.datetime) > now)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  return upcoming[0] ?? null;
}

/** Groups deadlines by date string ("YYYY-MM-DD"), preserving chronological order within groups */
export function groupDeadlinesByDate(deadlines: Deadline[]): Map<string, Deadline[]> {
  const sorted = sortDeadlines(deadlines);
  const groups = new Map<string, Deadline[]>();
  for (const deadline of sorted) {
    const group = groups.get(deadline.date) ?? [];
    group.push(deadline);
    groups.set(deadline.date, group);
  }
  return groups;
}

/** Build a unique dedup key for notification tracking */
export function buildNotificationKey(deadlineId: string, window: 15 | 30): string {
  return `${deadlineId}:${window}`;
}

// ============================================================
// AABW event day helpers
// ============================================================

const EVENT_DAYS: Record<string, number> = {
  "2026-07-08": 1,
  "2026-07-09": 2,
  "2026-07-10": 3,
  "2026-07-11": 4,
  "2026-07-12": 5,
};

export function getEventDayNumber(date: string): number | undefined {
  return EVENT_DAYS[date];
}
