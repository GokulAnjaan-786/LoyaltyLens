import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title = 'Dashboard', subtitle }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-on-surface">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-body-sm font-body-sm text-on-surface-variant">Loading LoyaltyLens Enterprise Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased font-body-md text-body-md selection:bg-secondary/30 selection:text-secondary">
      <Sidebar />
      <Header title={title} subtitle={subtitle} />
      <main className="pl-60 min-h-[calc(100vh-4rem)] p-margin-desktop space-y-6">
        {children}
      </main>
    </div>
  );
};
