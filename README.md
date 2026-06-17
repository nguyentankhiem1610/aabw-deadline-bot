# AABW Smart Deadline Tracker & Reminder Bot

> **Builder Experience Award - Agentic AI Build Week 2026**
> Jul 8–12, 2026 · Ho Chi Minh City, Vietnam 

An AI-powered, production-ready web application that helps hackathon participants stay on top of every workshop, submission cut-off, food window, and team milestone across the 5-day AABW 2026 event - powered by **Groq** (ultra-fast LLM inference), a conversational AI agent with tool calling, smart schedule parsing, and real-time in-app alerts.

## Features

| Feature | Description |
|---|---|
| **Dashboard & Timeline** | Responsive dark-theme timeline showing 45+ pre-seeded AABW 2026 events, grouped by day with a live "NOW" indicator |
| **AI Schedule Parser** | Paste raw text from Telegram/Discord - Groq extracts events with title, date, time, category, and location via structured output |
| **AI Chat Agent** | Ask questions in natural language; the agent calls tools to query deadlines, get the next upcoming item, create or delete team deadlines |
| **Smart Notifications** | Automatic in-app alerts 30 min and 15 min before each deadline, deduped per browser session, with optional Web Push |
| **Team Deadlines** | Create, edit, and delete personalized team milestones alongside the official schedule |
| **Filter Tabs** | Switch between All / Event (global) / Team deadline views instantly |

## Quick Start

### Prerequisites

- **Node.js** ≥ 18.17
- **npm** ≥ 9
- A free **Groq API key** - get one at [console.groq.com/keys](https://console.groq.com/keys) (no credit card needed)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and set your Groq key:

```env
GROQ_API_KEY=gsk_your_key_here
AI_MODEL=llama-3.1-8b-instant
```

### X. Run code SQL
```sql

CREATE TABLE IF NOT EXISTS public.deadlines (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  datetime TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  description TEXT,
  type TEXT NOT NULL,
  "teamName" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.deadlines DISABLE ROW LEVEL SECURITY;
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - loads instantly with 45 pre-seeded AABW 2026 events. No database setup needed.

### 4. Build for production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | - | Groq API key from console.groq.com |
| `AI_MODEL` | No | `llama-3.1-8b-instant` | Chat model ID |
| `AI_PARSE_MODEL` | No | same as `AI_MODEL` | Model used for schedule parsing (use `llama-3.3-70b-versatile` for better accuracy) |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Base URL |
| `NEXT_PUBLIC_NOTIFICATION_POLL_INTERVAL` | No | `30000` | Notification polling interval in ms |

> If `GROQ_API_KEY` is missing, AI features return a descriptive error. The dashboard and timeline still work fully.

## Architecture

```
aabw-smart-deadline-tracker/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx                # Root layout (Inter font, dark theme, SWR)
│   ├── page.tsx                  # Home → DashboardShell
│   ├── globals.css               # Tailwind base + dark theme variables
│   ├── providers.tsx             # SWR global config
│   └── api/
│       ├── deadlines/route.ts    # GET + POST /api/deadlines
│       ├── deadlines/[id]/route.ts  # PUT + DELETE /api/deadlines/:id
│       ├── parse/route.ts        # POST /api/parse - AI schedule parser
│       └── chat/route.ts         # POST /api/chat - Groq agent with tools
│
├── components/
│   ├── ui/                       # Radix UI + CVA base components (Button, Dialog, etc.)
│   ├── dashboard/                # DashboardShell, TimelineView, DayGroup, TimelineItem, ...
│   ├── deadlines/                # DeadlineModal, ParseUploadModal
│   ├── chat/                     # ChatPanel, ChatMessages, ChatMessage, ChatInput
│   └── notifications/            # AlertTray, NotificationItem, NotificationPoller
│
├── hooks/
│   ├── useDeadlines.ts           # SWR hook with CRUD mutations
│   ├── useChat.ts                # useChat wrapper (streamMode="text" for Groq)
│   └── useNotifications.ts       # In-memory notification state + session dedup
│
├── lib/
│   ├── types.ts                  # All TypeScript interfaces
│   ├── db.ts                     # Lowdb singleton (auto-seeds from mockData.json)
│   └── utils.ts                  # Date helpers, category colors, sorting
│
└── data/
    ├── mockData.json             # 45 pre-seeded AABW 2026 events (read-only)
    └── db.json                   # Runtime database (auto-created, gitignored)
```

## AI Integration (Groq)

The app uses **Groq** as the AI backend via its OpenAI-compatible API (`https://api.groq.com/openai/v1`), accessed through `@ai-sdk/openai`'s `createOpenAI` with a custom `baseURL`. This avoids the streaming format incompatibilities of `@ai-sdk/groq` with `ai@3.3.x`.

### Chat Agent (`POST /api/chat`)

Uses `generateText` (not streaming) with `maxToolRoundtrips: 5` to fully resolve tool calls server-side, then streams the final text response as plain chunks. Client uses `streamMode: "text"`.

**4 tools available to the agent:**

| Tool | Description |
|---|---|
| `getDeadlines` | Filter by date, category, type, upcomingOnly |
| `getNextDeadline` | Returns the next deadline from now |
| `createDeadline` | Creates a team deadline, persists to Lowdb |
| `deleteDeadline` | Deletes by ID or partial title match |

**Example queries:**
```
"What is my next deadline?"
"What workshops are on July 9?"
"Where is the AWS workshop?"
"Add a team deadline: dry run at 9 PM tonight"
"Delete the dry run deadline"
```

### Schedule Parser (`POST /api/parse`)

Uses `generateObject` with a Zod schema for structured extraction. Recommended model: `llama-3.3-70b-versatile` via `AI_PARSE_MODEL` env var. Returns candidate events for user confirmation — nothing is auto-persisted.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/deadlines` | List all deadlines, sorted by datetime |
| `POST` | `/api/deadlines` | Create a team deadline |
| `PUT` | `/api/deadlines/:id` | Update a deadline |
| `DELETE` | `/api/deadlines/:id` | Delete a deadline |
| `POST` | `/api/parse` | AI-parse schedule from text |
| `POST` | `/api/chat` | Groq chat agent (plain text stream) |

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 14.2.5 |
| Language | TypeScript | 5.5.3 |
| Styling | Tailwind CSS | 3.4.6 |
| UI Components | Radix UI + class-variance-authority | - |
| Icons | Lucide React | 0.414.0 |
| Database | Lowdb (JSON file, zero config) | 7.0.1 |
| AI SDK | Vercel AI SDK | 3.3.15 |
| AI Provider | Groq (via OpenAI-compat endpoint) | - |
| LLM | llama-3.1-8b-instant (default) | - |
| Data Fetching | SWR | 2.2.5 |
| Validation | Zod | 3.23.8 |

## Why Groq?

- **Free tier** - perfect for hackathon demos, no credit card required
- **Ultra-fast inference** ~100ms response time, even with tool calls
- **OpenAI-compatible API** - drop-in with `createOpenAI({ baseURL: "https://api.groq.com/openai/v1" })`
- **LLaMA 3.1 8B** supports function calling, adequate for deadline queries

## How It Solves the Builder Experience Problem

During AABW, information overload is constant — announcements hit Telegram, Discord, printed schedules, and verbal updates. Teams regularly miss food windows, workshops, and submission deadlines while deep in coding sessions.

This tool addresses that by:

1. **Pre-seeding 45 official events** - participants have the full schedule on Day 1, zero setup
2. **AI parsing new announcements** - paste a Telegram message, AI extracts and adds new events instantly
3. **Conversational lookup** - ask "Where is the MongoDB workshop?" instead of scrolling a PDF
4. **Automatic 15/30-minute alerts** - never miss a food window or submission deadline again
