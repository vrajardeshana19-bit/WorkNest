import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Role, User } from '../types';
import * as authApi from '../services/authApi';

interface RegisterData {
  companyName: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  login: (loginIdOrEmail: string, password: string, expectedRole: Role) => Promise<void>;
  register: (data: RegisterData) => Promise<{ loginId: string; email: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const role: Role = user?.role ?? 'EMPLOYEE';

  const applySession = useCallback((nextUser: User, forcePasswordChange: boolean) => {
    setUser(nextUser);
    setMustChangePassword(forcePasswordChange);
  }, []);

  const refreshSession = useCallback(async (token: string) => {
    const session = await authApi.loadSession(token);
    applySession(session.user, session.mustChangePassword);
    return session;
  }, [applySession]);

  useEffect(() => {
    const token = authApi.getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    refreshSession(token)
      .catch(() => {
        authApi.clearToken();
        setUser(null);
        setMustChangePassword(false);
      })
      .finally(() => setIsLoading(false));
  }, [refreshSession]);

  const login = async (loginIdOrEmail: string, password: string, expectedRole: Role) => {
    const tokenResponse = await authApi.login(loginIdOrEmail, password);
    authApi.storeToken(tokenResponse.access_token);

    const session = await refreshSession(tokenResponse.access_token);

    if (session.user.role !== expectedRole) {
      authApi.clearToken();
      setUser(null);
      setMustChangePassword(false);
      throw new Error(`This account is registered as ${session.user.role}, not ${expectedRole}.`);
    }

    setMustChangePassword(tokenResponse.must_change_password || session.mustChangePassword);
  };

  const register = async (data: RegisterData) => {
    const { firstName, lastName } = authApi.splitFullName(data.name);
    const companyInitials = authApi.deriveCompanyInitials(data.companyName);

    const result = await authApi.bootstrapSystem({
      company_name: data.companyName,
      company_initials: companyInitials,
      admin_email: data.email,
      admin_first_name: firstName,
      admin_last_name: lastName,
      password: data.password,
    });

    await login(data.email, data.password, 'ADMIN');

    return {
      loginId: result.admin_login_id,
      email: result.admin_email,
    };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const token = authApi.getStoredToken();
    if (!token) throw new Error('Not authenticated');

    const response = await authApi.changePassword(token, currentPassword, newPassword);
    setMustChangePassword(response.must_change_password);

    const session = await refreshSession(token);
    applySession({ ...session.user, isFirstLogin: response.must_change_password }, response.must_change_password);
  };

  const logout = () => {
    authApi.clearToken();
    setUser(null);
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        mustChangePassword,
        login,
        register,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
