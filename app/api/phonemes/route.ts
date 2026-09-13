import { db } from "@/lib/server/db";
import { body, handle, json } from "@/lib/server/http";
import { phonemeSchema } from "@/lib/server/validation";
import { catalog } from "@/lib/server/content";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET() {
  return handle(async () => json((await catalog()).phonemes));
}
export function POST(request: Request) {
  return handle(async () => {
    const item = await db.phoneme.create({
      data: await body(request, phonemeSchema),
    });
    return json({ ...item, usageCount: 0 }, 201);
  });
}
