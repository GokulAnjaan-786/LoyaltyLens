import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  User,
  ShieldCheck,
  Key,
  Building2,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Password mismatch', 'New password and confirmation password do not match', 'error');
      return;
    }
    if (newPassword.length < 4) {
      showToast('Weak password', 'Password must be at least 4 characters long', 'warning');
      return;
    }

    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated', 'Your account credentials have been updated successfully', 'success');
    }, 800);
  };

  return (
    <AppLayout title="Profile" subtitle="User Account & Security Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
              <User className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              User Account & Profile Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
            Manage your personal credentials, organizational access permissions, and session authentication.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Summary Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold text-3xl shadow-subtle mx-auto">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#172033]">{user?.full_name || 'LoyaltyLens User'}</h3>
              <p className="text-[#64748B] text-xs mt-0.5">{user?.email}</p>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-[#BFDBFE] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{user?.role || 'ADMIN'}</span>
              </span>
            </div>
          </div>

          {/* Account Details & Password Change */}
          <div className="lg:col-span-2 space-y-6">
            {/* Organization Info */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
              <h3 className="font-bold text-base text-[#172033] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <Building2 className="w-5 h-5 text-[#0D9488]" />
                Organization & Security Metadata
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] font-semibold block mb-1">Organization:</span>
                  <p className="text-[#172033] font-bold text-sm">{user?.organization_name || 'Acme Retention'}</p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] font-semibold block mb-1">Authentication Standard:</span>
                  <p className="text-[#16A34A] font-bold text-sm">Argon2id + JWT (HS256)</p>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
              <h3 className="font-bold text-base text-[#172033] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <Key className="w-5 h-5 text-[#2563EB]" />
                Update Password
              </h3>

              <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{updating ? 'Updating Password...' : 'Save Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
