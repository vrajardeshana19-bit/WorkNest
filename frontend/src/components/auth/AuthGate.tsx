import React, { useState } from 'react';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { AuthIntroScene } from './AuthIntroScene';

interface AuthGateProps {
  mode: 'login' | 'register';
  onNavigate: (tab: string) => void;
  introComplete: boolean;
  onIntroComplete: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  mode,
  onNavigate,
  introComplete,
  onIntroComplete,
}) => {
  const [authVisible, setAuthVisible] = useState(introComplete);

  const handleIntroComplete = () => {
    onIntroComplete();
    requestAnimationFrame(() => setAuthVisible(true));
  };

  return (
    <div className="relative min-h-screen">
      <div
        className={`transition-all duration-700 ease-out ${
          authVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        {mode === 'register' ? (
          <RegisterPage onNavigate={onNavigate} />
        ) : (
          <LoginPage onNavigate={onNavigate} />
        )}
      </div>

      {!introComplete && <AuthIntroScene onComplete={handleIntroComplete} />}
    </div>
  );
};
