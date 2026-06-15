import { NextRequest } from "next/server";
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import { sortDeadlines, getNextDeadline } from "@/lib/utils";
import type { DeadlineCategory, Deadline } from "@/lib/types";

function getAiModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Please add it to .env.local"
    );
  }
  return openai(process.env.AI_MODEL ?? "gpt-4o-mini");
}

const SYSTEM_PROMPT = `You are a helpful deadline tracking assistant for AABW 2026 (Agentic AI Build Week), a 5-day hackathon event held July 8-12, 2026 in Ho Chi Minh City, Vietnam.

You help event participants by:
- Answering questions about the event schedule, workshop times, and locations
- Finding upcoming deadlines relative to the current time
- Creating team-specific deadlines
- Deleting team deadlines when requested

You have access to these tools:
- getDeadlines: Search and filter all deadlines
- getNextDeadline: Get the very next upcoming deadline
- createDeadline: Create a new team deadline
- deleteDeadline: Delete a team deadline by ID or title

Guidelines:
- Always be concise and specific in your responses
- When mentioning times, use the format "9:00 AM" (not 24h)
- When a user asks "what's my next deadline", use the getNextDeadline tool
- When a user asks about a specific date or category, use getDeadlines with filters
- When creating a deadline, confirm the details back to the user
- When deleting, first search for the deadline to confirm you found the right one
- If you're unsure of the intent, ask a clarifying question
- The current date and time is provided as context in each message`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let model;
    try {
      model = getAiModel();
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI configuration error";
      return new Response(JSON.stringify({ error: message }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = streamText({
      model,
      system: `${SYSTEM_PROMPT}\n\nCurrent time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "full", timeStyle: "short" })} (Ho Chi Minh City, UTC+7)`,
      messages,
      tools: {
        getDeadlines: tool({
          description: "Get all deadlines, optionally filtered by date, category, or type. Use this to answer questions about what events are on a specific day or of a specific type.",
          parameters: z.object({
            date: z.string().optional().describe("Filter by date in YYYY-MM-DD format"),
            category: z
              .enum(["workshop", "submission", "food_perks", "team", "hackathon", "ceremony", "general"])
              .optional()
              .describe("Filter by deadline category"),
            type: z.enum(["global", "team"]).optional().describe("Filter by global or team deadline"),
            upcomingOnly: z.boolean().optional().describe("Only return future deadlines"),
          }),
          execute: async ({ date, category, type, upcomingOnly }) => {
            const db = await getDb();
            let deadlines = sortDeadlines(db.data.deadlines);

            if (date) {
              deadlines = deadlines.filter((d) => d.date === date);
            }
            if (category) {
              deadlines = deadlines.filter((d) => d.category === category);
            }
            if (type) {
              deadlines = deadlines.filter((d) => d.type === type);
            }
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
                time: d.time,
                category: d.category,
                location: d.location,
                type: d.type,
                teamName: d.teamName,
              })),
            };
          },
        }),

        getNextDeadline: tool({
          description: "Get the single next upcoming deadline relative to the current time. Use when the user asks 'what is my next deadline?' or similar.",
          parameters: z.object({}),
          execute: async () => {
            const db = await getDb();
            const next = getNextDeadline(db.data.deadlines);
            if (!next) {
              return { found: false, message: "There are no upcoming deadlines." };
            }
            return {
              found: true,
              deadline: {
                id: next.id,
                title: next.title,
                date: next.date,
                time: next.time,
                category: next.category,
                location: next.location,
                type: next.type,
              },
            };
          },
        }),

        createDeadline: tool({
          description: "Create a new TEAM deadline. Use this when the user explicitly asks to add, create, or set a personal or team deadline.",
          parameters: z.object({
            title: z.string().describe("Title of the deadline"),
            date: z.string().describe("Date in YYYY-MM-DD format"),
            time: z.string().describe("Time in HH:MM 24-hour format"),
            category: z
              .enum(["workshop", "submission", "food_perks", "team", "hackathon", "ceremony", "general"])
              .optional()
              .default("team")
              .describe("Category — defaults to 'team'"),
            location: z.string().optional().describe("Optional location or venue"),
            description: z.string().optional().describe("Optional description"),
            teamName: z.string().optional().describe("Optional team name"),
          }),
          execute: async ({ title, date, time, category, location, description, teamName }) => {
            if (!title || !date || !time) {
              return { success: false, error: "title, date, and time are required" };
            }
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
            const db = await getDb();
            db.data.deadlines.push(newDeadline);
            await db.write();
            return {
              success: true,
              deadline: {
                id: newDeadline.id,
                title: newDeadline.title,
                date: newDeadline.date,
                time: newDeadline.time,
                category: newDeadline.category,
                location: newDeadline.location,
              },
            };
          },
        }),

        deleteDeadline: tool({
          description: "Delete a TEAM deadline by its ID or title. Only team deadlines can be deleted. Use this when the user asks to remove or delete a deadline.",
          parameters: z.object({
            id: z.string().optional().describe("The exact ID of the deadline to delete"),
            title: z.string().optional().describe("Title to search for (partial match, case-insensitive)"),
          }),
          execute: async ({ id, title }) => {
            const db = await getDb();

            let target: Deadline | undefined;
            if (id) {
              target = db.data.deadlines.find((d) => d.id === id && d.type === "team");
            } else if (title) {
              target = db.data.deadlines.find(
                (d) => d.type === "team" && d.title.toLowerCase().includes(title.toLowerCase())
              );
            }

            if (!target) {
              return {
                success: false,
                error: id
                  ? `No team deadline found with ID: ${id}`
                  : `No team deadline found matching: "${title}"`,
              };
            }

            db.data.deadlines = db.data.deadlines.filter((d) => d.id !== target!.id);
            await db.write();
            return {
              success: true,
              deleted: { id: target.id, title: target.title },
            };
          },
        }),
      },
      maxSteps: 5, // Allow up to 5 tool call + response cycles
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[POST /api/chat]", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
