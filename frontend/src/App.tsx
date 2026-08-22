import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppBackground } from './components/layout/AppBackground';
import { Navbar } from './components/layout/Navbar';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AuthGate } from './components/auth/AuthGate';
import { WorkNestLogo } from './components/common/WorkNestLogo';

const VerifyEmailPage = lazy(() =>
  import('./pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage }))
);
const ChangePasswordPage = lazy(() =>
  import('./pages/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const EmployeesPage = lazy(() =>
  import('./pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const AttendancePage = lazy(() =>
  import('./pages/AttendancePage').then((m) => ({ default: m.AttendancePage }))
);
const TimeOffPage = lazy(() =>
  import('./pages/TimeOffPage').then((m) => ({ default: m.TimeOffPage }))
);
const PayrollPage = lazy(() =>
  import('./pages/PayrollPage').then((m) => ({ default: m.PayrollPage }))
);
const HolidaysPage = lazy(() =>
  import('./pages/HolidaysPage').then((m) => ({ default: m.HolidaysPage }))
);

const INTRO_SESSION_KEY = 'worknest_intro_seen';

const PageFallback = () => (
  <div className="flex items-center justify-center py-24">
    <LoadingSpinner label="Loading page..." />
  </div>
);

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('login');
  const [verifyEmailToken, setVerifyEmailToken] = useState<string | null>(null);
  const [authIntroComplete, setAuthIntroComplete] = useState(() => {
    try {
      return sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, '');
    const params = new URLSearchParams(window.location.search);
    if (path.endsWith('/verify-email')) {
      const token = params.get('token');
      if (token) {
        setVerifyEmailToken(token);
        setCurrentTab('verify-email');
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && mustChangePassword) {
      setCurrentTab('change-password');
    }
  }, [isAuthenticated, mustChangePassword]);

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setAuthIntroComplete(true);
  };

  if (isLoading) {
    return (
      <AppBackground>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <WorkNestLogo size="lg" />
          <LoadingSpinner label="Loading..." />
        </div>
      </AppBackground>
    );
  }

  if (!isAuthenticated) {
    const authIntroProps = {
      introComplete: authIntroComplete,
      onIntroComplete: handleIntroComplete,
      onNavigate: (tab: string) => setCurrentTab(tab),
    };
    if (currentTab === 'verify-email' && verifyEmailToken) {
      return (
        <Suspense fallback={<PageFallback />}>
          <VerifyEmailPage
            token={verifyEmailToken}
            onNavigate={(tab) => {
              window.history.replaceState({}, '', '/');
              setVerifyEmailToken(null);
              setCurrentTab(tab);
            }}
          />
        </Suspense>
      );
    }
    return <AuthGate mode={currentTab === 'register' ? 'register' : 'login'} {...authIntroProps} />;
  }

  if (currentTab === 'change-password' || mustChangePassword) {
    return (
      <AppBackground>
        <Suspense fallback={<PageFallback />}>
          <ChangePasswordPage onNavigate={(tab) => setCurrentTab(tab)} />
        </Suspense>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <div className="min-h-screen flex flex-col text-wn-on-surface">
        <Navbar currentTab={currentTab} onNavigate={(tab) => setCurrentTab(tab)} />

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-6 py-6 md:py-8">
          <Suspense fallback={<PageFallback />}>
            {currentTab === 'dashboard' && <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />}
            {currentTab === 'employees' && <EmployeesPage />}
            {currentTab === 'profile' && <ProfilePage />}
            {currentTab === 'attendance' && <AttendancePage />}
            {currentTab === 'timeoff' && <TimeOffPage />}
            {currentTab === 'holidays' && <HolidaysPage />}
            {currentTab === 'payroll' && <PayrollPage />}
          </Suspense>
        </main>

        <footer className="border-t border-wn-outline-variant/30 bg-wn-surface-container-lowest/80 backdrop-blur-sm">
          <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-wn-on-surface-variant">
            <div className="flex items-center gap-2">
              <WorkNestLogo size="xs" />
              <span className="font-semibold text-wn-primary font-[family-name:var(--font-geist)]">WorkNest</span>
            </div>
            <span>© {new Date().getFullYear()} WorkNest Enterprise</span>
          </div>
        </footer>
      </div>
    </AppBackground>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
