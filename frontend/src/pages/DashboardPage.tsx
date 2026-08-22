import React from 'react';
import { useAuth } from '../context/AuthContext';
import { EmployeeDashboard } from '../components/dashboard/EmployeeDashboard';
import { HRCommandCenter } from '../components/dashboard/HRCommandCenter';

export const DashboardPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { role } = useAuth();

  if (role === 'EMPLOYEE') {
    return <EmployeeDashboard onNavigate={onNavigate} />;
  }

  return <HRCommandCenter onNavigate={onNavigate} />;
};
