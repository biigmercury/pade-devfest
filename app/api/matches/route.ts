import { getDb } from "@/lib/db";
import { fail, json, notConfigured, serverError } from "@/lib/http";
import { isUuid } from "@/lib/validate";
import { hydrate } from "@/lib/views";

// The met list (people I was matched with) plus "incoming": people who were matched with me.
// Polled gently by the match screen while the tab is visible.
export async function GET(req: Request) {
  const db = getDb();
  if (!db) return notConfigured();
  const id = new URL(req.url).searchParams.get("profileId");
  if (!isUuid(id)) return fail(400, "Invalid profile.");
  try {
    const [me, mine, theirs] = await Promise.all([db.getProfile(id), db.matchesBy(id, 50), db.matchesOf(id, 20)]);
    if (!me) return fail(404, "Profile not found.", { code: "no_profile" });
    const [met, incoming] = await Promise.all([hydrate(db, mine, "matched_user_id", me), hydrate(db, theirs, "user_id", me)]);
    return json({ met, incoming });
  } catch (e) {
    return serverError(e, "list matches");
  }
}
