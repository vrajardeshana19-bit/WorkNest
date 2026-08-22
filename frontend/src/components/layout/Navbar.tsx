import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';
import {
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  KeyRound,
  Calendar,
} from 'lucide-react';
import { WorkNestLogo } from '../common/WorkNestLogo';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

const roleLabels: Record<Role, string> = {
  EMPLOYEE: 'Employee',
  HR: 'HR',
  ADMIN: 'Admin',
};

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { user, role, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['HR', 'ADMIN'] as Role[] },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'timeoff', label: 'Time Off', icon: CalendarDays },
    { id: 'holidays', label: 'Holidays', icon: Calendar, roles: ['HR', 'ADMIN'] as Role[] },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
  ].filter((item) => !item.roles || item.roles.includes(role));

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'WN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-wn-outline-variant/30">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2.5">
            <WorkNestLogo size="sm" />
            <span className="text-lg font-bold text-wn-primary font-[family-name:var(--font-geist)]">WorkNest</span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-sm ${isActive ? 'wn-nav-active' : 'wn-nav-item'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-wn-surface-container-low transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-wn-secondary-container flex items-center justify-center text-[11px] font-semibold text-white">
                    {getUserInitials(user.name)}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-wn-on-surface-variant ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 wn-card py-1 z-50 shadow-lg">
                    <div className="px-3 py-2 border-b border-wn-outline-variant/20">
                      <p className="text-sm font-medium text-wn-primary truncate">{user.name}</p>
                      <p className="text-xs text-wn-on-surface-variant truncate">{roleLabels[role]} · {user.email}</p>
                    </div>
                    <button type="button" onClick={() => { onNavigate('profile'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-wn-on-surface hover:bg-wn-surface-container-low">
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button type="button" onClick={() => { onNavigate('change-password'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-wn-on-surface hover:bg-wn-surface-container-low">
                      <KeyRound className="w-4 h-4" /> Change password
                    </button>
                    <div className="border-t border-wn-outline-variant/20 my-1" />
                    <button type="button" onClick={() => { logout(); onNavigate('login'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-wn-error hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-lg border border-wn-outline-variant/40">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-wn-outline-variant/20 px-3 py-2 space-y-0.5 bg-white/95">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => handleNavClick(item.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${currentTab === item.id ? 'bg-wn-surface-container-low text-wn-secondary font-medium' : 'text-wn-on-surface-variant'}`}>
              {item.label}
            </button>
          ))}
          <button onClick={() => { logout(); onNavigate('login'); }} className="w-full text-left px-3 py-2 rounded-lg text-sm text-wn-error">Sign out</button>
        </div>
      )}
    </header>
  );
};
