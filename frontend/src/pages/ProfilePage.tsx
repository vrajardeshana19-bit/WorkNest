import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmployeeById } from '../services/api';
import type { Employee } from '../types';
import { EmployeeProfileView } from '../components/employees/EmployeeProfileView';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { UserCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getEmployeeById(user.employeeId);
      setEmployee(data);
    } catch {
      showToast('Error loading profile details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  if (isLoading) return <LoadingSpinner label="Loading profile information..." />;

  if (!employee) {
    return (
      <div className="p-8 text-center text-slate-600">
        <p>Profile record not found for active user.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-wn-secondary" />
            <span>My Profile</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Logged in as <strong className="text-slate-800">{user?.name}</strong> ({role} Role)
          </p>
        </div>
      </div>

      <EmployeeProfileView employee={employee} isReadOnly={role !== 'ADMIN'} onUpdate={loadProfile} />
    </div>
  );
};
