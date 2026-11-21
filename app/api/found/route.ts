import { getDb } from "@/lib/db";
import { fail, json, notConfigured, serverError } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { isUuid, readJson } from "@/lib/validate";

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return notConfigured();
  let b: { profileId?: unknown; matchId?: unknown };
  try {
    b = (await readJson(req, 512)) as typeof b;
  } catch {
    return fail(400, "Invalid request.");
  }
  if (!isUuid(b.profileId) || !isUuid(b.matchId)) return fail(400, "Invalid request.");
  if (!rateLimit(`found:${b.profileId}`, 10, 10_000).ok) return fail(429, "Slow down small 😄");
  try {
    const row = await db.markFound(b.matchId, b.profileId);
    if (!row) return fail(404, "Match not found.");
    return json({ ok: true, id: row.id, found: row.found });
  } catch (e) {
    return serverError(e, "found");
  }
}
