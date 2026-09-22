import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  organization_id: string;
  organization_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  appType: string;
  setAppType: (app: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string, org?: string, industry?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [appType, setAppType] = useState<string>('🍔 Food Delivery App');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('loyaltylens_token');
    const savedUser = localStorage.getItem('loyaltylens_user');
    const savedApp = localStorage.getItem('loyaltylens_apptype');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    if (savedApp) {
      setAppType(savedApp);
    }
    setLoading(false);
  }, []);

  const handleSetAppType = (newApp: string) => {
    setAppType(newApp);
    localStorage.setItem('loyaltylens_apptype', newApp);
  };

  const login = async (email: string, pass: string) => {
    const res = await api.post('/auth/login', { email, password: pass });
    const { access_token, user: userData } = res.data;

    localStorage.setItem('loyaltylens_token', access_token);
    localStorage.setItem('loyaltylens_user', JSON.stringify(userData));

    setToken(access_token);
    setUser(userData);
    router.push('/dashboard');
  };

  const register = async (email: string, pass: string, name?: string, org?: string, industry?: string) => {
    const res = await api.post('/auth/register', {
      email,
      password: pass,
      full_name: name,
      organization_name: org,
      industry: industry || 'Food Delivery App',
    });
    const { access_token, user: userData } = res.data;

    localStorage.setItem('loyaltylens_token', access_token);
    localStorage.setItem('loyaltylens_user', JSON.stringify(userData));

    setToken(access_token);
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('loyaltylens_token');
    localStorage.removeItem('loyaltylens_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        appType,
        setAppType: handleSetAppType,
        login,
        register,
        logout,
        loading,
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
