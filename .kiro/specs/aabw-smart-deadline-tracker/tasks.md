# Implementation Plan: AABW Smart Deadline Tracker & Reminder Bot

## Overview

This implementation plan covers building the full AABW Smart Deadline Tracker & Reminder Bot from scratch. Tasks are grouped by layer (config → data → backend → UI → AI → notifications) so each group builds on the previous. The project uses Next.js 14 App Router, TypeScript, Tailwind CSS, Lowdb, Vercel AI SDK, and OpenAI GPT-4o-mini.

## Tasks

- [x] 1. Project scaffolding and configuration
  - [x] 1.1 Initialize Next.js 14 App Router project with TypeScript and Tailwind CSS
  - [x] 1.2 Install and configure all dependencies (Lowdb, Vercel AI SDK, Zod, SWR, Lucide React, uuid)
  - [x] 1.3 Create `.env.example` and `next.config.ts` with required environment variable documentation
  - [x] 1.4 Set up `tsconfig.json` path aliases and Tailwind config with custom color tokens

- [x] 2. Core data layer
  Depends on: 1
  - [x] 2.1 Define all TypeScript interfaces in `lib/types.ts` (Deadline, AppNotification, DatabaseSchema, DeadlineCategory)
  - [x] 2.2 Create `data/mockData.json` with 30+ pre-seeded AABW 2026 deadlines across all 5 days
  - [x] 2.3 Create `lib/db.ts` Lowdb singleton with seed-on-empty initialization from mockData.json
  - [x] 2.4 Create `lib/utils.ts` with date formatting, time-remaining, and category color helpers

- [x] 3. Backend API routes
  Depends on: 2
  - [x] 3.1 Implement `GET /api/deadlines` and `POST /api/deadlines` in `app/api/deadlines/route.ts`
  - [x] 3.2 Implement `PUT /api/deadlines/[id]` and `DELETE /api/deadlines/[id]` in `app/api/deadlines/[id]/route.ts`
  - [x] 3.3 Implement `POST /api/parse` AI schedule smart-parser with Vercel AI SDK `generateObject` and Zod schema
  - [x] 3.4 Implement `POST /api/chat` streaming chat agent with Vercel AI SDK `streamText` and four tool definitions

- [ ] 4. Shadcn/ui base components
  Depends on: 1
  - [ ] 4.1 Create `components/ui/button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`, `dialog.tsx`, `toast.tsx`

- [ ] 5. Dashboard and timeline UI
  Depends on: 2, 4
  - [~] 5.1 Create `app/layout.tsx` root layout with Inter font, metadata, and Providers wrapper
  - [~] 5.2 Create `app/globals.css` with Tailwind directives and custom CSS variables for dark theme
  - [~] 5.3 Create `app/page.tsx` server component shell that imports DashboardShell
  - [~] 5.4 Create `components/dashboard/DashboardShell.tsx` client component with main state and layout
  - [~] 5.5 Create `components/dashboard/FilterBar.tsx` with All / Global / Team filter tabs
  - [~] 5.6 Create `components/dashboard/TimelineView.tsx` and `DayGroup.tsx` grouping deadlines by date
  - [~] 5.7 Create `components/dashboard/TimelineItem.tsx` with category color badges and location display
  - [~] 5.8 Create `components/dashboard/CurrentTimeLine.tsx` animated "now" indicator inserted between past/future items

- [ ] 6. Deadline management modals
  Depends on: 4, 5
  - [~] 6.1 Create `components/deadlines/DeadlineModal.tsx` create/edit form with Zod client validation
  - [~] 6.2 Create `components/deadlines/ParseUploadModal.tsx` two-tab (text/image) upload with AI preview and per-item confirmation

- [ ] 7. Chat agent UI
  Depends on: 3, 4
  - [~] 7.1 Create `components/chat/ChatPanel.tsx` slide-in panel with open/close animation
  - [~] 7.2 Create `components/chat/ChatMessages.tsx` scrollable history with auto-scroll
  - [~] 7.3 Create `components/chat/ChatMessage.tsx` message bubble (user vs assistant styling)
  - [~] 7.4 Create `components/chat/ChatInput.tsx` with Enter-to-send and Shift+Enter newline

- [ ] 8. Notification system
  Depends on: 3, 4
  - [~] 8.1 Create `hooks/useNotifications.ts` notification state with issued-key dedup Set
  - [~] 8.2 Create `components/notifications/NotificationPoller.tsx` client component with 30s interval polling
  - [~] 8.3 Create `components/notifications/AlertTray.tsx` bell icon with badge count and popover list
  - [~] 8.4 Create `components/notifications/NotificationItem.tsx` single alert row with dismiss button

- [ ] 9. SWR hooks
  Depends on: 3
  - [~] 9.1 Create `hooks/useDeadlines.ts` SWR hook with optimistic create/update/delete mutations
  - [~] 9.2 Create `hooks/useChat.ts` Vercel AI SDK `useChat` wrapper with error handling

- [ ] 10. App providers and context
  Depends on: 8, 9
  - [~] 10.1 Create `app/providers.tsx` wrapping SWR provider and notification context

- [ ] 11. README and documentation
  Depends on: 1
  - [~] 11.1 Write comprehensive `README.md` with installation, environment setup, feature walkthrough, and architecture overview

## Task Dependency Graph

```
1 (scaffolding)
├── 2 (data layer)
│   └── 3 (API routes)
│       ├── 7 (chat UI)
│       ├── 8 (notifications)
│       └── 9 (SWR hooks)
│           └── 10 (providers)
├── 4 (UI base components)
│   ├── 5 (dashboard UI) ← also depends on 2
│   │   └── 6 (modals) ← also depends on 4
│   ├── 7 (chat UI) ← also depends on 3
│   └── 8 (notifications) ← also depends on 3
└── 11 (README)
```

## Notes

- All LLM API calls are gated behind environment variable checks; the app gracefully degrades if keys are missing.
- The Lowdb database auto-seeds from mockData.json on first run, so no manual DB setup is needed.
- Notification deduplication is session-scoped (in-memory React state), not persisted across page refreshes by design.
- The parse endpoint returns candidates for user confirmation — it never auto-persists to avoid unwanted data injection.
