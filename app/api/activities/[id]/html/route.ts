import { handle, noCache, type IdContext } from "@/lib/server/http";
import { idSchema } from "@/lib/server/validation";
import { savedHtml } from "@/lib/server/content";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET(_request: Request, ctx: IdContext) {
  return handle(async () => {
    const result = await savedHtml(idSchema.parse((await ctx.params).id));
    const filename =
      result.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "phoneme-activity";
    return new Response(result.html, {
      headers: {
        ...noCache,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + filename + '.html"',
      },
    });
  });
}
