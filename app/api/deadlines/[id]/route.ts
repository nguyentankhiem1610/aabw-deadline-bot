import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { DeadlineCategory } from "@/lib/types";

const VALID_CATEGORIES: DeadlineCategory[] = [
  "workshop", "submission", "food_perks", "team", "hackathon", "ceremony", "general"
];

interface RouteContext {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await request.json();
    const db = await getDb();

    const index = db.data.deadlines.findIndex((d) => d.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
    }

    const existing = db.data.deadlines[index];

    // Validate fields if provided
    if (body.title !== undefined && !body.title?.trim()) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }
    if (body.date !== undefined && !body.date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return NextResponse.json({ error: "Invalid date format (YYYY-MM-DD)" }, { status: 400 });
    }
    if (body.time !== undefined && !body.time?.match(/^\d{2}:\d{2}$/)) {
      return NextResponse.json({ error: "Invalid time format (HH:MM)" }, { status: 400 });
    }
    if (body.category !== undefined && !VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Build updated datetime if date or time changed
    const newDate = body.date ?? existing.date;
    const newTime = body.time ?? existing.time;
    const newDatetime = `${newDate}T${newTime}:00+07:00`;

    const updated = {
      ...existing,
      title: body.title?.trim() ?? existing.title,
      date: newDate,
      time: newTime,
      datetime: newDatetime,
      category: body.category ?? existing.category,
      location: body.location !== undefined ? (body.location?.trim() || undefined) : existing.location,
      description: body.description !== undefined ? (body.description?.trim() || undefined) : existing.description,
      teamName: body.teamName !== undefined ? (body.teamName?.trim() || undefined) : existing.teamName,
      updatedAt: new Date().toISOString(),
    };

    db.data.deadlines[index] = updated;
    await db.write();

    return NextResponse.json({ deadline: updated });
  } catch (error) {
    console.error("[PUT /api/deadlines/:id]", error);
    return NextResponse.json({ error: "Failed to update deadline" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const db = await getDb();

    const index = db.data.deadlines.findIndex((d) => d.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
    }

    db.data.deadlines.splice(index, 1);
    await db.write();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/deadlines/:id]", error);
    return NextResponse.json({ error: "Failed to delete deadline" }, { status: 500 });
  }
}
