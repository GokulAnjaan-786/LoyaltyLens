import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const router = useRouter();
  const { user, appType } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/customers?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 right-0 z-30 w-full pl-60 bg-surface-container-low/95 border-b border-outline-variant/30 backdrop-blur-md">
      <div className="flex items-center justify-between px-gutter-desktop h-16 w-full">
        {/* Left side: Breadcrumbs & Search Bar */}
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-body-sm font-body-sm shrink-0">
            <Link href="/dashboard" className="text-on-surface-variant hover:text-on-surface transition-colors">
              LoyaltyLens
            </Link>
            <span className="text-outline">/</span>
            <span className="text-secondary font-medium capitalize">{title}</span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-72 hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cohorts, customers, models..."
              className="w-full bg-surface-container-lowest text-on-surface text-body-sm font-body-sm pl-9 pr-4 py-1.5 rounded-lg border border-outline-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </form>
        </div>

        {/* Center Links */}
        <div className="hidden lg:flex items-center gap-6 px-4 shrink-0">
          <Link
            href="/dashboard"
            className={`text-body-md font-body-md transition-colors pb-1 ${
              router.pathname === '/dashboard'
                ? 'text-primary font-semibold border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Executive Overview
          </Link>
          <Link
            href="/retention"
            className={`text-body-md font-body-md transition-colors pb-1 ${
              router.pathname === '/retention'
                ? 'text-primary font-semibold border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Retention Matrix
          </Link>
        </div>

        {/* Trailing Controls: Workspace, Notifications, Profile Pill */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Account Switcher */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-body-sm font-body-sm text-on-surface">
            <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
            <span>{user?.organization_name || 'Acme Corp'}</span>
          </div>

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface transition-colors relative"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-low"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-surface-container-high border border-outline-variant/40 shadow-2xl p-4 space-y-3 z-50 text-body-sm font-body-sm">
                <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                  <span className="font-bold text-on-surface">System Alerts</span>
                  <span className="text-label-caps font-label-caps text-secondary font-bold">2 NEW</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <p className="font-semibold text-on-surface">High Risk Spike Detected</p>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">Chennai food users churn probability spiked past 65%.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/20">
                    <p className="font-semibold text-on-surface">AI Weekly Briefing Ready</p>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">Gemini AI completed executive summary synthesis.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help Button */}
          <button
            onClick={() => window.open('https://github.com/GokulAnjaan-786/LoyaltyLens', '_blank')}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface transition-colors hidden sm:block"
            title="Help Documentation"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </button>

          {/* User Profile Pill */}
          <Link
            href="/profile"
            className="flex items-center gap-2 pl-2 border-l border-outline-variant/30 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full border border-secondary/40 bg-surface-container-high flex items-center justify-center font-bold text-secondary text-body-sm">
              {user?.email?.charAt(0).toUpperCase() || 'G'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-body-sm font-body-sm font-semibold text-on-surface leading-none">
                {user?.full_name?.split(' ')[0] || 'Gokul'}
              </span>
              <span className="text-label-caps font-label-caps text-on-surface-variant">
                {user?.role || 'VP Revenue Ops'}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};
