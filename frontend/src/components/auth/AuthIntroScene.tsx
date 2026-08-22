import React, { useEffect, useState, useCallback } from 'react';
import {
  User,
  Clock,
  CalendarDays,
  CreditCard,
  Users,
  ChevronDown,
} from 'lucide-react';
import { WorkNestLogo } from '../common/WorkNestLogo';
import './authIntro.css';

export type IntroPhase = 'logo' | 'orbit' | 'converge' | 'flow' | 'exit';

interface AuthIntroSceneProps {
  onComplete: () => void;
}

const ORBIT_CARDS = [
  { label: 'Employee profile', icon: User, angle: 0, delay: 0.1 },
  { label: 'Attendance', icon: Clock, angle: 72, delay: 0.2 },
  { label: 'Leave request', icon: CalendarDays, angle: 144, delay: 0.3 },
  { label: 'Payroll', icon: CreditCard, angle: 216, delay: 0.4 },
  { label: 'Team', icon: Users, angle: 288, delay: 0.5 },
] as const;

const FLOW_STEPS = ['Employee', 'Attendance', 'Leave', 'Payroll'];

const ORBIT_RADIUS = 248;

const TIMING = {
  logo: 900,
  orbit: 2600,
  converge: 1500,
  flow: 1200,
  exit: 650,
} as const;

export const AuthIntroScene: React.FC<AuthIntroSceneProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<IntroPhase>('logo');
  const [exiting, setExiting] = useState(false);

  const finish = useCallback(() => {
    setPhase('exit');
    setExiting(true);
    window.setTimeout(onComplete, TIMING.exit);
  }, [onComplete]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const logoMs = reducedMotion ? 1200 : TIMING.logo;
    const orbitMs = reducedMotion ? 0 : TIMING.orbit;
    const convergeMs = reducedMotion ? 0 : TIMING.converge;
    const flowMs = reducedMotion ? 800 : TIMING.flow;

    const timers = [
      window.setTimeout(() => setPhase('orbit'), logoMs),
      window.setTimeout(() => setPhase('converge'), logoMs + orbitMs),
      window.setTimeout(() => setPhase('flow'), logoMs + orbitMs + convergeMs),
      window.setTimeout(finish, logoMs + orbitMs + convergeMs + flowMs),
    ];

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [finish]);

  const showOrbit = phase === 'orbit' || phase === 'converge';
  const showFlow = phase === 'flow' || phase === 'exit';
  const orbitClass =
    phase === 'converge' || phase === 'flow' || phase === 'exit'
      ? 'auth-intro-orbit--converge'
      : 'auth-intro-orbit--spin';

  const logoPhase =
    phase === 'logo' ? 'logo' : phase === 'converge' || phase === 'flow' ? 'converge' : 'orbit';

  const stageMode =
    phase === 'flow' || phase === 'exit' ? 'flow' : showOrbit ? 'orbit' : 'logo';

  return (
    <div
      className={`auth-intro-root ${exiting ? 'auth-intro-root--exit' : ''}`}
      role="presentation"
      aria-hidden={exiting}
    >
      <button type="button" className="auth-intro-skip" onClick={finish}>
        Skip intro
      </button>

      <div className={`auth-intro-stage auth-intro-stage--${stageMode}`}>
        <div
          className={`auth-intro-orbit-ring ${
            showOrbit && phase !== 'converge' ? 'auth-intro-orbit-ring--visible' : ''
          } ${phase === 'converge' ? 'auth-intro-orbit-ring--fade' : ''}`}
        />

        {showOrbit && (
          <div className={`auth-intro-orbit ${orbitClass}`}>
            {ORBIT_CARDS.map(({ label, icon: Icon, angle, delay }) => (
              <div
                key={label}
                className="auth-flow-card-slot"
                style={{
                  transform: `rotateY(${angle}deg) translateZ(${ORBIT_RADIUS}px)`,
                }}
              >
                <div
                  className="auth-flow-card"
                  style={{
                    animationDelay: `${delay}s`,
                    ['--card-angle' as string]: `${angle}deg`,
                  }}
                >
                  <div className="auth-flow-card-icon">
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="auth-flow-card-label">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="auth-intro-center">
          <div className={`auth-intro-logo-wrap auth-intro-logo-wrap--phase-${logoPhase}`}>
            <div className="auth-intro-logo-glow" />
            <div className={`auth-intro-logo-panel ${showFlow ? 'auth-intro-logo-panel--compact' : ''}`}>
              <WorkNestLogo size={showFlow ? 'lg' : 'xl'} showGlow={false} />
              <h1 className="auth-intro-wordmark">WorkNest</h1>
              {!showFlow && (
                <p className="auth-intro-tagline">Connected workforce platform</p>
              )}
            </div>
          </div>

          <div className={`auth-intro-flow-stack ${showFlow ? 'auth-intro-flow-stack--visible' : ''}`}>
            {FLOW_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div
                  className="auth-intro-flow-node"
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  {step}
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ChevronDown
                    className="auth-intro-flow-arrow w-3.5 h-3.5"
                    strokeWidth={2.5}
                    style={{ animationDelay: `${i * 0.12 + 0.06}s` }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
