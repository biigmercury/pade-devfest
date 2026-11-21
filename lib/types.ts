export type Profile = {
  id: string;
  name: string;
  emoji: string;
  interests: string[];
  goal: string;
  fun_pick: string;
  is_demo: boolean;
  created_at: string;
};

// What the client gets about another person: no timestamps, nothing extra.
export type PublicPerson = Pick<Profile, "id" | "name" | "emoji" | "interests" | "goal" | "fun_pick" | "is_demo">;

export type MatchRow = {
  id: string;
  user_id: string;
  matched_user_id: string;
  icebreaker: string;
  found: boolean;
  created_at: string;
};

export type MatchView = {
  id: string;
  icebreaker: string;
  found: boolean;
  created_at: string;
  person: PublicPerson;
  shared: string[];
};

export type Stats = { people: number; demo: number; matches: number; found: number };
