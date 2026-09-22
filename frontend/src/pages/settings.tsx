import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Settings, User, Building, Cpu, Key, Database, CheckCircle, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { user, appType } = useAuth();
  const [seeding, setSeeding] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleReSeed = async () => {
    if (!confirm('Re-seeding database will populate synthetic customer profiles and demo campaigns. Continue?')) {
      return;
    }
    setSeeding(true);
    setSeedMessage(null);
    try {
      const res = await api.post('/admin/seed');
      setSeedMessage(res.data.message || 'Database successfully re-seeded!');
    } catch (err: any) {
      setSeedMessage('Failed to re-seed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-emerald-400" />
            Platform & Governance Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage organization multi-tenancy parameters, user security roles, ML model settings, and integration keys.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User & Organization Card */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-5 h-5 text-emerald-400" />
              User Profile & Role
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-semibold">Full Name:</span>
                <span className="text-white font-bold">{user?.full_name || 'LoyaltyLens Admin'}</span>
              </div>

              <div className="flex justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-semibold">Email:</span>
                <span className="text-white font-bold">{user?.email}</span>
              </div>

              <div className="flex justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-semibold">Access Role:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {user?.role || 'ADMIN'}
                </span>
              </div>
            </div>
          </div>

          {/* ML & AI Engine Configuration Card */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu className="w-5 h-5 text-teal-400" />
              ML & AI Engine Configuration
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-semibold">Active Baseline Model:</span>
                <span className="text-teal-300 font-bold">Logistic Regression (v1.0)</span>
              </div>

              <div className="flex justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-semibold">Configured Risk Thresholds:</span>
                <span className="text-amber-400 font-bold">Low &le; 30 | Med &le; 60 | High &gt; 60</span>
              </div>

              <div className="flex justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-semibold">Gemini AI Service:</span>
                <span className="text-emerald-400 font-bold">Active / Fallback Enabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Management & Demo Data */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-5 h-5 text-purple-400" />
            Demo Data & Environment Controls
          </h3>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div>
              <p className="text-white font-bold text-sm">Re-seed Synthetic Demo Dataset</p>
              <p className="text-slate-400 text-xs mt-1">
                Populate 150 synthetic Indian city customer records and sample campaigns for testing.
              </p>
            </div>

            <button
              onClick={handleReSeed}
              disabled={seeding}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Seeding DB...' : 'Re-Seed Synthetic Data'}</span>
            </button>
          </div>

          {seedMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-medium">
              {seedMessage}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
