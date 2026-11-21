import "server-only";

// Best-effort in-memory sliding-window limiter. Each serverless instance keeps its own
// window, which is fine for stopping double-taps and scripts. The match endpoint also has a
// database-backed check (see /api/match) so it holds across instances.

type Bucket = { hits: number[] };
const g = globalThis as unknown as { __padeRl?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = (g.__padeRl ??= new Map());

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { hits: [] };
    buckets.set(key, b);
  }
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= limit) return { ok: false, retryAfterMs: windowMs - (now - b.hits[0]) };
  b.hits.push(now);
  // Opportunistic cleanup so the map can't grow forever.
  if (buckets.size > 20000) {
    for (const [k, v] of buckets) if (!v.hits.length || now - v.hits[v.hits.length - 1] > 60000) buckets.delete(k);
  }
  return { ok: true, retryAfterMs: 0 };
}

export function clientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  return (xf?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local").slice(0, 64);
}
