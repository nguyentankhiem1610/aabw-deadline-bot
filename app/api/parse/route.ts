import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Validate environment and return configured model
function getAiModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Please configure your API key in .env.local"
    );
  }
  const modelId = process.env.AI_MODEL ?? "gpt-4o-mini";
  return openai(modelId);
}

// Zod schema for structured extraction
const ParsedEventSchema = z.object({
  events: z
    .array(
      z.object({
        title: z
          .string()
          .min(1)
          .describe("Name or title of the event or deadline"),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe("Date in YYYY-MM-DD format"),
        time: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .describe("Time in HH:MM 24-hour format"),
        category: z
          .enum([
            "workshop",
            "submission",
            "food_perks",
            "team",
            "hackathon",
            "ceremony",
            "general",
          ])
          .describe("Category of the event"),
        location: z
          .string()
          .optional()
          .describe("Venue or location name"),
        description: z
          .string()
          .optional()
          .describe("Brief description of the event"),
      })
    )
    .describe("List of extracted events and deadlines"),
  summary: z
    .string()
    .describe("Brief summary of what was found in the input"),
});

const SYSTEM_PROMPT = `You are an expert schedule parser for the AABW (Agentic AI Build Week) 2026 event in Ho Chi Minh City (July 8-12, 2026, UTC+7).

Extract ALL events, deadlines, workshops, and time-sensitive activities from the provided input.

For each event, extract:
- title: The name of the event (required)
- date: Must be YYYY-MM-DD format (required). If no year is given, assume 2026. If no specific date, skip the event.
- time: Must be HH:MM in 24-hour format (required). Convert "3pm" → "15:00", "9am" → "09:00". If no time, skip.
- category: Choose from "workshop", "submission", "food_perks", "team", "hackathon", "ceremony", "general"
  - workshop: any hands-on session, tutorial, or presentation
  - submission: deadlines for submitting work, demos, or forms
  - food_perks: meals, snacks, drinks, free perks
  - hackathon: hacking sessions, building time, team activities
  - ceremony: opening, closing, awards, keynotes
  - general: anything that doesn't fit above
- location: venue or room name if mentioned
- description: 1-2 sentence description if context is available

Rules:
- ONLY extract events with deterministic dates AND times
- Skip events with vague timing like "sometime tomorrow" or "TBD"
- If timezone is not specified, assume UTC+7 (Ho Chi Minh City)
- Deduplicate events with the same title and time`;

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, mimeType } = body as {
      type: "text" | "image";
      content: string;
      mimeType?: string;
    };

    if (!type || !content) {
      return NextResponse.json(
        { error: "Request must include 'type' (text|image) and 'content'" },
        { status: 400 }
      );
    }

    // Validate image size for base64 content
    if (type === "image") {
      // Base64 string length * 0.75 ≈ actual byte size
      const estimatedBytes = content.length * 0.75;
      if (estimatedBytes > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error:
              "Image file exceeds the 10 MB size limit. Please use a smaller image.",
          },
          { status: 400 }
        );
      }
      if (
        !mimeType ||
        !["image/jpeg", "image/png", "image/webp"].includes(mimeType)
      ) {
        return NextResponse.json(
          {
            error:
              "Unsupported image format. Please use JPEG, PNG, or WebP.",
          },
          { status: 400 }
        );
      }
    }

    // Get AI model (throws if API key missing)
    let model;
    try {
      model = getAiModel();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "AI configuration error";
      return NextResponse.json({ error: message }, { status: 503 });
    }

    // Build message content based on input type
    const userContent =
      type === "text"
        ? [
            {
              type: "text" as const,
              text: `Please extract all events and deadlines from this schedule:\n\n${content}`,
            },
          ]
        : [
            {
              type: "text" as const,
              text: "Please extract all events and deadlines from this schedule image:",
            },
            {
              type: "image" as const,
              image: content.startsWith("data:")
                ? content
                : `data:${mimeType};base64,${content}`,
            },
          ];

    // Call LLM with structured output
    const result = await generateObject({
      model,
      schema: ParsedEventSchema,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const { events, summary } = result.object;

    if (!events || events.length === 0) {
      return NextResponse.json({
        candidates: [],
        rawResponse:
          summary ||
          "No events could be extracted from the provided input. Please ensure the text contains event names, dates, and times.",
      });
    }

    return NextResponse.json({
      candidates: events,
      rawResponse: summary,
    });
  } catch (error) {
    console.error("[POST /api/parse]", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: `Failed to parse schedule: ${message}` },
      { status: 500 }
    );
  }
}
