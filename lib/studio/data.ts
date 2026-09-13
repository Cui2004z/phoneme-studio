import corpusSource from './hce-corpus.json';
import keyboardSource from './hce-keyboard.json';
import searchSource from './word-search-examples.json';

export type ActivityType = 'wordle' | 'word-search';
export type Difficulty = 'gentle' | 'standard' | 'challenge';
export type Page = 'home' | ActivityType | 'about' | 'settings';
export type PhonemeWord = { english: string; phonemes: string[] };
export type Phoneme = { symbol: string; label: string; example: string; kind: 'consonant' | 'vowel' };

/** The supplied document mixes Latin g and IPA ɡ. They represent one sound. */
export function canonicalPhoneme(symbol: string): string {
  return symbol === 'g' ? 'ɡ' : symbol;
}
function normaliseWord(word: PhonemeWord): PhonemeWord {
  return { english: word.english, phonemes: word.phonemes.map(canonicalPhoneme) };
}
export const HCE_CORPUS: PhonemeWord[] = corpusSource.map(normaliseWord);
export const SEARCH_EXAMPLES: PhonemeWord[] = searchSource.map(normaliseWord);

// Spelling cues are examples of the sounds, not a spelling-to-IPA conversion rule.
const CUES: Record<string, [string, string]> = {
  p: ['P', 'pen'], t: ['T', 'top'], k: ['K', 'cat'],
  b: ['B', 'bad'], d: ['D', 'bed'], 'ɡ': ['G', 'gum'],
  n: ['N', 'thin'], m: ['M', 'jam'], 'ŋ': ['NG', 'ring'],
  f: ['F', 'fan'], s: ['S', 'sun'], 'θ': ['TH', 'thin'], 'ʃ': ['SH', 'ship'],
  v: ['V', 'van'], z: ['Z', 'zip'], 'ð': ['TH', 'then'], 'ʒ': ['S', 'measure'],
  l: ['L', 'log'], 'ɹ': ['R', 'ring'], w: ['W', 'win'], j: ['Y', 'yes'],
  h: ['H', 'hat'], 'tʃ': ['CH', 'chin'], 'dʒ': ['J', 'jam'],
  'iː': ['EE', 'scream'], 'ɪ': ['I', 'bid'], e: ['E', 'bed'], 'eː': ['AIR', 'hair'],
  'æ': ['A', 'bad'], 'ɐ': ['U', 'sun'], 'ɐː': ['AR', 'bark'], 'ɜː': ['IR', 'bird'],
  'ʉː': ['OO', 'boot'], 'ɔ': ['O', 'log'], 'oː': ['OR', 'fork'], 'ʊ': ['OO', 'book'],
  'æɪ': ['AI', 'bait'], 'ɑe': ['I', 'bike'], 'oɪ': ['OI', 'boil'], 'əʉ': ['OA', 'boat'],
  'æɔ': ['OU', 'cloud'], 'ɪə': ['EAR', 'beard'], 'ə': ['A', 'about'],
};
export const PHONEMES: Phoneme[] = keyboardSource.flatMap((row, index) =>
  row.filter(Boolean).map(raw => {
    const symbol = canonicalPhoneme(raw);
    const [label, example] = CUES[symbol];
    return { symbol, label, example, kind: index < 7 ? 'consonant' : 'vowel' };
  })
);
export const DEFAULT_WORD = 'train';
export function getTarget(wordId: string): PhonemeWord {
  const word = HCE_CORPUS.find(word => word.english === wordId);
  if (!word) throw new Error('Choose a word from the supplied HCE corpus.');
  return word;
}
export function getSearchWords(wordSet: 'starter' | 'full'): PhonemeWord[] {
  return wordSet === 'full' ? SEARCH_EXAMPLES : SEARCH_EXAMPLES.slice(0, 5);
}
export const LEVELS = {
  gentle: { label: 'Gentle', attempts: 8, size: 7, description: 'Across and down', directions: [[0, 1], [1, 0]] },
  standard: { label: 'Standard', attempts: 6, size: 10, description: 'Adds diagonals', directions: [[0, 1], [1, 0], [1, 1]] },
  challenge: { label: 'Challenge', attempts: 4, size: 12, description: 'All eight directions', directions: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]] },
} as const;
export type ActivityConfig = {
  type: ActivityType;
  title: string;
  instructions: string;
  difficulty: Difficulty;
  hints: boolean;
  labels: boolean;
  theme: 'light' | 'dark';
  seed: number;
  wordId: string;
  wordSet: 'starter' | 'full';
  rows: number;
  cols: number;
};
export const DEFAULTS: Record<ActivityType, ActivityConfig> = {
  wordle: { type: 'wordle', title: 'A word in sounds', instructions: 'Build the hidden word, one sound at a time. Choose phonemes below, then check your guess.', difficulty: 'standard', hints: true, labels: true, theme: 'light', seed: 42, wordId: DEFAULT_WORD, wordSet: 'starter', rows: 10, cols: 10 },
  'word-search': { type: 'word-search', title: 'The sound search', instructions: 'Find each phoneme word. Drag along its sounds, or select its first tile and then its last tile.', difficulty: 'standard', hints: true, labels: true, theme: 'light', seed: 42, wordId: DEFAULT_WORD, wordSet: 'starter', rows: 10, cols: 10 },
};
export function phonemeLabel(symbol: string): string {
  const p = PHONEMES.find(p => p.symbol === canonicalPhoneme(symbol));
  return p ? `${p.label} (as in ${p.example})` : symbol;
}
