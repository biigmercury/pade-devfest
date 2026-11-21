import { EMOJIS, FUN_PICK_IDS, GOAL_IDS, INTEREST_IDS } from "./constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

// Small, deliberately conservative blocklist, checked after normalising common character
// swaps (0->o, 1->i, 3->e, 4->a, 5->s, @->a, $->s).
// SUBSTRINGS are blocked anywhere (they don't occur inside real names).
// WORDS are only blocked as whole words, so names like Fagbemi or Dickson stay fine.
const SUBSTRINGS = ["fuck", "nigger", "nigga", "cunt", "pussy", "whore", "motherf"];
const WORDS = [
  "shit", "bitch", "dick", "fag", "faggot", "slut", "rape", "rapist", "porn", "ass", "asshole",
  "bastard", "retard", "olodo", "ashawo", "mumu", "werey", "oloshi", "agbaya",
];

function normalise(s: string) {
  return s
    .toLowerCase()
    .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e")
    .replace(/4/g, "a").replace(/5/g, "s").replace(/@/g, "a").replace(/\$/g, "s");
}

export function isAbusive(s: string) {
  const n = normalise(s);
  const squashed = n.replace(/[^a-z]/g, "");
  if (SUBSTRINGS.some((w) => squashed.includes(w))) return true;
  const words = n.split(/[^a-z]+/).filter(Boolean);
  return words.some((w) => WORDS.includes(w));
}

/** Clean a display name. Returns null if nothing usable is left. */
export function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let s = raw
    .normalize("NFC")
    .replace(/<[^>]*>/g, " ")
    // strip control chars, invisible format chars (zero-width, bidi overrides) and angle brackets
    .replace(/[\p{Cc}\p{Cf}<>]/gu, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  // Keep letters (any script), marks, digits, space and a few name punctuation chars.
  s = s.replace(/[^\p{L}\p{M}\p{N} .'\-]/gu, "").trim();
  s = Array.from(s).slice(0, 24).join("").trim();
  if (!s) return null;
  if (isAbusive(s)) return "Mystery Guest";
  return s;
}

export type ProfileInput = {
  name: string;
  emoji: string;
  interests: string[];
  goal: string;
  fun_pick: string;
};

export function validateProfile(body: unknown): { ok: true; value: ProfileInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request." };
  const b = body as Record<string, unknown>;
  const name = sanitizeName(b.name);
  if (!name) return { ok: false, error: "Please enter your name." };
  const emoji = typeof b.emoji === "string" && (EMOJIS as readonly string[]).includes(b.emoji) ? b.emoji : null;
  if (!emoji) return { ok: false, error: "Pick an emoji." };
  if (!Array.isArray(b.interests)) return { ok: false, error: "Pick 3 interests." };
  const interests = Array.from(new Set(b.interests.filter((i): i is string => typeof i === "string" && INTEREST_IDS.includes(i))));
  if (interests.length !== 3) return { ok: false, error: "Pick exactly 3 interests." };
  const goal = typeof b.goal === "string" && GOAL_IDS.includes(b.goal) ? b.goal : null;
  if (!goal) return { ok: false, error: "Pick a goal." };
  const fun_pick = typeof b.fun_pick === "string" && FUN_PICK_IDS.includes(b.fun_pick) ? b.fun_pick : null;
  if (!fun_pick) return { ok: false, error: "Party or smoky? You have to choose 😄" };
  return { ok: true, value: { name, emoji, interests, goal, fun_pick } };
}

/** Read a small JSON body safely (caps size so nobody can post megabytes). */
export async function readJson(req: Request, maxBytes = 2048): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBytes) throw new Error("too_large");
  return text ? JSON.parse(text) : {};
}
