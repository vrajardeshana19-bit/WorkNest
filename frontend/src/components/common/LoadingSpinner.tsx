import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  label = 'Loading...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-[3px]',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500 min-h-[120px]">
      <div
        className={`${sizeClasses[size]} border-slate-200 border-t-blue-700 rounded-full animate-spin mb-3`}
      />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
};
