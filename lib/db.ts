import path from "path";
import { JSONFilePreset } from "lowdb/node";
import type { DatabaseSchema } from "./types";

// Path to the persistent database file
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Lowdb instance (singleton via module-level promise)
let dbPromise: ReturnType<typeof JSONFilePreset<DatabaseSchema>> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = JSONFilePreset<DatabaseSchema>(DB_PATH, { deadlines: [] });
  }

  const db = await dbPromise;

  // Seed with mock data if database is empty
  if (db.data.deadlines.length === 0) {
    try {
      // Dynamically import mock data to avoid issues with Next.js bundling
      const mockDataPath = path.join(process.cwd(), "data", "mockData.json");
      const { readFileSync } = await import("fs");
      const mockData = JSON.parse(readFileSync(mockDataPath, "utf-8"));
      db.data.deadlines = Array.isArray(mockData) ? mockData : [];
      await db.write();
      console.log(`[DB] Seeded database with ${db.data.deadlines.length} mock deadlines`);
    } catch (error) {
      console.error("[DB] Failed to seed mock data:", error);
    }
  }

  return db;
}
