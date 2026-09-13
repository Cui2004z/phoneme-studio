import { z } from "zod";
import { canonicalPhoneme } from "../studio/data";

const text = (max: number) =>
  z.string().trim().min(1, "This field is required.").max(max);
export const idSchema = z.string().cuid("Invalid record ID.");
export const listSchema = z
  .object({
    name: text(80),
    description: z.string().trim().max(500).default(""),
  })
  .strict();
export const phonemeSchema = z
  .object({
    symbol: text(8)
      .transform(canonicalPhoneme)
      .refine(
        (v) => /^[\p{L}\p{M}ːˑ]+$/u.test(v),
        "Use one phoneme token, without spaces, slashes or punctuation.",
      ),
    label: text(20),
    example: text(80),
    kind: z.enum(["consonant", "vowel"]),
  })
  .strict();
export const wordSchema = z
  .object({
    english: text(80),
    phonemes: z
      .array(text(8).transform(canonicalPhoneme))
      .min(1, "Add at least one phoneme.")
      .max(12, "Use at most 12 phonemes."),
    hint: z.string().trim().max(300).default(""),
  })
  .strict();
export const activitySchema = z
  .object({
    type: z.enum(["wordle", "word-search"]),
    title: text(70),
    instructions: z.string().trim().max(500),
    difficulty: z.enum(["gentle", "standard", "challenge"]),
    listId: idSchema,
    wordId: z.union([idSchema, z.literal("")]),
    wordIds: z.array(idSchema).max(12),
    hints: z.boolean(),
    labels: z.boolean(),
    theme: z.enum(["light", "dark"]),
    seed: z.number().int().min(0).max(2147483647),
    rows: z.number().int().min(6).max(16),
    cols: z.number().int().min(6).max(16),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.type === "wordle" && !value.wordId)
      ctx.addIssue({
        code: "custom",
        path: ["wordId"],
        message: "Choose a target word.",
      });
    if (value.type === "word-search" && !value.wordIds.length)
      ctx.addIssue({
        code: "custom",
        path: ["wordIds"],
        message: "Choose at least one word.",
      });
    if (new Set(value.wordIds).size !== value.wordIds.length)
      ctx.addIssue({
        code: "custom",
        path: ["wordIds"],
        message: "Each selected word must be unique.",
      });
  });
