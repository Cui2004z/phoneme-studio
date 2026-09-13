import { db } from "@/lib/server/db";
import {
  body,
  handle,
  json,
  sameOrigin,
  ApiError,
  type IdContext,
} from "@/lib/server/http";
import { idSchema, phonemeSchema } from "@/lib/server/validation";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET(_request: Request, ctx: IdContext) {
  return handle(async () => {
    const id = idSchema.parse((await ctx.params).id);
    const p = await db.phoneme.findUnique({
      where: { id },
      include: { _count: { select: { sounds: true } } },
    });
    if (!p) throw new ApiError(404, "This phoneme no longer exists.");
    return json({ ...p, usageCount: p._count.sounds });
  });
}
export function PUT(request: Request, ctx: IdContext) {
  return handle(async () => {
    const id = idSchema.parse((await ctx.params).id);
    const p = await db.phoneme.update({
      where: { id },
      data: await body(request, phonemeSchema),
      include: { _count: { select: { sounds: true } } },
    });
    return json({ ...p, usageCount: p._count.sounds });
  });
}
export function DELETE(request: Request, ctx: IdContext) {
  return handle(async () => {
    sameOrigin(request);
    const id = idSchema.parse((await ctx.params).id);
    if (await db.wordSound.count({ where: { phonemeId: id } }))
      throw new ApiError(
        409,
        "This phoneme is used in saved words. Edit or delete those words first.",
      );
    await db.phoneme.delete({ where: { id } });
    return new Response(null, { status: 204 });
  });
}
