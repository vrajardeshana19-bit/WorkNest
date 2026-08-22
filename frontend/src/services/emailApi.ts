import { API_BASE } from './httpClient';

export async function verifyEmail(token: string): Promise<{ message: string; isVerified: boolean }> {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    let detail = 'Email verification failed';
    try {
      const body = await res.json();
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  const data = await res.json();
  return {
    message: data.message,
    isVerified: data.is_verified,
  };
}

export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    let detail = 'Failed to resend verification email';
    try {
      const body = await res.json();
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  const data = await res.json();
  return { message: data.message };
}

export async function sendTestEmail(toEmail: string): Promise<{ message: string; provider: string }> {
  const res = await fetch(`${API_BASE}/setup/test-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to_email: toEmail }),
  });

  if (!res.ok) {
    let detail = 'Failed to send test email';
    try {
      const body = await res.json();
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  const data = await res.json();
  return {
    message: data.message,
    provider: data.provider,
  };
}
