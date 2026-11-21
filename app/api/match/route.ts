import { getDb } from "@/lib/db";
import { fail, json, notConfigured, serverError } from "@/lib/http";
import { makeIcebreaker } from "@/lib/icebreaker";
import { pickBest, sharedInterests } from "@/lib/match";
import { rateLimit } from "@/lib/ratelimit";
import { isUuid, readJson } from "@/lib/validate";
import { toView } from "@/lib/views";

const MATCH_INTERVAL_MS = 3000;
const CANDIDATE_POOL = 300;

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return notConfigured();

  let profileId: unknown;
  try {
    profileId = ((await readJson(req, 512)) as { profileId?: unknown }).profileId;
  } catch {
    return fail(400, "Invalid request.");
  }
  if (!isUuid(profileId)) return fail(400, "Invalid profile.");

  // Fast in-memory check first (stops double taps without touching the DB).
  const rl = rateLimit(`match:${profileId}`, 1, MATCH_INTERVAL_MS);
  if (!rl.ok) return tooFast(rl.retryAfterMs);

  try {
    const [me, candidates, matched, last] = await Promise.all([
      db.getProfile(profileId),
      db.recentCandidates(profileId, CANDIDATE_POOL),
      db.matchedIds(profileId),
      db.lastMatchAt(profileId),
    ]);
    if (!me) return fail(404, "Profile not found. Please sign up again.", { code: "no_profile" });

    // Cross-instance check backed by the database.
    if (last && Date.now() - last < MATCH_INTERVAL_MS) return tooFast(MATCH_INTERVAL_MS - (Date.now() - last));

    const exclude = new Set(matched);
    exclude.add(me.id);

    // Two attempts: if a concurrent request grabbed the same pair, pick the next best.
    for (let attempt = 0; attempt < 2; attempt++) {
      const best = pickBest(me, candidates, exclude);
      if (!best) return json({ match: null, reason: "everyone" });

      const shared = sharedInterests(me, best);
      const ice = await makeIcebreaker(me, best, shared);
      const row = await db.insertMatch({ user_id: me.id, matched_user_id: best.id, icebreaker: ice.text });
      if (row) return json({ match: toView(row, best, me), source: ice.source });
      exclude.add(best.id);
    }
    return fail(409, "Someone else just matched. Tap again!");
  } catch (e) {
    return serverError(e, "match");
  }
}

function tooFast(retryAfterMs: number) {
  return fail(429, "Easy, tiger! One match every 3 seconds.", { retryAfterMs }, {
    "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
  });
}
