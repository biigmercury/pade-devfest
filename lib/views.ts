import "server-only";
import type { Candidate, Db } from "./db/types";
import type { MatchRow, MatchView, PublicPerson } from "./types";
import { sharedInterests } from "./match";

export const toPerson = (c: Candidate): PublicPerson => ({
  id: c.id, name: c.name, emoji: c.emoji, interests: c.interests, goal: c.goal, fun_pick: c.fun_pick, is_demo: c.is_demo,
});

export function toView(row: MatchRow, other: Candidate, me: Pick<Candidate, "interests">): MatchView {
  return {
    id: row.id,
    icebreaker: row.icebreaker,
    found: row.found,
    created_at: row.created_at,
    person: toPerson(other),
    shared: sharedInterests(me, other),
  };
}

/** Attach the "other person" to each row. `otherKey` says which column holds them. */
export async function hydrate(db: Db, rows: MatchRow[], otherKey: "matched_user_id" | "user_id", me: Pick<Candidate, "interests">) {
  const people = await db.profilesByIds(Array.from(new Set(rows.map((r) => r[otherKey]))));
  const byId = new Map(people.map((p) => [p.id, p]));
  return rows.flatMap((r) => {
    const p = byId.get(r[otherKey]);
    return p ? [toView(r, p, me)] : [];
  });
}
