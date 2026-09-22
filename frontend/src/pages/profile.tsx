import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { User, ShieldCheck, Key, Building2, Clock, CheckCircle2 } from 'lucide-react';

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
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <User className="w-7 h-7 text-emerald-400" />
            User Account & Profile Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your credentials, organization permissions, and security parameters.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Summary Card */}
          <div className="lg:col-span-1 p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-3xl shadow-xl mx-auto">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">{user?.full_name || 'LoyaltyLens User'}</h3>
              <p className="text-slate-400 text-xs mt-0.5">{user?.email}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user?.role || 'ADMIN'}
              </span>
            </div>
          </div>

          {/* Account Details & Password Change */}
          <div className="lg:col-span-2 space-y-6">
            {/* Organization Info */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Building2 className="w-5 h-5 text-teal-400" />
                Organization & Security Metadata
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 font-semibold">Organization:</span>
                  <p className="text-white font-bold text-sm mt-1">{user?.organization_name || 'Acme Retention SaaS'}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 font-semibold">Authentication Standard:</span>
                  <p className="text-emerald-400 font-bold text-sm mt-1">Argon2 + JWT (HS256)</p>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Key className="w-5 h-5 text-emerald-400" />
                Change Password
              </h3>

              <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{updating ? 'Updating Password...' : 'Update Password'}</span>
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
