import { db } from "@/lib/server/db";
import {
  body,
  handle,
  json,
  sameOrigin,
  ApiError,
  type IdContext,
} from "@/lib/server/http";
import { idSchema, listSchema } from "@/lib/server/validation";
import {
  listDto,
  listInclude,
  wordDto,
  wordInclude,
} from "@/lib/server/content";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET(_request: Request, ctx: IdContext) {
  return handle(async () => {
    const id = idSchema.parse((await ctx.params).id);
    const list = await db.wordList.findUnique({
      where: { id },
      include: {
        ...listInclude,
        words: { include: wordInclude, orderBy: { createdAt: "asc" } },
      },
    });
    if (!list) throw new ApiError(404, "This word list no longer exists.");
    return json({ ...listDto(list), words: list.words.map(wordDto) });
  });
}
export function PUT(request: Request, ctx: IdContext) {
  return handle(async () => {
    const id = idSchema.parse((await ctx.params).id);
    return json(
      listDto(
        await db.wordList.update({
          where: { id },
          data: await body(request, listSchema),
          include: listInclude,
        }),
      ),
    );
  });
}
export function DELETE(request: Request, ctx: IdContext) {
  return handle(async () => {
    sameOrigin(request);
    const id = idSchema.parse((await ctx.params).id);
    if (await db.activity.count({ where: { listId: id } }))
      throw new ApiError(
        409,
        "This list is used by saved activities. Delete or update those activities first.",
      );
    await db.wordList.delete({ where: { id } });
    return new Response(null, { status: 204 });
  });
}
