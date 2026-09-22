import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const { user, appType, setAppType, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Customers', href: '/customers', icon: 'group' },
    { name: 'Analytics', href: '/analytics', icon: 'analytics' },
    { name: 'Retention', href: '/retention', icon: 'autorenew' },
    { name: 'Campaigns', href: '/campaigns', icon: 'campaign' },
    { name: 'Simulator', href: '/simulator', icon: 'tune' },
    { name: 'AI Insights', href: '/ai-insights', icon: 'psychology' },
    { name: 'Data Upload', href: '/upload', icon: 'cloud_upload' },
  ];

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-5 left-5 z-50 p-3 rounded-full bg-secondary-container text-on-secondary-container shadow-2xl border border-secondary/40"
        title="Toggle Menu"
      >
        <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Stitch Fixed SideNavBar (240px) */}
      <aside
        className={`fixed top-0 left-0 h-screen w-60 z-40 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col justify-between p-space-md select-none transition-all duration-150 ease-in-out ${
          mobileOpen ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Top Brand & Navigation */}
        <div className="space-y-6">
          {/* Logo Block */}
          <div className="flex items-center gap-space-sm px-space-xs pt-1">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-surface-container-high border border-outline-variant/40 shrink-0 p-1">
              <img
                src="/logo/loyaltylens-logo.png"
                alt="LoyaltyLens Enterprise Logo mark"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-headline-md font-headline-md font-bold text-on-surface tracking-tight leading-tight truncate">
                LoyaltyLens
              </span>
              <span className="text-label-caps font-label-caps text-on-surface-variant truncate">
                Enterprise Retention Intelligence
              </span>
            </div>
          </div>

          {/* Industry Context Selector */}
          <div className="px-space-xs">
            <label className="block text-label-caps font-label-caps text-on-surface-variant mb-1">
              Industry Mode
            </label>
            <div className="relative">
              <select
                value={appType}
                onChange={(e) => setAppType(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface text-body-sm font-body-sm rounded-lg border border-outline-variant/40 px-2.5 py-1.5 pr-8 appearance-none focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              >
                <option value="🍔 Food Delivery App">🍔 Food Delivery</option>
                <option value="🛒 Shopping / E-commerce App">🛒 E-Commerce</option>
                <option value="📚 Learning / Education App">📚 EdTech / Learning</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-[18px]">
                unfold_more
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive =
                router.pathname === item.href ||
                (item.href !== '/dashboard' && router.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors duration-150 ease-out ${
                    isActive
                      ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive ? 'text-secondary' : 'text-on-surface-variant'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-body-sm font-body-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Navigation: Settings, Profile, Logout */}
        <div className="pt-4 border-t border-outline-variant/30 flex flex-col gap-1">
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors duration-150 ease-out ${
              router.pathname === '/settings'
                ? 'bg-surface-container-high text-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-body-sm font-body-sm">Settings</span>
          </Link>

          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors duration-150 ease-out ${
              router.pathname === '/profile'
                ? 'bg-surface-container-high text-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span className="text-body-sm font-body-sm">Profile</span>
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-error hover:bg-error-container/20 transition-colors duration-150 ease-out w-full text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-body-sm font-body-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
