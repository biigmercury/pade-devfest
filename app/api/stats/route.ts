import { getDb } from "@/lib/db";
import type { Stats } from "@/lib/types";

// Shared, cached stats for /live. The CDN caches for 5s (s-maxage), so every projector and
// phone viewing /live shares one DB hit per 5s. A tiny per-instance cache backs it up.
const TTL_MS = 5000;
const CACHE = "public, max-age=0, s-maxage=5, stale-while-revalidate=30";
const g = globalThis as unknown as { __padeStats?: { at: number; data: Stats; inflight?: Promise<Stats> } };

export async function GET() {
  const db = getDb();
  if (!db) return Response.json({ people: 0, demo: 0, matches: 0, found: 0 }, { headers: { "Cache-Control": "no-store" } });

  const now = Date.now();
  const c = g.__padeStats;
  try {
    let data: Stats;
    if (c && now - c.at < TTL_MS) {
      data = c.data;
    } else if (c?.inflight) {
      data = await c.inflight;
    } else {
      const inflight = db.stats();
      g.__padeStats = { at: c?.at ?? 0, data: c?.data ?? { people: 0, demo: 0, matches: 0, found: 0 }, inflight };
      data = await inflight;
      g.__padeStats = { at: Date.now(), data };
    }
    return Response.json(data, { headers: { "Cache-Control": CACHE, "CDN-Cache-Control": CACHE } });
  } catch (e) {
    console.error("[pade] stats:", e instanceof Error ? e.message : e);
    if (g.__padeStats) delete g.__padeStats.inflight;
    // Serve the last good numbers rather than an error on the big screen.
    const last = g.__padeStats?.data ?? { people: 0, demo: 0, matches: 0, found: 0 };
    return Response.json(last, { headers: { "Cache-Control": "public, s-maxage=2" } });
  }
}
