import type { MatchRow, Profile, Stats } from "../types";
import type { ProfileInput } from "../validate";

export type Candidate = Pick<Profile, "id" | "name" | "emoji" | "interests" | "goal" | "fun_pick" | "is_demo">;

export interface Db {
  kind: "supabase" | "memory";
  createProfile(p: ProfileInput & { is_demo?: boolean }): Promise<Profile>;
  getProfile(id: string): Promise<Profile | null>;
  /** Most recent `limit` profiles, excluding `excludeId`. */
  recentCandidates(excludeId: string, limit: number): Promise<Candidate[]>;
  /** ids this user has already been matched with. */
  matchedIds(userId: string): Promise<string[]>;
  /** created_at (ms) of this user's latest match, or null. */
  lastMatchAt(userId: string): Promise<number | null>;
  /** Insert a match. Returns null if the pair already exists. */
  insertMatch(m: { user_id: string; matched_user_id: string; icebreaker: string }): Promise<MatchRow | null>;
  /** Matches made by the user (newest first). */
  matchesBy(userId: string, limit: number): Promise<MatchRow[]>;
  /** Matches where someone else got matched with the user (newest first). */
  matchesOf(userId: string, limit: number): Promise<MatchRow[]>;
  profilesByIds(ids: string[]): Promise<Candidate[]>;
  /** Mark found. Either side of the match may confirm. Returns the row or null. */
  markFound(matchId: string, profileId: string): Promise<MatchRow | null>;
  stats(): Promise<Stats>;
}
