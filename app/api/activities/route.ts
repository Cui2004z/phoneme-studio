import { db } from "@/lib/server/db";
import { body, handle, json } from "@/lib/server/http";
import { activitySchema } from "@/lib/server/validation";
import {
  activityDto,
  activityInclude,
  saveActivity,
} from "@/lib/server/content";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET() {
  return handle(async () =>
    json(
      (
        await db.activity.findMany({
          include: activityInclude,
          orderBy: { updatedAt: "desc" },
        })
      ).map(activityDto),
    ),
  );
}
export function POST(request: Request) {
  return handle(async () =>
    json(await saveActivity(await body(request, activitySchema)), 201),
  );
}
