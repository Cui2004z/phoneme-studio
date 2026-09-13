import type { Difficulty, PhonemeWord } from "./data";
export type Feedback = "correct" | "present" | "absent";
/** Two passes prevent repeated phonemes receiving more matches than the answer contains. */
export function scoreGuess(guess: string[], target: string[]): Feedback[] {
  const result: Feedback[] = guess.map(() => "absent");
  const remaining = [...target];
  guess.forEach((sound, i) => {
    if (sound === target[i]) {
      result[i] = "correct";
      remaining[i] = "";
    }
  });
  guess.forEach((sound, i) => {
    if (result[i] === "correct") return;
    const match = remaining.indexOf(sound);
    if (match !== -1) {
      result[i] = "present";
      remaining[match] = "";
    }
  });
  return result;
}
export type Placement = {
  wordIndex: number;
  cells: number[];
};
export type Puzzle = {
  rows: number;
  cols: number;
  grid: string[];
  placements: Placement[];
};
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
/** Seeded generation means preview and downloaded HTML use exactly the same puzzle. */
export function makePuzzle(
  difficulty: Difficulty,
  seed: number,
  words: PhonemeWord[],
  rows: number,
  cols: number,
  directions: number[][],
): Puzzle {
  if (![rows, cols].every((n) => Number.isInteger(n) && n >= 6 && n <= 16)) {
    throw new Error("Use between 6 and 16 rows and columns.");
  }
  if (!words.length || words.some((word) => !word.phonemes.length)) {
    throw new Error("The puzzle needs a non-empty phoneme word list.");
  }
  if (!directions.length)
    throw new Error("Choose a difficulty with at least one direction.");
  const random = seededRandom(seed);
  // Like the supplied example, filler tiles come from the selected words.
  // Multi-character phonemes are never split into Unicode characters.
  const alphabet = [...new Set(words.flatMap((word) => word.phonemes))];
  for (let retry = 0; retry < 30; retry++) {
    const grid = Array<string>(rows * cols).fill("");
    const placements: Placement[] = [];
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex];
      let placed = false;
      for (let attempt = 0; attempt < 500 && !placed; attempt++) {
        const row = Math.floor(random() * rows),
          col = Math.floor(random() * cols);
        const [dr, dc] = directions[Math.floor(random() * directions.length)];
        const coordinates = word.phonemes.map((_, i) => [
          row + dr * i,
          col + dc * i,
        ]);
        if (
          coordinates.some(([r, c]) => r < 0 || c < 0 || r >= rows || c >= cols)
        )
          continue;
        const cells = coordinates.map(([r, c]) => r * cols + c);
        if (
          cells.some((cell, i) => grid[cell] && grid[cell] !== word.phonemes[i])
        )
          continue;
        cells.forEach((cell, i) => {
          grid[cell] = word.phonemes[i];
        });
        placements.push({ wordIndex, cells });
        placed = true;
        break;
      }
      if (!placed) break;
    }
    // Never publish a grid with words missing from it.
    if (placements.length === words.length) {
      return {
        rows,
        cols,
        placements,
        grid: grid.map(
          (p) => p || alphabet[Math.floor(random() * alphabet.length)],
        ),
      };
    }
  }
  throw new Error(
    "The puzzle could not fit every word. Try a larger grid or a new arrangement.",
  );
}
export function selectionLine(
  start: number,
  end: number,
  cols: number,
): number[] {
  const r1 = Math.floor(start / cols),
    c1 = start % cols,
    r2 = Math.floor(end / cols),
    c2 = end % cols;
  const dr = r2 - r1,
    dc = c2 - c1;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [];
  return Array.from(
    { length: Math.max(Math.abs(dr), Math.abs(dc)) + 1 },
    (_, i) => (r1 + Math.sign(dr) * i) * cols + c1 + Math.sign(dc) * i,
  );
}
