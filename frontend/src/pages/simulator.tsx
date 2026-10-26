import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
  DollarSign,
  TrendingUp,
  ArrowRight,
  Layers
} from 'lucide-react';
import { safeNumber } from '@/lib/safeData';

export default function RetentionSimulatorPage() {
  const router = useRouter();
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

  // Scenario Mode: 'SINGLE' or 'COMPARE'
  const [mode, setMode] = useState<'SINGLE' | 'COMPARE'>('SINGLE');

  // Scenario A Levers
  const [actionA, setActionA] = useState<string>(getActionsForAppType(appType)[0]);
  const [strengthA, setStrengthA] = useState<string>('Medium');
  const [targetRiskA, setTargetRiskA] = useState<string>('HIGH');
  const [concessionA, setConcessionA] = useState<number>(20);
  const [budgetCapA, setBudgetCapA] = useState<number>(5000);

  // Scenario B Levers (for comparison)
  const [actionB, setActionB] = useState<string>(getActionsForAppType(appType)[1] || 'Free Delivery');
  const [strengthB, setStrengthB] = useState<string>('High');
  const [targetRiskB, setTargetRiskB] = useState<string>('HIGH');
  const [concessionB, setConcessionB] = useState<number>(30);
  const [budgetCapB, setBudgetCapB] = useState<number>(7500);

  // Economic Assumptions
  const [assumedResponseRate, setAssumedResponseRate] = useState<number>(15.0);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(550.0);
  const [grossMarginPct, setGrossMarginPct] = useState<number>(40.0);

  // Results State
  const [loading, setLoading] = useState<boolean>(false);
  const [resultA, setResultA] = useState<any>(null);
  const [economicsA, setEconomicsA] = useState<any>(null);
  const [resultB, setResultB] = useState<any>(null);
  const [economicsB, setEconomicsB] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActionA(getActionsForAppType(appType)[0]);
    setActionB(getActionsForAppType(appType)[1] || 'Free Delivery');
  }, [appType]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Run ML Risk Reduction Simulation for Scenario A
      const mlResA = await api.post('/campaigns/simulate', {
        app_type: appType.replace(/[^a-zA-Z ]/g, '').trim(),
        action: actionA,
        strength: strengthA,
        target_risk_level: targetRiskA,
      });
      setResultA(mlResA.data);

      const targetCountA = mlResA.data.total_customers || 50;
      const perUserCostA = (concessionA / 100) * avgOrderValue * 0.4;

      // 2. Run Economics Simulation for Scenario A
      const econResA = await api.post('/campaigns/simulate-economics', {
        target_customer_count: targetCountA,
        per_customer_cost_inr: Math.round(perUserCostA),
        assumed_response_rate_pct: assumedResponseRate,
        avg_order_value_inr: avgOrderValue,
        gross_margin_pct: grossMarginPct,
        repeat_purchase_factor: 1.4,
        total_budget_cap_inr: budgetCapA,
      });
      setEconomicsA(econResA.data);

      // If in COMPARE mode, simulate Scenario B
      if (mode === 'COMPARE') {
        const mlResB = await api.post('/campaigns/simulate', {
          app_type: appType.replace(/[^a-zA-Z ]/g, '').trim(),
          action: actionB,
          strength: strengthB,
          target_risk_level: targetRiskB,
        });
        setResultB(mlResB.data);

        const targetCountB = mlResB.data.total_customers || 50;
        const perUserCostB = (concessionB / 100) * avgOrderValue * 0.4;

        const econResB = await api.post('/campaigns/simulate-economics', {
          target_customer_count: targetCountB,
          per_customer_cost_inr: Math.round(perUserCostB),
          assumed_response_rate_pct: Math.min(50, assumedResponseRate * (strengthB === 'High' ? 1.3 : 1.1)),
          avg_order_value_inr: avgOrderValue,
          gross_margin_pct: grossMarginPct,
          repeat_purchase_factor: 1.5,
          total_budget_cap_inr: budgetCapB,
        });
        setEconomicsB(econResB.data);
      }
    } catch (err: any) {
      console.error('Simulation execution failed:', err);
      setError(err.response?.data?.detail || 'Simulation execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeployScenario = (scenarioAction: string, scenarioStrength: string, scenarioConcession: number) => {
    router.push({
      pathname: '/campaigns',
      query: {
        name: `${scenarioAction} Win-Back Campaign`,
        offer: `${scenarioConcession}% OFF Next Order`,
        action: scenarioAction,
        discount: scenarioConcession,
      },
    });
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
                  Retention Strategy Simulator & Economics Sandbox
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
                Test alternative retention interventions, project ML risk reduction, and simulate financial ROI using documented mathematical assumptions.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setMode('SINGLE')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mode === 'SINGLE'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Single Scenario
              </button>
              <button
                type="button"
                onClick={() => setMode('COMPARE')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                  mode === 'COMPARE'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Compare Offers</span>
              </button>
            </div>
          </div>
        </div>

        {/* Simulator Split Layout */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* LEFT: Levers & Controls (col-span-5) */}
          <div className="col-span-12 lg:col-span-5 space-y-5">
            <form onSubmit={handleSimulate} className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#2563EB]" />
                  Simulation Levers {mode === 'COMPARE' && '(Scenario A)'}
                </h3>
                <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  SANDBOX
                </span>
              </div>

              {/* Target Risk Severity */}
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#172033]">Target Risk Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  {['HIGH', 'MEDIUM', 'ALL'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTargetRiskA(lvl)}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all ${
                        targetRiskA === lvl
                          ? 'border-blue-300 bg-[#EFF6FF] text-[#2563EB]'
                          : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]'
                      }`}
                    >
                      {lvl === 'ALL' ? 'All Cohorts' : `${lvl} Risk`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intervention Action Lever */}
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-[#172033]">Intervention Action</label>
                <select
                  value={actionA}
                  onChange={(e) => setActionA(e.target.value)}
                  className="w-full bg-[#F8FAFC] text-[#172033] rounded-lg border border-[#E2E8F0] px-3 py-2"
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
                  <span className="text-[#2563EB]">{concessionA}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={concessionA}
                  onChange={(e) => setConcessionA(Number(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
              </div>

              {/* If in COMPARE mode, render Scenario B inputs */}
              {mode === 'COMPARE' && (
                <div className="pt-4 border-t border-[#E2E8F0] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-indigo-900">Alternative Lever (Scenario B)</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      BENCHMARK
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="font-semibold text-[#172033]">Alternative Action</label>
                    <select
                      value={actionB}
                      onChange={(e) => setActionB(e.target.value)}
                      className="w-full bg-[#F8FAFC] text-[#172033] rounded-lg border border-[#E2E8F0] px-3 py-2"
                    >
                      {getActionsForAppType(appType).map((act) => (
                        <option key={act} value={act}>
                          {act}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold text-[#172033]">
                      <span>Scenario B Concession Rate</span>
                      <span className="text-indigo-600">{concessionB}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={concessionB}
                      onChange={(e) => setConcessionB(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              )}

              {/* Documented Economic Assumptions Accordion */}
              <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                <span className="font-bold text-xs text-[#172033] block">
                  Documented Economic Assumptions
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[#64748B] block mb-1">Assumed Response Rate</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={assumedResponseRate}
                        onChange={(e) => setAssumedResponseRate(Number(e.target.value))}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded p-1.5 text-[#172033]"
                      />
                      <span className="text-[#64748B]">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[#64748B] block mb-1">Average Order Value</label>
                    <div className="flex items-center gap-1">
                      <span className="text-[#64748B]">₹</span>
                      <input
                        type="number"
                        min="100"
                        max="2000"
                        value={avgOrderValue}
                        onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded p-1.5 text-[#172033]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{loading ? 'Simulating Impact & Economics...' : 'Run Simulation'}</span>
              </button>
            </form>
          </div>

          {/* RIGHT: Results & Projections (col-span-7) */}
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
                    HYPOTHETICAL SIMULATION RESULTS
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Projected retention based on ML loss curves and explicit economic assumptions.
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                PROJECTION
              </span>
            </div>

            {economicsA ? (
              <div className="space-y-5">
                {/* Scenario A Card */}
                <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="font-bold text-sm text-[#172033]">
                      Scenario A: {actionA} ({concessionA}%)
                    </span>
                    <button
                      onClick={() => handleDeployScenario(actionA, strengthA, concessionA)}
                      className="inline-flex items-center gap-1 font-semibold text-xs text-[#2563EB] hover:underline"
                    >
                      <span>Deploy as Campaign</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[10px]">Projected Retained</span>
                      <strong className="text-xl text-[#2563EB]">
                        {economicsA.estimated_saved_count} accounts
                      </strong>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[10px]">Total Incentive Cost</span>
                      <strong className="text-xl text-[#DC2626]">
                        ₹{economicsA.total_potential_cost_inr.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[10px]">Break-Even Target</span>
                      <strong className="text-xl text-[#D97706]">
                        {economicsA.break_even_customers} accounts
                      </strong>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[10px]">Estimated Net ROI</span>
                      <strong className="text-xl text-[#16A34A]">
                        {economicsA.estimated_roi_pct}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Scenario B Card (If in COMPARE mode) */}
                {mode === 'COMPARE' && economicsB && (
                  <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-card space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                      <span className="font-bold text-sm text-indigo-900">
                        Scenario B: {actionB} ({concessionB}%)
                      </span>
                      <button
                        onClick={() => handleDeployScenario(actionB, strengthB, concessionB)}
                        className="inline-flex items-center gap-1 font-semibold text-xs text-indigo-600 hover:underline"
                      >
                        <span>Deploy as Campaign</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200">
                        <span className="text-[#64748B] block text-[10px]">Projected Retained</span>
                        <strong className="text-xl text-indigo-600">
                          {economicsB.estimated_saved_count} accounts
                        </strong>
                      </div>

                      <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200">
                        <span className="text-[#64748B] block text-[10px]">Total Incentive Cost</span>
                        <strong className="text-xl text-[#DC2626]">
                          ₹{economicsB.total_potential_cost_inr.toLocaleString('en-IN')}
                        </strong>
                      </div>

                      <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200">
                        <span className="text-[#64748B] block text-[10px]">Break-Even Target</span>
                        <strong className="text-xl text-[#D97706]">
                          {economicsB.break_even_customers} accounts
                        </strong>
                      </div>

                      <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200">
                        <span className="text-[#64748B] block text-[10px]">Estimated Net ROI</span>
                        <strong className="text-xl text-[#16A34A]">
                          {economicsB.estimated_roi_pct}%
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disclaimer Note */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                  <span>
                    <strong>Documented Simulation Disclaimer:</strong> Calculations use mathematical assumptions ({assumedResponseRate}% response rate, ₹{avgOrderValue} AOV, {grossMarginPct}% gross margin). These projections are hypothetical scenarios and do not guarantee retention without measured post-campaign redemption data.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-xl border border-[#E2E8F0] shadow-card text-center space-y-3">
                <Sliders className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-sm text-[#172033]">No Simulation Executed Yet</h4>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Adjust the intervention levers on the left and click &quot;Run Simulation&quot; to project financial ROI and retention lift.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
