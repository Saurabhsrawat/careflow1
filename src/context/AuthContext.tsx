import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  hospital_id?: string;
  date_of_birth?: string;
  contact?: string;
  emergency_contact?: string;
  blood_group?: string;
  specialization?: string;
  license_number?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  quickLogin: (email: string, roleName?: string) => Promise<boolean>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('careflow_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const storedToken = localStorage.getItem('careflow_token');
      setToken(storedToken);
      const headers: Record<string, string> = {};
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      const res = await fetch('/api/auth/me', { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return false;
      }

      if (data.token) {
        localStorage.setItem('careflow_token', data.token);
        setToken(data.token);
      }
      setUser(data.user);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login request failed');
      setLoading(false);
      return false;
    }
  };

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return false;
      }

      if (data.token) {
        localStorage.setItem('careflow_token', data.token);
        setToken(data.token);
      }
      setUser(data.user);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Registration request failed');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const storedToken = localStorage.getItem('careflow_token');
      const headers: Record<string, string> = {};
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      await fetch('/api/auth/logout', { method: 'POST', headers, credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('careflow_token');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const quickLogin = async (email: string): Promise<boolean> => {
    return login(email, 'password123');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        quickLogin,
        clearError,
        refreshUser: fetchCurrentUser,
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
