import React from 'react';

export const AppBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen wn-app-bg relative">
    <div className="relative z-10">{children}</div>
  </div>
);
