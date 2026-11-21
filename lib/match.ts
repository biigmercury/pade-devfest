import { COMPLEMENTARY_GOALS } from "./constants";
import type { Candidate } from "./db/types";

type Scorable = Pick<Candidate, "interests" | "goal" | "fun_pick">;

export function sharedInterests(a: { interests: string[] }, b: { interests: string[] }) {
  const set = new Set(a.interests);
  return b.interests.filter((i) => set.has(i));
}

export function goalsComplement(a: string, b: string) {
  return COMPLEMENTARY_GOALS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/**
 * +2 per shared interest, +3 complementary goals, +1 same fun pick,
 * +1.5 for real (non-demo) people so demo profiles only win when the room is quiet,
 * plus up to 1.5 random jitter so ties (and "Match again") feel fresh.
 */
export function score(me: Scorable, other: Candidate, rand: () => number = Math.random) {
  let s = 2 * sharedInterests(me, other).length;
  if (goalsComplement(me.goal, other.goal)) s += 3;
  if (me.fun_pick === other.fun_pick) s += 1;
  if (!other.is_demo) s += 1.5;
  return s + rand() * 1.5;
}

export function pickBest(me: Scorable, candidates: Candidate[], exclude: Set<string>): Candidate | null {
  let best: Candidate | null = null;
  let bestScore = -Infinity;
  for (const c of candidates) {
    if (exclude.has(c.id)) continue;
    const s = score(me, c);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
}
