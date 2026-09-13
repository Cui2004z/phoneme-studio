import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError } from "./http";
import type {
  ActivityConfig,
  Catalog,
  DifficultyPreset,
  SavedActivity,
  StoredWord,
} from "../studio/data";
import { makePuzzle } from "../studio/engine";
import { generateHtml } from "../studio/export";

export const wordInclude = {
  sounds: { orderBy: { position: "asc" as const }, include: { phoneme: true } },
} satisfies Prisma.WordInclude;
type FullWord = Prisma.WordGetPayload<{ include: typeof wordInclude }>;
export function wordDto(word: FullWord): StoredWord {
  return {
    id: word.id,
    listId: word.listId,
    english: word.english,
    phonemes: word.sounds.map((s) => s.phoneme.symbol),
    hint: word.hint,
    updatedAt: word.updatedAt.toISOString(),
  };
}
export const listInclude = {
  _count: { select: { words: true, activities: true } },
} satisfies Prisma.WordListInclude;
export function listDto(
  list: Prisma.WordListGetPayload<{ include: typeof listInclude }>,
) {
  return {
    id: list.id,
    name: list.name,
    description: list.description,
    wordCount: list._count.words,
    activityCount: list._count.activities,
    updatedAt: list.updatedAt.toISOString(),
  };
}
export const activityInclude = {
  list: true,
  words: { orderBy: { position: "asc" as const } },
} satisfies Prisma.ActivityInclude;
type FullActivity = Prisma.ActivityGetPayload<{
  include: typeof activityInclude;
}>;
export function activityDto(row: FullActivity): SavedActivity {
  return {
    id: row.id,
    listName: row.list.name,
    updatedAt: row.updatedAt.toISOString(),
    config: {
      type: row.type as ActivityConfig["type"],
      title: row.title,
      instructions: row.instructions,
      difficulty: row.difficulty as ActivityConfig["difficulty"],
      listId: row.listId,
      wordId: row.wordId ?? "",
      wordIds: row.words.map((w) => w.wordId),
      hints: row.hints,
      labels: row.labels,
      theme: row.theme as ActivityConfig["theme"],
      seed: row.seed,
      rows: row.rows,
      cols: row.cols,
    },
  };
}
export function levelDto(row: {
  id: string;
  label: string;
  attempts: number;
  size: number;
  description: string;
  directions: Prisma.JsonValue;
}): DifficultyPreset {
  return {
    ...row,
    id: row.id as DifficultyPreset["id"],
    directions: row.directions as number[][],
  };
}
export async function catalog(): Promise<Catalog> {
  const [phonemes, levels] = await Promise.all([
    db.phoneme.findMany({
      orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { sounds: true } } },
    }),
    db.difficulty.findMany({ orderBy: { attempts: "desc" } }),
  ]);
  return {
    phonemes: phonemes.map((p) => ({
      id: p.id,
      symbol: p.symbol,
      label: p.label,
      example: p.example,
      kind: p.kind as "consonant" | "vowel",
      usageCount: p._count.sounds,
    })),
    difficulties: levels.map(levelDto),
  };
}
export async function soundRows(
  tx: Prisma.TransactionClient,
  symbols: string[],
) {
  const phonemes = await tx.phoneme.findMany({
    where: { symbol: { in: symbols } },
  });
  const missing = symbols.filter((s) => !phonemes.some((p) => p.symbol === s));
  if (missing.length)
    throw new ApiError(
      400,
      "Unknown phoneme(s): " +
        [...new Set(missing)].join(", ") +
        ". Add them in the phoneme library first, or separate sounds with spaces.",
    );
  return symbols.map((symbol, position) => ({
    position,
    phonemeId: phonemes.find((p) => p.symbol === symbol)!.id,
  }));
}
export async function validateActivity(
  tx: Prisma.TransactionClient,
  config: ActivityConfig,
) {
  const list = await tx.wordList.findUnique({ where: { id: config.listId } });
  if (!list)
    throw new ApiError(400, "The selected word list no longer exists.");
  const level = await tx.difficulty.findUnique({
    where: { id: config.difficulty },
  });
  if (!level) throw new ApiError(400, "The difficulty setting is unavailable.");
  const ids = config.type === "wordle" ? [config.wordId] : config.wordIds;
  const rows = await tx.word.findMany({
    where: { id: { in: ids }, listId: config.listId },
    include: wordInclude,
  });
  if (rows.length !== ids.length)
    throw new ApiError(
      400,
      "Every selected word must belong to the selected list.",
    );
  const words = ids.map((id) => wordDto(rows.find((w) => w.id === id)!));
  if (
    config.type === "wordle" &&
    (words[0].phonemes.length < 2 || words[0].phonemes.length > 8)
  )
    throw new ApiError(400, "Wordle targets need between 2 and 8 phonemes.");
  if (config.type === "word-search") {
    const sequences = words.map((w) => w.phonemes.join("|"));
    if (new Set(sequences).size !== sequences.length)
      throw new ApiError(
        400,
        "Choose words with different phoneme sequences for this search.",
      );
    try {
      makePuzzle(
        config.difficulty,
        config.seed,
        words,
        config.rows,
        config.cols,
        levelDto(level).directions,
      );
    } catch (error) {
      throw new ApiError(400, (error as Error).message);
    }
  }
}
export function activityData(config: ActivityConfig) {
  const { wordIds, ...data } = config;
  return {
    ...data,
    wordId: config.type === "wordle" ? config.wordId : null,
    words: {
      create:
        config.type === "word-search"
          ? wordIds.map((wordId, position) => ({ wordId, position }))
          : [],
    },
  };
}
export async function saveActivity(config: ActivityConfig, id?: string) {
  return db.$transaction(async (tx) => {
    if (id && !(await tx.activity.findUnique({ where: { id } })))
      throw new ApiError(404, "This activity no longer exists.");
    await validateActivity(tx, config);
    if (id) {
      await tx.activityWord.deleteMany({ where: { activityId: id } });
      return activityDto(
        await tx.activity.update({
          where: { id },
          data: activityData(config),
          include: activityInclude,
        }),
      );
    }
    return activityDto(
      await tx.activity.create({
        data: activityData(config),
        include: activityInclude,
      }),
    );
  });
}
export async function savedHtml(id: string) {
  // A transaction gives the export a consistent snapshot of the saved settings and words.
  const result = await db.$transaction(async (tx) => {
    const activity = await tx.activity.findUnique({
      where: { id },
      include: activityInclude,
    });
    if (!activity)
      throw new ApiError(404, "This saved activity no longer exists.");
    const { config } = activityDto(activity);
    await validateActivity(tx, config);
    const ids = config.type === "wordle" ? [config.wordId] : config.wordIds;
    const [words, phonemes, level] = await Promise.all([
      tx.word.findMany({ where: { id: { in: ids } }, include: wordInclude }),
      tx.phoneme.findMany({ orderBy: { createdAt: "asc" } }),
      tx.difficulty.findUniqueOrThrow({ where: { id: config.difficulty } }),
    ]);
    return {
      config,
      content: {
        words: words.map(wordDto),
        phonemes: phonemes.map((p) => ({
          ...p,
          kind: p.kind as "consonant" | "vowel",
        })),
        level: levelDto(level),
      },
    };
  });
  return {
    title: result.config.title,
    html: generateHtml(result.config, result.content),
  };
}
