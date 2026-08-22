import React, { useEffect, useState } from 'react';
import { verifyEmail } from '../services/emailApi';
import { AppBackground } from '../components/layout/AppBackground';
import { WorkNestLogo } from '../components/common/WorkNestLogo';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';

interface VerifyEmailPageProps {
  token: string;
  onNavigate: (tab: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ token, onNavigate }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    verifyEmail(token)
      .then((result) => {
        if (!cancelled) {
          setStatus('success');
          setMessage(result.message);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setStatus('error');
          setMessage(err.message);
        }
      });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <AppBackground>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md wn-card glass-panel p-8 text-center">
          <div className="flex justify-center mb-6">
            <WorkNestLogo size="lg" />
          </div>

          {status === 'loading' && (
            <div className="space-y-4">
              <LoadingSpinner label="Verifying your email..." />
              <p className="text-sm text-wn-on-surface-variant">Please wait while we confirm your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h1 className="text-lg font-semibold text-wn-primary font-[family-name:var(--font-geist)]">Email verified</h1>
              <p className="text-sm text-wn-on-surface-variant">{message}</p>
              <button type="button" onClick={() => onNavigate('login')} className="wn-btn-primary w-full py-3">
                Continue to sign in
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-wn-error" />
              </div>
              <h1 className="text-lg font-semibold text-wn-primary font-[family-name:var(--font-geist)]">Verification failed</h1>
              <p className="text-sm text-wn-on-surface-variant">{message}</p>
              <div className="flex items-center justify-center gap-2 text-xs text-wn-on-surface-variant">
                <Mail className="w-4 h-4" />
                <span>Check your inbox for a newer verification link.</span>
              </div>
              <button type="button" onClick={() => onNavigate('login')} className="wn-btn-secondary w-full py-3">
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </AppBackground>
  );
};
