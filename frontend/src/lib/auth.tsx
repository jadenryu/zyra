'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('access_token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('Auth login called with:', { email, password: '***' });
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Login response error:', error);
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful, token received');
      localStorage.setItem('access_token', data.access_token);
      
      // Try to get user data, but don't fail login if it doesn't work
      try {
        const userResponse = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('User data retrieved:', userData.email);
          setUser(userData);
        } else {
          console.warn('Could not fetch user data, but login was successful');
          // Set a minimal user object with the email
          setUser({
            id: 'temp',
            email: email,
            full_name: email,
            is_active: true,
            created_at: new Date().toISOString(),
          });
        }
      } catch (userError) {
        console.warn('User data fetch failed, but login was successful:', userError);
        // Set a minimal user object with the email
        setUser({
          id: 'temp',
          email: email,
          full_name: email,
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Login error in auth context:', error);
      throw error;
    }
  };

  const register = async (data: { email: string; password: string; full_name: string }) => {
    console.log('Auth register called with:', { ...data, password: '***' });
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Register response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Register response error:', error);
        throw new Error(error.detail || 'Registration failed');
      }

      const userData = await response.json();
      console.log('Registration successful:', userData.email);
      
      // Auto-login after registration
      await login(data.email, data.password);
    } catch (error) {
      console.error('Registration error in auth context:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    router.push('/');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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