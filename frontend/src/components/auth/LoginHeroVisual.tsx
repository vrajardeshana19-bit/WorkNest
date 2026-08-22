import React, { useMemo } from 'react';
import { CalendarDays, Shield, Users, Clock, CreditCard } from 'lucide-react';
import { WorkNestLogo } from '../common/WorkNestLogo';

const ICONS = [CalendarDays, Shield, Users, Clock, CreditCard] as const;

const VIEW = 400;
const CENTER = VIEW / 2;
const ORBIT_RADIUS = 148;

function polarPosition(index: number, total: number, radius: number) {
  const angleDeg = -90 + index * (360 / total);
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER + radius * Math.sin(angleRad),
    left: 50 + (radius / (VIEW / 2)) * 50 * Math.cos(angleRad),
    top: 50 + (radius / (VIEW / 2)) * 50 * Math.sin(angleRad),
  };
}

export const LoginHeroVisual: React.FC = () => {
  const nodes = useMemo(
    () =>
      ICONS.map((icon, i) => ({
        icon,
        ...polarPosition(i, ICONS.length, ORBIT_RADIUS),
        delay: i * 0.12,
      })),
    []
  );

  return (
    <div className="login-hero-visual" aria-hidden="true">
      <svg
        className="login-hero-visual__lines"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {nodes.map(({ x, y }, i) => (
          <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} />
        ))}
      </svg>

      <div className="login-hero-visual__hub">
        <WorkNestLogo size="xl" showGlow />
      </div>

      {nodes.map(({ icon: Icon, left, top, delay }, i) => (
        <div
          key={i}
          className="login-hero-visual__node"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            animationDelay: `${delay}s`,
          }}
        >
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      ))}
    </div>
  );
};
