import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Users,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { safeNumber } from '@/lib/safeData';

export default function RetentionSimulatorPage() {
  const { appType } = useAuth();

  const getActionsForAppType = (type: string) => {
    if (type.includes('Food')) {
      return ['Offer Discount', 'Free Delivery', 'Faster Delivery Promise', 'Priority Customer Support'];
    } else if (type.includes('Shopping')) {
      return ['Coupon Offer', 'Price Drop Alert', 'Cashback Offer', 'Free Returns'];
    } else if (type.includes('Learning')) {
      return ['Mentor Follow-up', 'Free Extra Classes', 'Reminder Notifications', 'Subscription Extension'];
    }
    return ['Offer Discount', 'Free Delivery', 'Priority Support'];
  };

  const [action, setAction] = useState<string>(getActionsForAppType(appType)[0]);
  const [strength, setStrength] = useState<string>('Medium');
  const [targetRiskLevel, setTargetRiskLevel] = useState<string>('HIGH');
  const [concessionPct, setConcessionPct] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setAction(getActionsForAppType(appType)[0]);
  }, [appType]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/campaigns/simulate', {
        app_type: appType,
        action: action,
        strength: strength,
        target_risk_level: targetRiskLevel,
      });
      setResult(res.data);
    } catch (err: any) {
      console.error('Simulation execution failed:', err);
      setError(err.response?.data?.detail || 'Simulation execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Simulator" subtitle="Retention Strategy Sandbox">
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                  <Sliders className="w-5 h-5 text-[#2563EB]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                  Retention Strategy Simulator
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
                Test and calibrate retention interventions before deploying them live. Predict risk reduction using Bayesian ML simulations.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] w-fit">
              Sandbox Engine v3.8
            </span>
          </div>
        </div>

        {/* Split Sandbox Layout */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* LEFT: Levers & Controls (col-span-5) */}
          <div className="col-span-12 lg:col-span-5 space-y-5">
            <form onSubmit={handleSimulate} className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#2563EB]" />
                  Simulation Levers
                </h3>
                <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  INPUTS
                </span>
              </div>

              {/* Industry Context */}
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#172033]">Target Industry Context</label>
                <input
                  type="text"
                  disabled
                  value={appType}
                  className="w-full bg-[#F8FAFC] text-[#64748B] rounded-lg border border-[#E2E8F0] px-3 py-2 cursor-not-allowed"
                />
              </div>

              {/* Target Risk Level */}
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#172033]">Target Risk Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetRiskLevel('HIGH')}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      targetRiskLevel === 'HIGH'
                        ? 'border-red-300 bg-red-50 text-[#DC2626]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    High Risk
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRiskLevel('MEDIUM')}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      targetRiskLevel === 'MEDIUM'
                        ? 'border-amber-300 bg-amber-50 text-[#D97706]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    Medium Risk
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRiskLevel('ALL')}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      targetRiskLevel === 'ALL'
                        ? 'border-blue-300 bg-[#EFF6FF] text-[#2563EB]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    All Cohorts
                  </button>
                </div>
              </div>

              {/* Retention Action Lever */}
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#172033]">Intervention Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full bg-[#F8FAFC] text-[#172033] rounded-lg border border-[#E2E8F0] px-3 py-2 focus:bg-white focus:border-[#2563EB] focus:outline-none cursor-pointer"
                >
                  {getActionsForAppType(appType).map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </select>
              </div>

              {/* Concession Slider */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-[#172033]">
                  <span>Offer Concession Rate</span>
                  <span className="text-[#2563EB]">{concessionPct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={concessionPct}
                  onChange={(e) => setConcessionPct(Number(e.target.value))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>

              {/* Action Strength */}
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#172033]">Intervention Intensity</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStrength(st)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        strength === st
                          ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                          : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:text-[#172033]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{loading ? 'Simulating Impact...' : 'Run Simulation'}</span>
              </button>
            </form>
          </div>

          {/* RIGHT: Simulation Results & Before / After (col-span-7) */}
          <div className="col-span-12 lg:col-span-7 space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Simulation Header Banner */}
            <div className="bg-white p-4 rounded-xl border border-[#BFDBFE] shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#172033] block">
                    SIMULATION RESULTS (ESTIMATED)
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Calibrated against machine learning risk loss surfaces.
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                PROJECTION
              </span>
            </div>

            {result ? (() => {
              const avgRiskBefore = safeNumber(result.avg_risk_before ?? result.current_avg_risk_score, 0);
              const avgRiskAfter = safeNumber(result.avg_risk_after ?? result.simulated_avg_risk_score, 0);
              const targetCount = safeNumber(result.target_customer_count ?? result.total_customers, 0);
              const savedCount = safeNumber(result.expected_saved_count ?? result.estimated_saved_count, 0);
              const reductionPct = safeNumber(result.expected_risk_reduction_pct ?? result.risk_score_reduction_pct, 0);
              const costInr = safeNumber(result.estimated_cost_inr, savedCount * 50);

              return (
                <div className="space-y-5">
                  {/* Before vs After Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Before Card */}
                    <div className="bg-white p-5 rounded-xl border border-red-200 shadow-card space-y-3">
                      <div className="flex items-center justify-between border-b border-red-100 pb-2">
                        <span className="text-xs font-bold text-[#DC2626]">STATUS QUO (Before)</span>
                        <span className="text-[10px] font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded">
                          No Action
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#64748B] block">AGGREGATE RISK</span>
                        <div className="text-3xl font-bold text-[#DC2626] font-sans mt-0.5">
                          {avgRiskBefore.toFixed(1)} <span className="text-xs text-[#64748B] font-normal">/ 100</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 text-xs text-[#64748B] space-y-1">
                        <div className="flex justify-between">
                          <span>Target Cohort:</span>
                          <strong className="text-[#172033]">{targetCount} accounts</strong>
                        </div>
                      </div>
                    </div>

                    {/* After Card */}
                    <div className="bg-white p-5 rounded-xl border border-green-200 shadow-card space-y-3">
                      <div className="flex items-center justify-between border-b border-green-100 pb-2">
                        <span className="text-xs font-bold text-[#16A34A]">SIMULATED OUTCOME (After)</span>
                        <span className="text-[10px] font-bold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded">
                          Intervention
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#64748B] block">PROJECTED RISK</span>
                        <div className="text-3xl font-bold text-[#16A34A] font-sans mt-0.5">
                          {avgRiskAfter.toFixed(1)} <span className="text-xs text-[#64748B] font-normal">/ 100</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 text-xs text-[#64748B] space-y-1">
                        <div className="flex justify-between">
                          <span>Risk Shift:</span>
                          <strong className="text-[#16A34A]">-{reductionPct}% Reduction</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Projected Business Impact */}
                  <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
                    <h4 className="font-bold text-sm text-[#172033] border-b border-[#E2E8F0] pb-2">
                      Estimated Business Impact Metrics
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[#64748B] block mb-1">Expected Saved Users</span>
                        <div className="text-2xl font-bold text-[#2563EB] font-sans">
                          {savedCount}
                        </div>
                        <span className="text-[10px] text-[#64748B]">Accounts retained</span>
                      </div>

                      <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[#64748B] block mb-1">Risk Score Reduction</span>
                        <div className="text-2xl font-bold text-[#16A34A] font-sans">
                          {reductionPct}%
                        </div>
                        <span className="text-[10px] text-[#64748B]">Across target cohort</span>
                      </div>

                      <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[#64748B] block mb-1">Estimated Budget Cost</span>
                        <div className="text-2xl font-bold text-[#172033] font-sans">
                          ₹{costInr.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-[#64748B]">Intervention cost</span>
                      </div>
                    </div>

                    {/* Disclaimer Note (Phase 6 Requirement) */}
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                      <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      <span>
                        <strong>Simulation Results Disclaimer:</strong> Estimated improvements and account savings are projections generated from machine learning heuristics and are not guaranteed. Actual outcomes depend on customer response and campaign timing.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="bg-white p-12 rounded-xl border border-[#E2E8F0] shadow-card text-center space-y-3">
                <Sliders className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-sm text-[#172033]">No Simulation Executed Yet</h4>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Adjust the intervention levers on the left and click &quot;Run Simulation&quot; to project retention impact.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
