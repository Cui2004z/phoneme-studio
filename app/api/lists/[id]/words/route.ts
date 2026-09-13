import { db } from "@/lib/server/db";
import {
  body,
  handle,
  json,
  ApiError,
  type IdContext,
} from "@/lib/server/http";
import { idSchema, wordSchema } from "@/lib/server/validation";
import { soundRows, wordDto, wordInclude } from "@/lib/server/content";
export const runtime = "nodejs";
export function POST(request: Request, ctx: IdContext) {
  return handle(async () => {
    const listId = idSchema.parse((await ctx.params).id);
    const value = await body(request, wordSchema);
    const word = await db.$transaction(async (tx) => {
      if (!(await tx.wordList.findUnique({ where: { id: listId } })))
        throw new ApiError(404, "This word list no longer exists.");
      const sounds = await soundRows(tx, value.phonemes);
      await tx.wordList.update({
        where: { id: listId },
        data: { updatedAt: new Date() },
      });
      return tx.word.create({
        data: {
          listId,
          english: value.english,
          englishKey: value.english.normalize("NFKC").toLowerCase(),
          hint: value.hint,
          sounds: { create: sounds },
        },
        include: wordInclude,
      });
    });
    return json(wordDto(word), 201);
  });
}
