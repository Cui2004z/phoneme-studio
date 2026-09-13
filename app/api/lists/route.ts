import { db } from "@/lib/server/db";
import { body, handle, json } from "@/lib/server/http";
import { listSchema } from "@/lib/server/validation";
import { listDto, listInclude } from "@/lib/server/content";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET() {
  return handle(async () =>
    json(
      (
        await db.wordList.findMany({
          include: listInclude,
          orderBy: { createdAt: "asc" },
        })
      ).map(listDto),
    ),
  );
}
export function POST(request: Request) {
  return handle(async () => {
    const data = await body(request, listSchema);
    return json(
      listDto(await db.wordList.create({ data, include: listInclude })),
      201,
    );
  });
}
