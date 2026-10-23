import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title = 'Dashboard',
  subtitle,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#172033]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-[#64748B]">Loading LoyaltyLens Customer Intelligence...</p>
        </div>
      </div>
    );
  }

  const handleToggleCollapse = () => setCollapsed((prev) => !prev);
  const handleToggleMobile = () => setMobileOpen((prev) => !prev);
  const handleCloseMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] antialiased selection:bg-[#EFF6FF] selection:text-[#2563EB]">
      {/* Sidebar with desktop collapse and mobile drawer support */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobile}
      />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-200 ease-in-out min-h-screen flex flex-col ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header
          title={title}
          subtitle={subtitle}
          onToggleMobile={handleToggleMobile}
          collapsed={collapsed}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
