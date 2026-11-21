import { getDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { fail, json, notConfigured, serverError } from "@/lib/http";
import { isUuid, readJson, validateProfile } from "@/lib/validate";
import { toPerson } from "@/lib/views";

// Venue wifi means many attendees share one public IP, so this is generous:
// it stops scripts, not crowds.
const SIGNUP_LIMIT = 120;
const SIGNUP_WINDOW_MS = 10_000;

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return notConfigured();

  const rl = rateLimit(`signup:${clientIp(req)}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS);
  if (!rl.ok) {
    return fail(429, "Too many signups from this network. Give it a few seconds.", { retryAfterMs: rl.retryAfterMs }, {
      "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
    });
  }

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return fail(400, "Invalid request.");
  }
  const v = validateProfile(body);
  if (!v.ok) return fail(400, v.error);

  try {
    const p = await db.createProfile(v.value);
    return json({ profile: toPerson(p) }, 201);
  } catch (e) {
    return serverError(e, "create profile");
  }
}

export async function GET(req: Request) {
  const db = getDb();
  if (!db) return notConfigured();
  const id = new URL(req.url).searchParams.get("id");
  if (!isUuid(id)) return fail(400, "Invalid id.");
  try {
    const p = await db.getProfile(id);
    if (!p) return fail(404, "Profile not found.");
    return json({ profile: toPerson(p) });
  } catch (e) {
    return serverError(e, "get profile");
  }
}
