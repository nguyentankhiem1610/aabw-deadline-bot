import { createClient } from "@supabase/supabase-js";
import type { Deadline } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getDeadlines(): Promise<Deadline[]> {
  const { data, error } = await supabase
    .from("deadlines")
    .select("*")
    .order("datetime", { ascending: true });
    
  if (error) {
    console.error("Supabase get error:", error);
    return [];
  }
  return data as Deadline[];
}

export async function createDeadline(deadline: Deadline): Promise<Deadline | null> {
  const { data, error } = await supabase
    .from("deadlines")
    .insert([deadline])
    .select()
    .single();
    
  if (error) {
    console.error("Supabase create error:", error);
    return null;
  }
  return data as Deadline;
}

export async function updateDeadline(id: string, updates: Partial<Deadline>): Promise<Deadline | null> {
  const { data, error } = await supabase
    .from("deadlines")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
    
  if (error) {
    console.error("Supabase update error:", error);
    return null;
  }
  return data as Deadline;
}

export async function deleteDeadline(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("deadlines")
    .delete()
    .eq("id", id);
    
  if (error) {
    console.error("Supabase delete error:", error);
    return false;
  }
  return true;
}
