import { db } from "@/lib/server/db";
import {
  body,
  handle,
  json,
  sameOrigin,
  ApiError,
  type IdContext,
} from "@/lib/server/http";
import { idSchema, activitySchema } from "@/lib/server/validation";
import {
  activityDto,
  activityInclude,
  saveActivity,
} from "@/lib/server/content";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET(_request: Request, ctx: IdContext) {
  return handle(async () => {
    const id = idSchema.parse((await ctx.params).id);
    const row = await db.activity.findUnique({
      where: { id },
      include: activityInclude,
    });
    if (!row) throw new ApiError(404, "This activity no longer exists.");
    return json(activityDto(row));
  });
}
export function PUT(request: Request, ctx: IdContext) {
  return handle(async () =>
    json(
      await saveActivity(
        await body(request, activitySchema),
        idSchema.parse((await ctx.params).id),
      ),
    ),
  );
}
export function DELETE(request: Request, ctx: IdContext) {
  return handle(async () => {
    sameOrigin(request);
    await db.activity.delete({
      where: { id: idSchema.parse((await ctx.params).id) },
    });
    return new Response(null, { status: 204 });
  });
}
