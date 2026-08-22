import type { Role, User } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const TOKEN_STORAGE_KEY = 'worknest_access_token';

interface BackendUser {
  id: string;
  employee_id: string;
  email: string;
  role: Role;
  must_change_password: boolean;
}

interface BackendEmployee {
  first_name: string;
  last_name: string;
  phone: string | null;
  company: {
    name: string;
    logo_url: string | null;
  };
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  must_change_password: boolean;
}

interface BootstrapPayload {
  company_name: string;
  company_initials: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  password: string;
}

interface BootstrapResult {
  message: string;
  admin_login_id: string;
  admin_email: string;
}

async function parseError(res: Response): Promise<string> {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    if (res.status === 405 || res.status === 404) {
      return 'Could not reach the backend API. Set VITE_API_BASE_URL to your Render URL on Vercel.';
    }
    return 'Request failed';
  }

  try {
    const body = await res.json();
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(', ') || 'Request failed';
    }
  } catch {
    // ignore JSON parse errors
  }
  if (res.status === 401) return 'Invalid Login ID/email or password';
  if (res.status === 403) return 'Access denied';
  if (res.status === 409) return 'An organization already exists. Please sign in instead.';
  return 'Request failed';
}

function wrapNetworkError(error: unknown): Error {
  if (error instanceof TypeError) {
    return new Error(
      'Could not reach the backend API. Check VITE_API_BASE_URL on Vercel and FRONTEND_URL on Render.'
    );
  }
  return error instanceof Error ? error : new Error('Request failed');
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function deriveCompanyInitials(companyName: string): string {
  const letters = companyName.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
  return `${(letters || 'WN').padEnd(2, 'X')}`.slice(0, 2).toUpperCase();
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Admin', lastName: 'User' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function mapToUser(me: BackendUser, employee?: BackendEmployee | null): User {
  const name = employee ? `${employee.first_name} ${employee.last_name}`.trim() : me.email.split('@')[0];

  return {
    id: me.id,
    name,
    email: me.email,
    loginId: me.employee_id,
    role: me.role,
    employeeId: me.employee_id,
    companyName: employee?.company?.name ?? '',
    companyLogo: employee?.company?.logo_url ?? undefined,
    isFirstLogin: me.must_change_password,
  };
}

export async function login(loginIdOrEmail: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    username: loginIdOrEmail,
    password,
  });

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch (error) {
    throw wrapNetworkError(error);
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function fetchMe(token: string): Promise<BackendUser> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function fetchMyEmployee(token: string): Promise<BackendEmployee | null> {
  const res = await fetch(`${API_BASE}/employees/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function bootstrapSystem(payload: BootstrapPayload): Promise<BootstrapResult> {
  const res = await fetch(`${API_BASE}/setup/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ must_change_password: boolean }> {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function loadSession(token: string): Promise<{ user: User; mustChangePassword: boolean }> {
  let me: BackendUser;
  let employee: BackendEmployee | null;

  try {
    [me, employee] = await Promise.all([
      fetchMe(token),
      fetchMyEmployee(token),
    ]);
  } catch (error) {
    throw wrapNetworkError(error);
  }

  return {
    user: mapToUser(me, employee),
    mustChangePassword: me.must_change_password,
  };
}
