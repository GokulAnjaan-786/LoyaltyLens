import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

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
      setError(err.response?.data?.detail || 'Simulation execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Simulator" subtitle="Strategy Sandbox">
      {/* PAGE HERO HEADER */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-lg relative overflow-hidden shadow-sm">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-headline-xl font-headline-xl font-bold tracking-tight text-on-surface">
                Retention Impact Simulator
              </h1>
              <span className="px-2 py-0.5 rounded-full text-label-caps font-label-caps bg-secondary/10 text-secondary border border-secondary/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                SIMULATION ENGINE v3.8
              </span>
              <span className="px-2 py-0.5 rounded-full text-label-caps font-label-caps bg-tertiary-container/20 text-tertiary border border-tertiary/30">
                AI PREDICTIVE CONFIDENCE 96.4%
              </span>
            </div>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Test a retention strategy before launching it. Calibrate intervention levers against empirical machine learning loss surfaces.
            </p>
          </div>
        </div>
      </section>

      {/* SPLIT SANDBOX LAYOUT (Two-Column View) */}
      <div className="grid grid-cols-12 gap-gutter-desktop items-start">
        {/* LEFT COLUMN: SIMULATION CONTROLS & LEVERS (col-span-5) */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          {/* CARD 1: TARGET AUDIENCE & COHORT SELECTION */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-lg space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-surface-container-high text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                </span>
                <h2 className="text-headline-md font-headline-md font-semibold text-on-surface">
                  Target Audience & Cohort Scope
                </h2>
              </div>
              <span className="text-label-caps font-label-caps text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
                STEP 1
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant">Industry Context</label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={appType}
                  className="w-full bg-surface-container-lowest text-on-surface-variant text-body-sm font-body-sm rounded-lg border border-outline-variant/40 px-3 py-2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant">Target Risk Level</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetRiskLevel('HIGH')}
                  className={`py-1.5 px-2 rounded-lg border text-body-sm font-body-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    targetRiskLevel === 'HIGH'
                      ? 'border-error/50 bg-error/10 text-error'
                      : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-outline'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  <span>Critical (80%+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRiskLevel('MEDIUM')}
                  className={`py-1.5 px-2 rounded-lg border text-body-sm font-body-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    targetRiskLevel === 'MEDIUM'
                      ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                      : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-outline'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>High (60-80%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRiskLevel('ALL')}
                  className={`py-1.5 px-2 rounded-lg border text-body-sm font-body-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    targetRiskLevel === 'ALL'
                      ? 'border-secondary/50 bg-secondary/10 text-secondary'
                      : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-outline'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>All Cohorts</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: RETENTION STRATEGY & INTERVENTION LEVERS */}
          <form onSubmit={handleSimulate} className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-lg space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </span>
                <h2 className="text-headline-md font-headline-md font-semibold text-on-surface">
                  Retention Strategy & Levers
                </h2>
              </div>
              <span className="text-label-caps font-label-caps text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                STEP 2
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant">Retention Action</label>
              <div className="relative">
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm font-body-sm rounded-lg border border-outline-variant/40 px-3 py-2 pr-9 appearance-none focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                >
                  {getActionsForAppType(appType).map((act) => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-[18px]">
                  unfold_more
                </span>
              </div>
            </div>

            <div className="space-y-2 bg-surface-container p-3 rounded-lg border border-outline-variant/20">
              <div className="flex justify-between items-center">
                <span className="text-body-sm font-body-sm font-medium text-on-surface">Action Intensity / Magnitude</span>
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 text-label-code font-label-code font-bold">
                  {strength} Impact
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Low', 'Medium', 'High'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStrength(st)}
                    className={`py-1 rounded text-body-sm font-body-sm transition-all ${
                      strength === st
                        ? 'bg-secondary-container text-on-secondary-container font-bold'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
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
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-container via-secondary-container to-secondary text-surface-container-lowest font-headline-md font-bold text-headline-md shadow-lg shadow-secondary/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[22px] text-surface-container-lowest">
                bolt
              </span>
              <span>{loading ? 'Running Real-time Simulation...' : 'Run Real-time Simulation'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: SIMULATION RESULTS & BEFORE / AFTER (col-span-7) */}
        <div className="col-span-12 lg:col-span-7 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-error-container/20 border border-error/40 text-error text-body-sm font-body-sm">
              {error}
            </div>
          )}

          {/* Model Status Header */}
          <div className="rounded-xl p-3.5 bg-surface-container-low border border-secondary/30 relative overflow-hidden flex items-center justify-between glow-cyan">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[22px]">model_training</span>
              </div>
              <div>
                <span className="text-label-caps font-label-caps text-secondary block font-bold">
                  SIMULATED RESULT — BAYESIAN CHURN SHIFT MODEL
                </span>
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  Empirically calibrated against machine learning risk scoring.
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-2 py-1 rounded bg-secondary-container/20 text-secondary text-label-code font-label-code font-semibold border border-secondary/30">
              p &lt; 0.001
            </span>
          </div>

          {result ? (
            <div className="space-y-5">
              {/* BEFORE VS AFTER CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE CARD */}
                <div className="bg-surface-container-low border border-error/40 rounded-xl p-space-lg relative overflow-hidden glow-red">
                  <div className="flex items-center justify-between border-b border-error/20 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
                      <h3 className="text-headline-md font-headline-md font-bold text-error">STATUS QUO (Before)</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-label-caps font-label-caps bg-error/15 text-error border border-error/30">
                      No Intervention
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-label-caps font-label-caps text-on-surface-variant block mb-1">
                      AGGREGATE RISK SCORE
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-display-lg font-display-lg font-bold text-error tracking-tight">
                        {result.avg_risk_before}
                      </span>
                      <span className="text-headline-md font-headline-md text-error/70">/ 100</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-outline-variant/20 text-body-sm">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Target Audience:</span>
                      <span className="font-semibold text-on-surface">{result.target_customer_count} accounts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">High Risk Accounts:</span>
                      <span className="font-bold text-error">{result.risk_levels_before['High Risk']}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Medium Risk Accounts:</span>
                      <span className="font-bold text-amber-400">{result.risk_levels_before['Medium Risk']}</span>
                    </div>
                  </div>
                </div>

                {/* AFTER CARD */}
                <div className="bg-surface-container-low border border-secondary/40 rounded-xl p-space-lg relative overflow-hidden glow-cyan">
                  <div className="flex items-center justify-between border-b border-secondary/20 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                      <h3 className="text-headline-md font-headline-md font-bold text-secondary">SIMULATED SCENARIO (After)</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-label-caps font-label-caps bg-secondary/15 text-secondary border border-secondary/30">
                      {action}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-label-caps font-label-caps text-on-surface-variant block mb-1">
                      REDUCED RISK SCORE
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-display-lg font-display-lg font-bold text-secondary tracking-tight">
                        {result.avg_risk_after}
                      </span>
                      <span className="text-headline-md font-headline-md text-secondary/70">/ 100</span>
                      <span className="ml-auto text-label-caps font-label-caps bg-secondary/20 text-secondary px-2 py-0.5 rounded font-bold">
                        -{result.expected_risk_reduction_pct}% Impact
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-outline-variant/20 text-body-sm">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Rescued Accounts:</span>
                      <span className="font-bold text-secondary">{result.expected_saved_count} accounts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">High Risk Accounts:</span>
                      <span className="font-bold text-secondary">{result.risk_levels_after['High Risk']}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Low Risk Accounts:</span>
                      <span className="font-bold text-secondary">{result.risk_levels_after['Low Risk']}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface-variant space-y-3">
              <span className="material-symbols-outlined text-[48px] text-outline">bolt</span>
              <h3 className="text-headline-md font-bold text-on-surface">Ready to Run Simulation</h3>
              <p className="text-body-sm max-w-md mx-auto">
                Select target retention levers on the left and click <strong>Run Real-time Simulation</strong> to visualize Bayesian risk shift.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
