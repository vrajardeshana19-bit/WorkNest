import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppBackground } from './components/layout/AppBackground';
import { Navbar } from './components/layout/Navbar';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AuthGate } from './components/auth/AuthGate';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AttendancePage } from './pages/AttendancePage';
import { TimeOffPage } from './pages/TimeOffPage';
import { PayrollPage } from './pages/PayrollPage';
import { HolidaysPage } from './pages/HolidaysPage';
import { WorkNestLogo } from './components/common/WorkNestLogo';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('login');
  const [verifyEmailToken, setVerifyEmailToken] = useState<string | null>(null);
  const [authIntroComplete, setAuthIntroComplete] = useState(false);

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
      onIntroComplete: () => setAuthIntroComplete(true),
      onNavigate: (tab: string) => setCurrentTab(tab),
    };
    if (currentTab === 'verify-email' && verifyEmailToken) {
      return (
        <VerifyEmailPage
          token={verifyEmailToken}
          onNavigate={(tab) => {
            window.history.replaceState({}, '', '/');
            setVerifyEmailToken(null);
            setCurrentTab(tab);
          }}
        />
      );
    }
    if (currentTab === 'register') {
      return <AuthGate mode="register" {...authIntroProps} />;
    }
    return <AuthGate mode="login" {...authIntroProps} />;
  }

  if (currentTab === 'change-password' || mustChangePassword) {
    return (
      <AppBackground>
        <ChangePasswordPage onNavigate={(tab) => setCurrentTab(tab)} />
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <div className="min-h-screen flex flex-col text-wn-on-surface">
        <Navbar currentTab={currentTab} onNavigate={(tab) => setCurrentTab(tab)} />

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-6 py-6 md:py-8">
          {currentTab === 'dashboard' && <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />}
          {currentTab === 'employees' && <EmployeesPage />}
          {currentTab === 'profile' && <ProfilePage />}
          {currentTab === 'attendance' && <AttendancePage />}
          {currentTab === 'timeoff' && <TimeOffPage />}
          {currentTab === 'holidays' && <HolidaysPage />}
          {currentTab === 'payroll' && <PayrollPage />}
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
