import { db } from "@/lib/server/db";
import { json } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  try {
    await db.wordList.count();
    await db.difficulty.count();
    return json({
      status: "ok",
      database: "connected",
      service: "phoneme-studio",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return json({ status: "unavailable", database: "unavailable" }, 503);
  }
}
