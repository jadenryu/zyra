'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from './api';

interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  organization?: string;
  role?: string;
  theme_preference: string;
  language: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await authAPI.me();
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    await checkAuth();
  };

  const register = async (userData: any) => {
    const response = await authAPI.register(userData);
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    await checkAuth();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 