import { Prisma } from "@prisma/client";
import { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const noCache = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: noCache });
}
export function handle(work: () => Promise<Response>) {
  return work().catch((error) => {
    if (error instanceof z.ZodError)
      return json(
        {
          error: "Check the highlighted fields.",
          fields: error.flatten().fieldErrors,
        },
        400,
      );
    if (error instanceof ApiError)
      return json({ error: error.message }, error.status);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025")
        return json(
          { error: "This record no longer exists. Refresh and try again." },
          404,
        );
      if (error.code === "P2002")
        return json(
          {
            error:
              "This word or phoneme already exists. Edit the existing entry instead.",
          },
          409,
        );
      if (error.code === "P2003")
        return json(
          {
            error:
              "This record is used by saved content. Remove it from those activities or words first.",
          },
          409,
        );
      if (["P1001", "P1002", "P1008", "P2024"].includes(error.code))
        return json(
          { error: "The database is busy or unavailable. Please try again." },
          503,
        );
    }
    console.error("API request failed:", error);
    return json(
      { error: "The request could not be completed. Please try again." },
      500,
    );
  });
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Next may construct request.url with its bind hostname (localhost/0.0.0.0).
  // The Host header identifies the address the browser actually requested.
  const host = request.headers.get("host") ?? new URL(request.url).host;
  const expected =
    process.env.APP_ORIGIN ?? `${new URL(request.url).protocol}//${host}`;
  if (origin && origin !== expected)
    throw new ApiError(403, "Requests must come from this application.");
}
export async function body<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  sameOrigin(request);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError(415, "Send JSON content.");
  // Enforce the limit while streaming, even if Content-Length is absent or inaccurate.
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "A JSON body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 32768) {
      await reader.cancel();
      throw new ApiError(413, "This request is too large.");
    }
    chunks.push(chunk.value);
  }
  let input: unknown;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "Malformed JSON. Check the request body.");
  }
  return schema.parse(input);
}
export type IdContext = { params: Promise<{ id: string }> };
