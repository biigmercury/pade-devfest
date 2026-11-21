import "server-only";
import type { MatchRow, Profile } from "../types";
import type { Candidate, Db } from "./types";
import demoProfiles from "../../scripts/demo-profiles.json";

// In-memory store for local development and load testing when Supabase isn't configured.
// Never used in production (see lib/db/index.ts).

type Store = { profiles: Profile[]; byId: Map<string, Profile>; matches: MatchRow[]; pairs: Set<string> };
const g = globalThis as unknown as { __padeMem?: Store };
const store: Store = (g.__padeMem ??= seeded());

// Start with the same 30 demo profiles the Supabase seed script inserts.
function seeded(): Store {
  const t0 = Date.now() - 3600_000;
  const profiles: Profile[] = demoProfiles.map((p, i) => ({
    ...p,
    id: crypto.randomUUID(),
    is_demo: true,
    created_at: new Date(t0 + i * 1000).toISOString(),
  }));
  return { profiles, byId: new Map(profiles.map((p) => [p.id, p])), matches: [], pairs: new Set() };
}

const pick = (p: Profile): Candidate => ({
  id: p.id, name: p.name, emoji: p.emoji, interests: p.interests, goal: p.goal, fun_pick: p.fun_pick, is_demo: p.is_demo,
});

// Simulate a little network latency so the UI's loading states are visible locally.
const tick = () => new Promise((r) => setTimeout(r, 15 + Math.random() * 25));

export const memoryDb: Db = {
  kind: "memory",
  async createProfile(p) {
    await tick();
    const row: Profile = { id: crypto.randomUUID(), is_demo: false, ...p, created_at: new Date().toISOString() };
    store.profiles.push(row);
    store.byId.set(row.id, row);
    return row;
  },
  async getProfile(id) {
    await tick();
    return store.byId.get(id) ?? null;
  },
  async recentCandidates(excludeId, limit) {
    await tick();
    const out: Candidate[] = [];
    for (let i = store.profiles.length - 1; i >= 0 && out.length < limit; i--) {
      const p = store.profiles[i];
      if (p.id !== excludeId) out.push(pick(p));
    }
    return out;
  },
  async matchedIds(userId) {
    await tick();
    return store.matches.filter((m) => m.user_id === userId).map((m) => m.matched_user_id);
  },
  async lastMatchAt(userId) {
    await tick();
    for (let i = store.matches.length - 1; i >= 0; i--) {
      if (store.matches[i].user_id === userId) return Date.parse(store.matches[i].created_at);
    }
    return null;
  },
  async insertMatch(m) {
    await tick();
    const key = `${m.user_id}:${m.matched_user_id}`;
    if (store.pairs.has(key)) return null;
    store.pairs.add(key);
    const row: MatchRow = { id: crypto.randomUUID(), found: false, created_at: new Date().toISOString(), ...m };
    store.matches.push(row);
    return row;
  },
  async matchesBy(userId, limit) {
    await tick();
    return store.matches.filter((m) => m.user_id === userId).reverse().slice(0, limit);
  },
  async matchesOf(userId, limit) {
    await tick();
    return store.matches.filter((m) => m.matched_user_id === userId).reverse().slice(0, limit);
  },
  async profilesByIds(ids) {
    await tick();
    return ids.map((id) => store.byId.get(id)).filter((p): p is Profile => !!p).map(pick);
  },
  async markFound(matchId, profileId) {
    await tick();
    const m = store.matches.find((x) => x.id === matchId && (x.user_id === profileId || x.matched_user_id === profileId));
    if (!m) return null;
    m.found = true;
    return m;
  },
  async stats() {
    await tick();
    const demo = store.profiles.filter((p) => p.is_demo).length;
    return {
      people: store.profiles.length - demo,
      demo,
      matches: store.matches.length,
      found: store.matches.filter((m) => m.found).length,
    };
  },
};
