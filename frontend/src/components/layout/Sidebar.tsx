import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  RefreshCw,
  Megaphone,
  Sliders,
  Sparkles,
  UploadCloud,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const router = useRouter();
  const { user, appType, setAppType, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Retention Intelligence', href: '/retention', icon: RefreshCw },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'Retention Simulator', href: '/simulator', icon: Sliders },
    { name: 'AI Insights', href: '/ai-insights', icon: Sparkles },
    { name: 'Data Upload', href: '/upload', icon: UploadCloud },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main White Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen z-40 bg-white border-r border-[#E2E8F0] flex flex-col justify-between select-none transition-all duration-200 ease-in-out shadow-subtle ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Logo & Nav items */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#E2E8F0] shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 overflow-hidden focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base text-[#172033] tracking-tight leading-tight">
                      LoyaltyLens
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      SaaS
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] truncate">
                    Retention Intelligence
                  </span>
                </div>
              )}
            </Link>

            {/* Close button for Mobile drawer */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-slate-100"
              title="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Industry Context Selector (Shown when not collapsed) */}
          {!collapsed && (
            <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                Industry Context
              </label>
              <select
                value={appType}
                onChange={(e) => setAppType(e.target.value)}
                className="w-full bg-white text-[#172033] text-xs font-medium rounded-md border border-[#E2E8F0] px-2.5 py-1.5 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm cursor-pointer"
              >
                <option value="🍔 Food Delivery App">🍔 Food Delivery</option>
                <option value="🛒 Shopping / E-commerce App">🛒 E-Commerce</option>
                <option value="📚 Learning / Education App">📚 EdTech / Learning</option>
              </select>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                router.pathname === item.href ||
                (item.href !== '/dashboard' && router.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={collapsed ? item.name : undefined}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold border-l-4 border-[#2563EB]'
                      : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC]'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#172033]'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings, Profile, Logout, Collapse Toggle */}
        <div className="p-3 border-t border-[#E2E8F0] space-y-1 bg-[#F8FAFC]/50">
          <Link
            href="/settings"
            onClick={onCloseMobile}
            title={collapsed ? 'Settings' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              router.pathname === '/settings'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC]'
            } ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <Link
            href="/profile"
            onClick={onCloseMobile}
            title={collapsed ? 'Profile' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              router.pathname === '/profile'
                ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC]'
            } ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <User className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Profile</span>}
          </Link>

          <button
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-red-50 transition-all w-full text-left ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* Desktop Collapse / Expand Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-full py-1.5 mt-2 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-slate-200/60 transition-colors text-xs font-medium"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse</span>
                </div>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
