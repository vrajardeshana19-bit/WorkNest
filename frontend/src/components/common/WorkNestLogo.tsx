import React from 'react';

const LOGO_SRC = '/worknest-logo.png';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<LogoSize, string> = {
  xs: 'w-7 h-7',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-14 h-14',
};

interface WorkNestLogoProps {
  size?: LogoSize;
  className?: string;
  showGlow?: boolean;
}

export const WorkNestLogo: React.FC<WorkNestLogoProps> = ({
  size = 'sm',
  className = '',
  showGlow: _showGlow = false,
}) => {
  return (
    <div
      className={`relative shrink-0 ${sizeClasses[size]} ${className}`}
      aria-hidden={false}
      role="img"
      aria-label="WorkNest logo"
    >
      <img
        src={LOGO_SRC}
        alt="WorkNest"
        className="w-full h-full rounded-md object-cover"
      />
    </div>
  );
};
