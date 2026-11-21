import "server-only";
import { interestLabel } from "./constants";

type Side = { name: string; interests: string[] };

const firstName = (n: string) => n.split(" ")[0].slice(0, 20);

// Pre-written fallbacks. {a} {b} are first names, {x} is a shared (or their) interest.
const TEMPLATES_SHARED = [
  "{a}, meet {b}: una two dey talk {x} like say na your village language. Start with: what's the wildest {x} thing you've built or broken?",
  "Breaking news: {a} and {b} both love {x}. Abeg settle it now: what's the most overrated thing in {x} right now?",
  "{a} and {b}, the algorithm don talk: {x} is your shared love language. Swap your best {x} gist before the next talk starts!",
  "Ehen {a}! {b} is also deep into {x}. Ask them what got them into it, and no be small answer we want o.",
];
const TEMPLATES_OTHER = [
  "{a}, meet {b}, who is big on {x}. Ask them to explain {x} like you're their grandma, see if they survive am.",
  "{b} knows {x}, {a} knows other things, and together una fit build the next unicorn. Start with: what are you working on this week?",
  "{a} and {b}: different stacks, same jollof energy. Ask {b} what keeps them up at night in {x}.",
];

function fill(t: string, a: string, b: string, x: string) {
  return t.replaceAll("{a}", a).replaceAll("{b}", b).replaceAll("{x}", x);
}

export function templateIcebreaker(me: Side, them: Side, shared: string[]) {
  const a = firstName(me.name);
  const b = firstName(them.name);
  if (shared.length) {
    const x = interestLabel(shared[Math.floor(Math.random() * shared.length)]);
    return fill(TEMPLATES_SHARED[Math.floor(Math.random() * TEMPLATES_SHARED.length)], a, b, x);
  }
  const x = interestLabel(them.interests[0] ?? "tech");
  return fill(TEMPLATES_OTHER[Math.floor(Math.random() * TEMPLATES_OTHER.length)], a, b, x);
}

/**
 * One short OpenAI call. Never throws: on any failure or after 6s it returns the template.
 * Only first names and interest labels are sent.
 */
export async function makeIcebreaker(me: Side, them: Side, shared: string[]): Promise<{ text: string; source: "ai" | "template" }> {
  const fallback = () => ({ text: templateIcebreaker(me, them, shared), source: "template" as const });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallback();

  const a = firstName(me.name);
  const b = firstName(them.name);
  const prompt =
    `Write a funny, warm 2-sentence icebreaker for two people meeting at DevFest Ibadan, a Nigerian tech conference. ` +
    `Address both by first name. Mix in a little light Nigerian Pidgin where it feels natural. ` +
    `End with one easy question they can ask each other. Max 45 words. No hashtags, no emojis at the start.\n` +
    `${a} likes: ${me.interests.map(interestLabel).join(", ")}.\n` +
    `${b} likes: ${them.interests.map(interestLabel).join(", ")}.\n` +
    (shared.length ? `Shared: ${shared.map(interestLabel).join(", ")}.` : `No shared interests, so play on the contrast.`);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You write short, kind, playful icebreakers. Never mention appearance, religion, ethnicity or politics." },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 80,
      }),
    });
    if (!res.ok) return fallback();
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    let text = data.choices?.[0]?.message?.content?.trim() ?? "";
    text = text.replace(/^["'“]+|["'”]+$/g, "").replace(/\s+/g, " ").slice(0, 400);
    if (text.length < 20) return fallback();
    return { text, source: "ai" };
  } catch {
    return fallback();
  }
}
