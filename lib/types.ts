// Deadline category types
export type DeadlineCategory =
  | "workshop"
  | "submission"
  | "food_perks"
  | "team"
  | "hackathon"
  | "ceremony"
  | "general";

// Deadline type (global = organizer-defined, team = participant-created)
export type DeadlineType = "global" | "team";

// Core Deadline entity
export interface Deadline {
  id: string;           // UUID v4
  title: string;
  date: string;         // ISO date: "2026-07-08"
  time: string;         // 24h time: "09:00"
  datetime: string;     // Full ISO 8601: "2026-07-08T09:00:00+07:00"
  category: DeadlineCategory;
  location?: string;
  description?: string;
  type: DeadlineType;
  teamName?: string;    // Only for type="team"
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

// In-app notification (in-memory only, not persisted)
export interface AppNotification {
  id: string;
  deadlineId: string;
  deadlineTitle: string;
  deadlineDatetime: string;
  proximityWindow: 15 | 30;  // minutes before deadline
  triggeredAt: string;        // ISO 8601
  read: boolean;
}

// Lowdb database schema
export interface DatabaseSchema {
  deadlines: Deadline[];
}

// Form input for creating/editing a deadline (no auto-generated fields)
export interface DeadlineFormInput {
  title: string;
  date: string;
  time: string;
  category: DeadlineCategory;
  location?: string;
  description?: string;
  teamName?: string;
}

// Parsed candidate from AI parser (before confirmation)
export interface ParsedCandidate {
  title: string;
  date: string;
  time: string;
  category: DeadlineCategory;
  location?: string;
  description?: string;
}

// API response wrappers
export interface DeadlinesApiResponse {
  deadlines: Deadline[];
}

export interface DeadlineApiResponse {
  deadline: Deadline;
}

export interface ParseApiResponse {
  candidates: ParsedCandidate[];
  rawResponse: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

// Filter state for the dashboard timeline
export type TimelineFilter = "all" | "global" | "team";

// Category display metadata
export interface CategoryMeta {
  label: string;
  color: string;        // Tailwind bg color class
  textColor: string;    // Tailwind text color class
  borderColor: string;  // Tailwind border color class
}
