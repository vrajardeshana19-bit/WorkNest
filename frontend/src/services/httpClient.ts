import { getStoredToken } from './authApi';

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(', ') || 'Request failed';
    }
  } catch {
    // ignore JSON parse errors
  }
  return 'Request failed';
}

export function authHeaders(token?: string | null): HeadersInit {
  const resolved = token ?? getStoredToken();
  if (!resolved) return {};
  return { Authorization: `Bearer ${resolved}` };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(token),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export function isApiAuthenticated(): boolean {
  return !!getStoredToken();
}
