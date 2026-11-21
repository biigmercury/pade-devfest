// Shared option lists. The server validates against these, so keep them in sync with the UI.

export const EMOJIS = [
  "😎", "🚀", "🦄", "🔥", "🌶️", "🎧", "🧠", "👾",
  "🦁", "🐢", "🌍", "⚡", "🎨", "🍕", "🥁", "💡",
] as const;

export const INTERESTS = [
  { id: "ai", label: "AI & ML", emoji: "🤖" },
  { id: "web", label: "Web", emoji: "🕸️" },
  { id: "mobile", label: "Mobile", emoji: "📱" },
  { id: "cloud", label: "Cloud", emoji: "☁️" },
  { id: "design", label: "Design", emoji: "🎨" },
  { id: "fintech", label: "Fintech", emoji: "💸" },
  { id: "web3", label: "Web3", emoji: "⛓️" },
  { id: "data", label: "Data", emoji: "📊" },
  { id: "security", label: "Security", emoji: "🔐" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "devops", label: "DevOps", emoji: "🛠️" },
  { id: "product", label: "Product", emoji: "🧭" },
  { id: "startups", label: "Startups", emoji: "🚀" },
  { id: "community", label: "Community", emoji: "🤝" },
  { id: "afrobeats", label: "Afrobeats", emoji: "🎶" },
  { id: "football", label: "Football", emoji: "⚽" },
] as const;

export const GOALS = [
  { id: "cofounder", label: "Find a cofounder", emoji: "🤝" },
  { id: "hire", label: "Hire talent", emoji: "🧲" },
  { id: "get_hired", label: "Get hired", emoji: "💼" },
  { id: "mentor", label: "Mentor someone", emoji: "🧑‍🏫" },
  { id: "mentee", label: "Find a mentor", emoji: "🌱" },
  { id: "collab", label: "Build something", emoji: "🛠️" },
  { id: "vibes", label: "Just vibes", emoji: "✨" },
] as const;

export const FUN_PICKS = [
  { id: "party", label: "Party jollof", emoji: "🎉" },
  { id: "smoky", label: "Smoky jollof", emoji: "🔥" },
] as const;

export const FUN_QUESTION = "Jollof: party or smoky?";

export type InterestId = (typeof INTERESTS)[number]["id"];
export type GoalId = (typeof GOALS)[number]["id"];
export type FunPickId = (typeof FUN_PICKS)[number]["id"];

export const INTEREST_IDS: readonly string[] = INTERESTS.map((i) => i.id);
export const GOAL_IDS: readonly string[] = GOALS.map((g) => g.id);
export const FUN_PICK_IDS: readonly string[] = FUN_PICKS.map((f) => f.id);

export function interestLabel(id: string) {
  return INTERESTS.find((i) => i.id === id)?.label ?? id;
}
export function interestEmoji(id: string) {
  return INTERESTS.find((i) => i.id === id)?.emoji ?? "•";
}
export function goalLabel(id: string) {
  return GOALS.find((g) => g.id === id)?.label ?? id;
}
export function funLabel(id: string) {
  return FUN_PICKS.find((f) => f.id === id)?.label ?? id;
}

// Pairs of goals that complement each other (order does not matter).
export const COMPLEMENTARY_GOALS: ReadonlyArray<[GoalId, GoalId]> = [
  ["cofounder", "cofounder"],
  ["hire", "get_hired"],
  ["mentor", "mentee"],
  ["collab", "collab"],
  ["collab", "cofounder"],
  ["vibes", "vibes"],
];
