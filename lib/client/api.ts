export class ClientError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string[]> = {},
    public status = 0,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      cache: "no-store",
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ClientError(
      "Cannot reach the server. Check the connection and try again.",
    );
  }
  if (response.status === 204) return undefined as T;
  const result = await response
    .json()
    .catch(() => ({ error: "The server returned an unexpected response." }));
  if (!response.ok) {
    const details = Object.values(result.fields ?? {})
      .flat()
      .filter(Boolean)
      .join(" ");
    throw new ClientError(
      details || result.error || "The request failed.",
      result.fields,
      response.status,
    );
  }
  return result as T;
}
export const send = (method: string, value: unknown) => ({
  method,
  body: JSON.stringify(value),
});
