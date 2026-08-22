import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AppBackground } from '../components/layout/AppBackground';
import { WorkNestLogo } from '../components/common/WorkNestLogo';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.companyName.trim()) errs.companyName = 'Company name is required';
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.phone.trim()) errs.phone = 'Phone is required';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 8) errs.password = 'At least 8 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const result = await register({
        companyName: formData.companyName,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      showToast('Account created', 'success', `Admin ID: ${result.loginId}`);
      onNavigate('dashboard');
    } catch (error) {
      showToast('Registration failed', 'error', error instanceof Error ? error.message : 'Could not create workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppBackground>
      <div className="min-h-screen flex flex-col">
        <nav className="glass-panel border-b border-wn-outline-variant/30 px-4 md:px-6 py-3 flex items-center justify-between max-w-[1440px] mx-auto w-full">
          <button type="button" onClick={() => onNavigate('login')} className="flex items-center gap-2">
            <WorkNestLogo size="sm" />
            <span className="text-lg font-bold text-wn-primary font-[family-name:var(--font-geist)]">WorkNest</span>
          </button>
          <button type="button" onClick={() => onNavigate('login')} className="wn-btn-ghost">Sign in</button>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-lg wn-card glass-panel p-6 md:p-8">
            <h1 className="text-2xl font-semibold text-wn-primary font-[family-name:var(--font-geist)]">Create your organization</h1>
            <p className="text-sm text-wn-on-surface-variant mt-1 mb-6">Set up WorkNest for your company.</p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="wn-label block mb-1.5">Company name</label>
                <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className={`wn-input px-3 py-2.5 ${errors.companyName ? 'border-wn-error' : ''}`} />
                {errors.companyName && <p className="mt-1 text-xs text-wn-error">{errors.companyName}</p>}
              </div>
              <div>
                <label className="wn-label block mb-1.5">Your name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`wn-input px-3 py-2.5 ${errors.name ? 'border-wn-error' : ''}`} />
                {errors.name && <p className="mt-1 text-xs text-wn-error">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="wn-label block mb-1.5">Work email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`wn-input px-3 py-2.5 ${errors.email ? 'border-wn-error' : ''}`} />
                  {errors.email && <p className="mt-1 text-xs text-wn-error">{errors.email}</p>}
                </div>
                <div>
                  <label className="wn-label block mb-1.5">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`wn-input px-3 py-2.5 ${errors.phone ? 'border-wn-error' : ''}`} />
                  {errors.phone && <p className="mt-1 text-xs text-wn-error">{errors.phone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="wn-label block mb-1.5">Password</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`wn-input px-3 py-2.5 ${errors.password ? 'border-wn-error' : ''}`} />
                  {errors.password && <p className="mt-1 text-xs text-wn-error">{errors.password}</p>}
                </div>
                <div>
                  <label className="wn-label block mb-1.5">Confirm password</label>
                  <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className={`wn-input px-3 py-2.5 ${errors.confirmPassword ? 'border-wn-error' : ''}`} />
                  {errors.confirmPassword && <p className="mt-1 text-xs text-wn-error">{errors.confirmPassword}</p>}
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="wn-btn-primary w-full py-3 mt-2">
                {isLoading ? 'Creating...' : 'Get Started'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppBackground>
  );
};
