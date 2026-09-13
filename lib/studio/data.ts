export type ActivityType = "wordle" | "word-search";
export type Difficulty = "gentle" | "standard" | "challenge";
export type Page =
  | "home"
  | ActivityType
  | "about"
  | "settings"
  | "library"
  | "activities";
export type PhonemeWord = {
  id?: string;
  english: string;
  phonemes: string[];
  hint?: string;
};
export type Phoneme = {
  id?: string;
  symbol: string;
  label: string;
  example: string;
  kind: "consonant" | "vowel";
};
export type StoredPhoneme = Phoneme & { id: string; usageCount: number };
export type StoredWord = PhonemeWord & {
  id: string;
  listId: string;
  hint: string;
  updatedAt: string;
};
export type WordListSummary = {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  activityCount: number;
  updatedAt: string;
};
export type WordListDetail = WordListSummary & { words: StoredWord[] };
export type DifficultyPreset = {
  id: Difficulty;
  label: string;
  attempts: number;
  size: number;
  description: string;
  directions: number[][];
};
export type Catalog = {
  phonemes: StoredPhoneme[];
  difficulties: DifficultyPreset[];
};
export type ActivityConfig = {
  type: ActivityType;
  title: string;
  instructions: string;
  difficulty: Difficulty;
  hints: boolean;
  labels: boolean;
  theme: "light" | "dark";
  seed: number;
  listId: string;
  wordId: string;
  wordIds: string[];
  rows: number;
  cols: number;
};
export type SavedActivity = {
  id: string;
  config: ActivityConfig;
  listName: string;
  updatedAt: string;
};
export type ActivityContent = {
  words: PhonemeWord[];
  phonemes: Phoneme[];
  level: DifficultyPreset;
};
export function canonicalPhoneme(symbol: string) {
  const value = symbol.trim().normalize("NFC");
  return value === "g" ? "ɡ" : value;
}
// Empty drafts contain no hard-coded answers. Content and level presets come from the API.
const shared = {
  difficulty: "standard" as const,
  hints: true,
  labels: true,
  theme: "light" as const,
  seed: 42,
  listId: "",
  wordId: "",
  wordIds: [] as string[],
  rows: 10,
  cols: 10,
};
export const DEFAULTS: Record<ActivityType, ActivityConfig> = {
  wordle: {
    ...shared,
    type: "wordle",
    title: "A word in sounds",
    instructions:
      "Build the hidden word, one sound at a time. Choose phonemes below, then check your guess.",
  },
  "word-search": {
    ...shared,
    type: "word-search",
    title: "The sound search",
    instructions:
      "Find each phoneme word. Drag along its sounds, or select its first tile and then its last tile.",
  },
};
export function phonemeLabel(symbol: string, phonemes: Phoneme[]) {
  const item = phonemes.find((p) => p.symbol === canonicalPhoneme(symbol));
  return item ? item.label + " (as in " + item.example + ")" : symbol;
}
