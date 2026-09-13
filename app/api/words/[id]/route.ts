import { db } from "@/lib/server/db";
import {
  body,
  handle,
  json,
  sameOrigin,
  ApiError,
  type IdContext,
} from "@/lib/server/http";
import { idSchema, wordSchema } from "@/lib/server/validation";
import {
  soundRows,
  wordDto,
  wordInclude,
  activityDto,
  activityInclude,
  validateActivity,
} from "@/lib/server/content";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET(_request: Request, ctx: IdContext) {
  return handle(async () => {
    const id = idSchema.parse((await ctx.params).id);
    const word = await db.word.findUnique({
      where: { id },
      include: wordInclude,
    });
    if (!word) throw new ApiError(404, "This word no longer exists.");
    return json(wordDto(word));
  });
}
export function PUT(request: Request, ctx: IdContext) {
  return handle(async () => {
    const id = idSchema.parse((await ctx.params).id);
    const value = await body(request, wordSchema);
    const word = await db.$transaction(async (tx) => {
      const current = await tx.word.findUnique({ where: { id } });
      if (!current) throw new ApiError(404, "This word no longer exists.");
      const sounds = await soundRows(tx, value.phonemes);
      await tx.wordSound.deleteMany({ where: { wordId: id } });
      const updated = await tx.word.update({
        where: { id },
        data: {
          english: value.english,
          englishKey: value.english.normalize("NFKC").toLowerCase(),
          hint: value.hint,
          sounds: { create: sounds },
        },
        include: wordInclude,
      });
      const affected = await tx.activity.findMany({
        where: { OR: [{ wordId: id }, { words: { some: { wordId: id } } }] },
        include: activityInclude,
      });
      for (const activity of affected)
        await validateActivity(tx, activityDto(activity).config);
      await tx.wordList.update({
        where: { id: current.listId },
        data: { updatedAt: new Date() },
      });
      return updated;
    });
    return json(wordDto(word));
  });
}
export function DELETE(request: Request, ctx: IdContext) {
  return handle(async () => {
    sameOrigin(request);
    const id = idSchema.parse((await ctx.params).id);
    if (
      await db.activity.count({
        where: { OR: [{ wordId: id }, { words: { some: { wordId: id } } }] },
      })
    )
      throw new ApiError(
        409,
        "This word is used by a saved activity. Remove it from that activity first.",
      );
    await db.word.delete({ where: { id } });
    return new Response(null, { status: 204 });
  });
}
