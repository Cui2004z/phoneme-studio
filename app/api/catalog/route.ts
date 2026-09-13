import { catalog } from "@/lib/server/content";
import { handle, json } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET() {
  return handle(async () => json(await catalog()));
}
