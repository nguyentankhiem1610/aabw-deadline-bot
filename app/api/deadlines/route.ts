import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import { sortDeadlines } from "@/lib/utils";
import type { Deadline, DeadlineFormInput, DeadlineCategory } from "@/lib/types";

const VALID_CATEGORIES: DeadlineCategory[] = [
  "workshop", "submission", "food_perks", "team", "hackathon", "ceremony", "general"
];

export async function GET() {
  try {
    const db = await getDb();
    const deadlines = sortDeadlines(db.data.deadlines);
    return NextResponse.json({ deadlines });
  } catch (error) {
    console.error("[GET /api/deadlines]", error);
    return NextResponse.json({ error: "Failed to fetch deadlines" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DeadlineFormInput = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!body.date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return NextResponse.json({ error: "Date is required (YYYY-MM-DD format)" }, { status: 400 });
    }
    if (!body.time?.match(/^\d{2}:\d{2}$/)) {
      return NextResponse.json({ error: "Time is required (HH:MM format)" }, { status: 400 });
    }
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Valid category is required" }, { status: 400 });
    }

    // Build the full datetime ISO string (UTC+7)
    const datetime = `${body.date}T${body.time}:00+07:00`;
    const now = new Date().toISOString();

    const newDeadline: Deadline = {
      id: uuidv4(),
      title: body.title.trim(),
      date: body.date,
      time: body.time,
      datetime,
      category: body.category,
      location: body.location?.trim() || undefined,
      description: body.description?.trim() || undefined,
      type: "team",
      teamName: body.teamName?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    db.data.deadlines.push(newDeadline);
    await db.write();

    return NextResponse.json({ deadline: newDeadline }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/deadlines]", error);
    return NextResponse.json({ error: "Failed to create deadline" }, { status: 500 });
  }
}
