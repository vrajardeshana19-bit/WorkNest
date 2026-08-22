import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ChangePasswordPageProps {
  onNavigate: (page: string) => void;
}

export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({ onNavigate }) => {
  const { changePassword, user, mustChangePassword } = useAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errs: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword) errs.currentPassword = 'Current password is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    else if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';

    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('Password updated successfully', 'success', 'Your new security password is active.');
      onNavigate('dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      showToast('Failed to update password', 'error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-amber-500/10 border border-amber-300 p-0.5 shadow-sm mb-4">
          <KeyRound className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Update Security Password</h2>
        {(user?.isFirstLogin || mustChangePassword) && (
          <div className="mt-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-left text-amber-900 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Password change required:</strong> Use your current or temporary password below, then set a new
              one to continue.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 py-8 px-6 shadow-sm rounded-lg sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-600 font-medium mb-1.5">
                Current Password *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current or temporary password"
                className={`w-full px-3.5 py-2.5 bg-white border ${
                  errors.currentPassword ? 'border-rose-500' : 'border-slate-200 focus:border-blue-300'
                } rounded-xl text-sm text-slate-800 placeholder-slate-500 focus:outline-none`}
              />
              {errors.currentPassword && <p className="mt-1 text-xs text-rose-700">{errors.currentPassword}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 font-medium mb-1.5">
                New Password *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className={`w-full px-3.5 py-2.5 bg-white border ${
                  errors.newPassword ? 'border-rose-500' : 'border-slate-200 focus:border-blue-300'
                } rounded-xl text-sm text-slate-800 placeholder-slate-500 focus:outline-none`}
              />
              {errors.newPassword && <p className="mt-1 text-xs text-rose-700">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 font-medium mb-1.5">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`w-full px-3.5 py-2.5 bg-white border ${
                  errors.confirmPassword ? 'border-rose-500' : 'border-slate-200 focus:border-blue-300'
                } rounded-xl text-sm text-slate-800 placeholder-slate-500 focus:outline-none`}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-rose-700">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-wn-secondary hover:bg-wn-secondary disabled:opacity-50 shadow-sm shadow-slate-200/30 transition-all mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Password & Continue</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
