import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Search, Bell, HelpCircle, Menu, User, ChevronRight } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggleMobile?: () => void;
  collapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onToggleMobile,
  collapsed = false,
}) => {
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
    <header className="sticky top-0 right-0 z-30 w-full bg-white/95 border-b border-[#E2E8F0] backdrop-blur-md shadow-subtle transition-all duration-200">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16 w-full">
        {/* Left: Mobile Toggle + Breadcrumbs */}
        <div className="flex items-center gap-3 lg:gap-5 flex-1 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors"
            title="Open Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] shrink-0">
            <Link href="/dashboard" className="hover:text-[#172033] transition-colors">
              LoyaltyLens
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#2563EB] font-semibold capitalize">{title}</span>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-72 hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers, cities, tiers..."
              className="w-full bg-[#F8FAFC] text-[#172033] text-xs pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all placeholder:text-[#94A3B8]"
            />
          </form>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Organization badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#172033]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
            <span className="truncate max-w-[140px]">{user?.organization_name || 'Acme Retention'}</span>
          </div>

          {/* Notification Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-[#64748B] hover:bg-slate-100 hover:text-[#172033] transition-colors relative"
              title="System Alerts"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-white"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-[#E2E8F0] shadow-dropdown p-4 space-y-3 z-50 text-xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="font-bold text-[#172033]">System Notifications</span>
                  <span className="text-[10px] uppercase font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    2 NEW
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="font-semibold text-[#172033]">High Churn Risk Cluster</p>
                    <p className="text-[#64748B] mt-0.5">Elevated churn probability observed among food delivery users in Coimbatore.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="font-semibold text-[#172033]">AI Executive Synthesis</p>
                    <p className="text-[#64748B] mt-0.5">Weekly retention action plan ready in AI Insights.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help Button */}
          <button
            onClick={() => window.open('https://github.com/GokulAnjaan-786/LoyaltyLens', '_blank')}
            className="p-2 rounded-lg text-[#64748B] hover:bg-slate-100 hover:text-[#172033] transition-colors hidden sm:block"
            title="Documentation & Source"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Profile Pill */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 pl-2.5 border-l border-[#E2E8F0] hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#172033] leading-none">
                {user?.full_name?.split(' ')[0] || 'User'}
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5">
                {user?.role || 'Admin'}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};
