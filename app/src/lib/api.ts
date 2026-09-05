/** İstemci tarafı API yardımcıları. */

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new ApiClientError(res.status, body.error ?? "İstek başarısız oldu.");
  }
  return body;
}

export const getJson = <T>(path: string) => api<T>(path, { method: "GET" });
export const postJson = <T>(path: string, data?: unknown) =>
  api<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) });
export const putJson = <T>(path: string, data?: unknown) =>
  api<T>(path, { method: "PUT", body: data === undefined ? undefined : JSON.stringify(data) });
