import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-red-50 text-wn-error border-red-200/80',
    info: 'bg-indigo-50 text-wn-secondary border-indigo-200/80',
    neutral: 'bg-wn-surface-container-low text-wn-on-surface-variant border-wn-outline-variant/40',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2 py-0.5 font-medium',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
};
