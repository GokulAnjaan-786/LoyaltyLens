import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  Settings,
  User,
  Building,
  Cpu,
  Key,
  Database,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sliders,
} from 'lucide-react';

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
      setSeedMessage(res.data.message || 'Database successfully re-seeded with 150 customer records!');
    } catch (err: any) {
      setSeedMessage('Failed to re-seed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout title="Settings" subtitle="Platform & Governance Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
              <Settings className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              Platform & Governance Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
            Inspect organization tenant credentials, configured machine learning model parameters, risk thresholds, and environment controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User & Organization Card */}
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
            <h3 className="font-bold text-base text-[#172033] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <User className="w-5 h-5 text-[#2563EB]" />
              User Profile & Role
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">Full Name:</span>
                <span className="text-[#172033] font-bold">{user?.full_name || 'LoyaltyLens Admin'}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">Email:</span>
                <span className="text-[#172033] font-bold">{user?.email}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">Access Role:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]">
                  {user?.role || 'ADMIN'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">Organization:</span>
                <span className="text-[#172033] font-bold">{user?.organization_name || 'Acme Retention'}</span>
              </div>
            </div>
          </div>

          {/* ML & AI Engine Configuration Card */}
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
            <h3 className="font-bold text-base text-[#172033] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Cpu className="w-5 h-5 text-[#0D9488]" />
              ML & AI Engine Configuration
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">Active Baseline Model:</span>
                <span className="text-[#0D9488] font-bold">Logistic Regression (v1.0)</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">Configured Risk Thresholds:</span>
                <span className="text-[#172033] font-bold">Low &le; 30 | Med &le; 60 | High &gt; 60</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">Gemini AI Service:</span>
                <span className="text-[#16A34A] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Online / Deterministic Fallback</span>
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">Risk Engine:</span>
                <span className="text-[#172033] font-bold">Multi-Factor Scoring (100 pts)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Management & Demo Data */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
          <h3 className="font-bold text-base text-[#172033] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
            <Database className="w-5 h-5 text-[#2563EB]" />
            Demo Data & Environment Controls
          </h3>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <div>
              <p className="text-[#172033] font-bold text-sm">Re-seed Synthetic Demo Dataset</p>
              <p className="text-[#64748B] text-xs mt-0.5">
                Populate 150 customer records across Indian operating cities and sample campaigns for testing.
              </p>
            </div>

            <button
              onClick={handleReSeed}
              disabled={seeding}
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center gap-2 shrink-0 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Seeding DB...' : 'Re-Seed Demo Data'}</span>
            </button>
          </div>

          {seedMessage && (
            <div className="p-3.5 rounded-lg bg-green-50 border border-green-200 text-[#16A34A] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{seedMessage}</span>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
