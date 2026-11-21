import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MatchRow, Profile, Stats } from "../types";
import type { Candidate, Db } from "./types";

const CANDIDATE_COLS = "id,name,emoji,interests,goal,fun_pick,is_demo";
const MATCH_COLS = "id,user_id,matched_user_id,icebreaker,found,created_at";

let client: SupabaseClient | null = null;

function sb(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars are missing");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      // Never hang a request on the database: 8s hard cap per call.
      fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(8000) }),
    },
  });
  return client;
}

function check<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return res.data as T;
}

export const supabaseDb: Db = {
  kind: "supabase",

  async createProfile(p) {
    return check(await sb().from("profiles").insert(p).select("*").single()) as Profile;
  },

  async getProfile(id) {
    return check(await sb().from("profiles").select("*").eq("id", id).maybeSingle()) as Profile | null;
  },

  async recentCandidates(excludeId, limit) {
    return check(
      await sb().from("profiles").select(CANDIDATE_COLS).neq("id", excludeId).order("created_at", { ascending: false }).limit(limit),
    ) as Candidate[];
  },

  async matchedIds(userId) {
    const rows = check(await sb().from("matches").select("matched_user_id").eq("user_id", userId).limit(1000)) as {
      matched_user_id: string;
    }[];
    return rows.map((r) => r.matched_user_id);
  },

  async lastMatchAt(userId) {
    const rows = check(
      await sb().from("matches").select("created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    ) as { created_at: string }[];
    return rows[0] ? Date.parse(rows[0].created_at) : null;
  },

  async insertMatch(m) {
    const res = await sb().from("matches").insert(m).select(MATCH_COLS).single();
    if (res.error?.code === "23505") return null; // unique violation: pair already exists
    return check(res) as MatchRow;
  },

  async matchesBy(userId, limit) {
    return check(
      await sb().from("matches").select(MATCH_COLS).eq("user_id", userId).order("created_at", { ascending: false }).limit(limit),
    ) as MatchRow[];
  },

  async matchesOf(userId, limit) {
    return check(
      await sb().from("matches").select(MATCH_COLS).eq("matched_user_id", userId).order("created_at", { ascending: false }).limit(limit),
    ) as MatchRow[];
  },

  async profilesByIds(ids) {
    if (!ids.length) return [];
    return check(await sb().from("profiles").select(CANDIDATE_COLS).in("id", ids)) as Candidate[];
  },

  async markFound(matchId, profileId) {
    const rows = check(
      await sb()
        .from("matches")
        .update({ found: true })
        .eq("id", matchId)
        .or(`user_id.eq.${profileId},matched_user_id.eq.${profileId}`)
        .select(MATCH_COLS),
    ) as MatchRow[];
    return rows[0] ?? null;
  },

  async stats() {
    const rpc = await sb().rpc("pade_stats");
    if (!rpc.error && rpc.data) return rpc.data as Stats;
    // Fallback if the function wasn't created: three cheap head counts.
    const [people, demo, matches, found] = await Promise.all([
      sb().from("profiles").select("id", { count: "exact", head: true }).eq("is_demo", false),
      sb().from("profiles").select("id", { count: "exact", head: true }).eq("is_demo", true),
      sb().from("matches").select("id", { count: "exact", head: true }),
      sb().from("matches").select("id", { count: "exact", head: true }).eq("found", true),
    ]);
    return { people: people.count ?? 0, demo: demo.count ?? 0, matches: matches.count ?? 0, found: found.count ?? 0 };
  },
};
