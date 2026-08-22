import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { resendVerificationEmail } from '../services/emailApi';
import {
  Mail,
  Lock,
  UserCheck,
  Shield,
  Settings,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { WorkNestLogo } from '../components/common/WorkNestLogo';
import './loginPage.css';

const LoginHeroVisual = lazy(() =>
  import('../components/auth/LoginHeroVisual').then((m) => ({ default: m.LoginHeroVisual }))
);

const REMEMBER_KEY = 'worknest_remember_login';

const ROLE_PLACEHOLDERS: Record<'EMPLOYEE' | 'HR' | 'ADMIN', string> = {
  EMPLOYEE: 'OIEMJO20260001',
  HR: 'OIHROF20260001',
  ADMIN: 'OIADMIN20260001',
};

function formatRoleLabel(role: string): string {
  if (role === 'EMPLOYEE') return 'Employee';
  if (role === 'HR') return 'HR';
  if (role === 'ADMIN') return 'Admin';
  return role;
}

function formatLoginError(message: string): string {
  const roleMismatch = message.match(/registered as (\w+), not (\w+)/i);
  if (roleMismatch) {
    const actualRole = formatRoleLabel(roleMismatch[1]);
    return `These credentials belong to a ${actualRole} account. Switch to the ${actualRole} tab and sign in again.`;
  }
  if (/invalid login id|invalid credentials|incorrect password|401/i.test(message)) {
    return 'Invalid login ID/email or password. Please check your credentials and try again.';
  }
  if (/not verified/i.test(message)) {
    return 'Your email is not verified yet. Check your inbox or resend the verification email below.';
  }
  if (/inactive/i.test(message)) {
    return 'This account is inactive. Contact your HR administrator.';
  }
  if (/could not reach the backend api|vite_api_base_url|frontend_url on render/i.test(message)) {
    return message;
  }
  return message;
}

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

const FEATURES = [
  { title: 'Connected', sub: 'All-in-one HR' },
  { title: 'Intelligent', sub: 'Smart insights' },
  { title: 'Secure', sub: 'Enterprise grade' },
] as const;

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [activeRoleTab, setActiveRoleTab] = useState<'EMPLOYEE' | 'HR' | 'ADMIN'>('EMPLOYEE');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ loginId?: string; password?: string }>({});

  const roleTabs = [
    { id: 'EMPLOYEE' as const, label: 'Employee', icon: UserCheck },
    { id: 'HR' as const, label: 'HR', icon: Shield },
    { id: 'ADMIN' as const, label: 'Admin', icon: Settings },
  ];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setLoginId(saved);
        setRememberMe(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleRoleChange = (id: 'EMPLOYEE' | 'HR' | 'ADMIN') => {
    setActiveRoleTab(id);
    setLoginId('');
    setPassword('');
    setShowPassword(false);
    setErrors({});
    setFormError(null);
    setShowResendVerification(false);
  };

  const validate = () => {
    const errs: { loginId?: string; password?: string } = {};
    if (!loginId) errs.loginId = 'Login ID or email is required';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setShowResendVerification(false);
    setFormError(null);
    try {
      await login(loginId, password, activeRoleTab);
      try {
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, loginId.trim());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // ignore storage errors
      }
      showToast('Signed in', 'success');
      onNavigate('dashboard');
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Invalid credentials.';
      const message = formatLoginError(rawMessage);
      setFormError(message);
      setShowResendVerification(/not verified/i.test(rawMessage) && loginId.includes('@'));
      showToast('Sign in failed', 'error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!loginId.includes('@')) {
      showToast('Enter your email to resend verification', 'error');
      return;
    }
    setIsResending(true);
    try {
      const result = await resendVerificationEmail(loginId.trim());
      showToast('Email sent', 'success', result.message);
    } catch (error) {
      showToast('Could not send email', 'error', error instanceof Error ? error.message : 'Try again later');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="login-page wn-app-bg">
      <div className="login-page__bg" aria-hidden="true">
        <div className="login-page__bg-glow" />
        <div className="login-page__bg-grid" />
        <div className="login-page__bg-wave" />
      </div>

      <nav className="login-page__nav">
        <div className="flex items-center gap-2.5">
          <WorkNestLogo size="sm" />
          <span className="text-lg font-bold text-wn-primary font-[family-name:var(--font-geist)]">
            WorkNest
          </span>
        </div>
        <button type="button" onClick={() => onNavigate('register')} className="wn-btn-primary text-sm px-5 py-2.5">
          Get Started
        </button>
      </nav>

      <main className="login-page__main">
        <div className="login-page__grid">
          <section className="login-page__hero">
            <span className="login-page__badge">✨ Smarter HR. Better Decisions.</span>

            <h1 className="login-page__headline">
              HR operations, connected{' '}
              <span className="login-page__headline-accent">intelligently.</span>
            </h1>

            <p className="login-page__desc">
              WorkNest connects attendance, leave, compliance, overtime and payroll into one
              workforce platform.
            </p>

            <div className="login-page__features">
              {FEATURES.map(({ title, sub }) => (
                <div key={title} className="login-page__feature">
                  <span className="login-page__feature-icon">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                  <div>
                    <div className="login-page__feature-title">{title}</div>
                    <div className="login-page__feature-sub">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="login-page__visual-wrap">
              <Suspense fallback={null}>
                <LoginHeroVisual />
              </Suspense>
            </div>
          </section>

          <section className="login-page__card">
            <h2 className="text-xl font-bold text-wn-primary font-[family-name:var(--font-geist)]">
              Sign in
            </h2>
            <p className="text-sm text-wn-on-surface-variant mt-1 mb-5">
              Select your role and enter credentials.
            </p>

            <div className="login-page__role-tabs">
              {roleTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleRoleChange(id)}
                  className={`login-page__role-tab ${
                    activeRoleTab === id ? 'login-page__role-tab--active' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {formError && (
                <div className="login-page__form-error" role="alert">
                  {formError}
                </div>
              )}

              <div>
                <label className="wn-label block mb-1.5">Login ID or email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wn-on-surface-variant" />
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder={ROLE_PLACEHOLDERS[activeRoleTab]}
                    className={`wn-input pl-10 pr-3 py-2.5 ${errors.loginId ? 'border-wn-error' : ''}`}
                  />
                </div>
                {errors.loginId && <p className="mt-1 text-xs text-wn-error">{errors.loginId}</p>}
              </div>

              <div>
                <label className="wn-label block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wn-on-surface-variant" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className={`wn-input pl-10 pr-10 py-2.5 ${errors.password ? 'border-wn-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-wn-on-surface-variant hover:text-wn-secondary transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-wn-error">{errors.password}</p>}
              </div>

              <div className="login-page__form-row">
                <label className="login-page__remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="login-page__forgot"
                  onClick={() =>
                    showToast('Password reset', 'info', 'Contact your HR admin to reset your password.')
                  }
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={isLoading} className="wn-btn-primary w-full py-3 rounded-xl">
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>

              {showResendVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="wn-btn-secondary w-full"
                >
                  {isResending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </form>
          </section>
        </div>
      </main>

      <footer className="login-page__footer">
        © {new Date().getFullYear()} WorkNest Systems · All rights reserved
      </footer>
    </div>
  );
};
