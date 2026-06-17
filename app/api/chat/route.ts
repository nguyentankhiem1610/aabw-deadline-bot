import { NextRequest } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool, StreamingTextResponse, OpenAIStream } from "ai";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { getDeadlines, createDeadline, deleteDeadline } from "@/lib/db";
import { sortDeadlines, getNextDeadline, formatTime } from "@/lib/utils";
import type { DeadlineCategory, Deadline } from "@/lib/types";

// ---------------------------------------------------------------------------
// Groq via OpenAI-compatible API
// ---------------------------------------------------------------------------
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set in .env.local");
  return createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey,
  });
}

// ---------------------------------------------------------------------------
// Tool executors
// ---------------------------------------------------------------------------
const TOOLS = {
  getDeadlines: tool({
    description:
      "Get all deadlines, optionally filtered by date (YYYY-MM-DD), category, type (global|team), or upcomingOnly boolean.",
    parameters: z.object({
      date: z.string().optional(),
      category: z
        .enum(["workshop", "submission", "food_perks", "team", "hackathon", "ceremony", "general"])
        .optional(),
      type: z.enum(["global", "team"]).optional(),
      upcomingOnly: z.boolean().optional(),
    }),
    execute: async ({ date, category, type, upcomingOnly }) => {
      const dbDeadlines = await getDeadlines();
      let deadlines = sortDeadlines(dbDeadlines);
      if (date) deadlines = deadlines.filter((d) => d.date === date);
      if (category) deadlines = deadlines.filter((d) => d.category === category);
      if (type) deadlines = deadlines.filter((d) => d.type === type);
      if (upcomingOnly) {
        const now = new Date();
        deadlines = deadlines.filter((d) => new Date(d.datetime) > now);
      }
      return {
        count: deadlines.length,
        deadlines: deadlines.map((d) => ({
          id: d.id,
          title: d.title,
          date: d.date,
          time: formatTime(d.time),
          category: d.category,
          location: d.location ?? null,
          type: d.type,
          teamName: d.teamName ?? null,
        })),
      };
    },
  }),

  getNextDeadline: tool({
    description:
      "Get the single next upcoming deadline from the current time. Use when user asks 'what is my next deadline?'",
    parameters: z.object({
      _dummy: z.string().optional()
    }),
    execute: async () => {
      const dbDeadlines = await getDeadlines();
      const next = getNextDeadline(dbDeadlines);
      if (!next) return { found: false, message: "No upcoming deadlines." };
      return {
        found: true,
        deadline: {
          id: next.id,
          title: next.title,
          date: next.date,
          time: formatTime(next.time),
          category: next.category,
          location: next.location ?? null,
          type: next.type,
        },
      };
    },
  }),

  createDeadline: tool({
    description: "Create a new TEAM deadline. Use when user asks to add or set a deadline.",
    parameters: z.object({
      title: z.string(),
      date: z.string().describe("YYYY-MM-DD"),
      time: z.string().describe("HH:MM 24-hour"),
      category: z
        .enum(["workshop", "submission", "food_perks", "team", "hackathon", "ceremony", "general"])
        .default("team"),
      location: z.string().optional(),
      description: z.string().optional(),
      teamName: z.string().optional(),
    }),
    execute: async ({ title, date, time, category, location, description, teamName }) => {
      const datetime = `${date}T${time}:00+07:00`;
      const now = new Date().toISOString();
      const newDeadline: Deadline = {
        id: uuidv4(),
        title,
        date,
        time,
        datetime,
        category: (category as DeadlineCategory) ?? "team",
        location,
        description,
        type: "team",
        teamName,
        createdAt: now,
        updatedAt: now,
      };
      const created = await createDeadline(newDeadline);
      if (!created) {
        return { success: false, error: "Failed to create deadline in Supabase" };
      }
      return {
        success: true,
        deadline: {
          id: created.id,
          title: created.title,
          date: created.date,
          time: formatTime(created.time),
          category: created.category,
          location: created.location ?? null,
        },
      };
    },
  }),

  deleteDeadline: tool({
    description:
      "Delete a TEAM deadline by ID or partial title match. Only team deadlines can be deleted.",
    parameters: z.object({
      id: z.string().optional(),
      title: z.string().optional().describe("Partial match, case-insensitive"),
    }),
    execute: async ({ id, title }) => {
      const dbDeadlines = await getDeadlines();
      let target: Deadline | undefined;
      if (id) target = dbDeadlines.find((d) => d.id === id && d.type === "team");
      else if (title)
        target = dbDeadlines.find(
          (d) => d.type === "team" && d.title.toLowerCase().includes(title.toLowerCase())
        );
      if (!target)
        return { success: false, error: `No team deadline found matching: "${id ?? title}"` };
      const success = await deleteDeadline(target.id);
      if (!success) {
        return { success: false, error: "Failed to delete deadline from Supabase" };
      }
      return { success: true, deleted: { id: target.id, title: target.title } };
    },
  }),
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
function buildSystemPrompt() {
  return `You are a helpful deadline tracking assistant for AABW 2026 (Agentic AI Build Week), a 5-day hackathon held July 8-12, 2026 in Ho Chi Minh City, Vietnam (UTC+7).

You help participants by answering questions about the schedule, finding deadlines, and creating/deleting team deadlines using your tools.

Current time: ${new Date().toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "short",
  })} (Ho Chi Minh City, UTC+7)

Rules:
- Always use tools to answer deadline questions — never guess
- After calling a tool, summarize the result in plain conversational language
- Times should use AM/PM format (e.g. "9:00 AM")
- Be concise and helpful`;
}

// ---------------------------------------------------------------------------
// Route: POST /api/chat
// Uses generateText (not streamText) with tool calling, then streams the final text
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY is not set in .env.local" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
    });
    const modelId = process.env.AI_MODEL ?? "llama-3.1-8b-instant";
    const model = groq(modelId);

    // Use generateText with maxToolRoundtrips to fully resolve tool calls server-side
    const result = await generateText({
      model,
      system: buildSystemPrompt(),
      messages,
      tools: TOOLS,
      maxToolRoundtrips: 5,
    });

    // Stream the final text response back to the client
    const textContent = result.text || "I couldn't generate a response. Please try again.";

    // Create a simple text stream compatible with useChat streamMode="text"
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Stream in chunks to simulate streaming
        const words = textContent.split(" ");
        let i = 0;
        const push = () => {
          if (i < words.length) {
            const chunk = (i === 0 ? "" : " ") + words[i];
            controller.enqueue(encoder.encode(chunk));
            i++;
            setTimeout(push, 0);
          } else {
            controller.close();
          }
        };
        push();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[POST /api/chat]", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
