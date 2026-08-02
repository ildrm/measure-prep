export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const request = () => fetch(`${API_URL}${path}`, { ...init, credentials: "include", headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers } });
  let response = await request();
  if (response.status === 401 && path !== "/auth/refresh") {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
    if (refreshed.ok) response = await request();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    throw new ApiError(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "The request could not be completed.", response.status);
  }
  return response.json() as Promise<T>;
}
