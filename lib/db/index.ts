import "server-only";
import type { Db } from "./types";
import { supabaseDb } from "./supabase";
import { memoryDb } from "./memory";

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use Supabase whenever it's configured. Fall back to an in-memory store only outside
// production (local dev / load tests), or when PADE_MEMORY_DB=1 is set explicitly.
export function getDb(): Db | null {
  if (process.env.PADE_MEMORY_DB === "1") return memoryDb;
  if (hasSupabase) return supabaseDb;
  if (process.env.NODE_ENV !== "production") return memoryDb;
  return null;
}
