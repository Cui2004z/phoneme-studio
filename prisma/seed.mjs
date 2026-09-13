import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";

const db = new PrismaClient();
const read = async (name) =>
  JSON.parse(
    await readFile(
      new URL("./seed-data/" + name + ".json", import.meta.url),
      "utf8",
    ),
  );
try {
  const [phonemes, corpus, search] = await Promise.all([
    read("phonemes"),
    read("hce-corpus"),
    read("word-search-examples"),
  ]);
  await db.$transaction(
    async (tx) => {
      if (
        await tx.seedState.findUnique({ where: { id: "assessment-2-demo-v1" } })
      ) {
        console.log(
          "Database already seeded; teacher content has been preserved.",
        );
        return;
      }
      const sounds = new Map();
      for (const value of phonemes) {
        const record = await tx.phoneme.upsert({
          where: { symbol: value.symbol },
          update: {},
          create: value,
        });
        sounds.set(value.symbol, record.id);
      }
      const levels = [
        {
          id: "gentle",
          label: "Gentle",
          attempts: 8,
          size: 7,
          description: "Across and down",
          directions: [
            [0, 1],
            [1, 0],
          ],
        },
        {
          id: "standard",
          label: "Standard",
          attempts: 6,
          size: 10,
          description: "Adds diagonals",
          directions: [
            [0, 1],
            [1, 0],
            [1, 1],
          ],
        },
        {
          id: "challenge",
          label: "Challenge",
          attempts: 4,
          size: 12,
          description: "All eight directions",
          directions: [
            [0, 1],
            [1, 0],
            [1, 1],
            [-1, 1],
            [0, -1],
            [-1, 0],
            [-1, -1],
            [1, -1],
          ],
        },
      ];
      for (const level of levels)
        await tx.difficulty.upsert({
          where: { id: level.id },
          update: {},
          create: level,
        });
      const lists = [];
      for (const [name, description, words] of [
        [
          "HCE phoneme corpus",
          "90 examples from the supplied HCE corpus. Edit these or create a list of your own.",
          corpus,
        ],
        [
          "First sound search",
          "Five starting examples from the supplied word search.",
          search.slice(0, 5),
        ],
        [
          "More sound searches",
          "All ten examples from the supplied word search.",
          search,
        ],
      ]) {
        const list = await tx.wordList.create({ data: { name, description } });
        const ids = new Map();
        for (const item of words) {
          const tokens = item.phonemes.map((s) => (s === "g" ? "ɡ" : s));
          const record = await tx.word.create({
            data: {
              listId: list.id,
              english: item.english,
              englishKey: item.english.toLowerCase(),
              hint: "",
              sounds: {
                create: tokens.map((symbol, position) => ({
                  position,
                  phonemeId: sounds.get(symbol),
                })),
              },
            },
          });
          ids.set(item.english, record.id);
        }
        lists.push({ id: list.id, words: ids });
      }
      await tx.activity.create({
        data: {
          type: "wordle",
          title: "A word in sounds",
          instructions:
            "Build the hidden word, one sound at a time. Choose phonemes below, then check your guess.",
          listId: lists[0].id,
          wordId: lists[0].words.get("train"),
          difficulty: "standard",
          hints: true,
          labels: true,
        },
      });
      await tx.activity.create({
        data: {
          type: "word-search",
          title: "The sound search",
          instructions:
            "Find each phoneme word. Drag along its sounds, or select its first tile and then its last tile.",
          listId: lists[1].id,
          difficulty: "standard",
          hints: true,
          labels: true,
          words: {
            create: [...lists[1].words.values()].map((wordId, position) => ({
              wordId,
              position,
            })),
          },
        },
      });
      await tx.seedState.create({ data: { id: "assessment-2-demo-v1" } });
      console.log(
        "Created 3 lists, 105 list entries, 43 phonemes and 2 saved activities.",
      );
    },
    { timeout: 60000 },
  );
} finally {
  await db.$disconnect();
}
