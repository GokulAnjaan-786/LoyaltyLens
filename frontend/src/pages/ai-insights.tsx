import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Brain, Sparkles, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert, Target, Lightbulb, Megaphone } from 'lucide-react';

export default function AIWeeklyBriefPage() {
  const { appType } = useAuth();
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrief();
  }, [appType]);

  const fetchBrief = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ai/weekly-brief', { params: { app_type: appType } });
      setBrief(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch AI Weekly Briefing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-7 h-7 text-emerald-400" />
              AI Weekly Action Brief & Executive Intelligence
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Autonomous AI synthesis of customer risk trends, root cause problems, segment prioritization, and strategic playbooks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              {brief?.is_ai_generated ? 'POWERED BY GOOGLE GEMINI AI' : 'DETERMINISTIC RULE FALLBACK'}
            </span>
            <button
              onClick={fetchBrief}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh AI Synthesis"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 text-sm">Analyzing customer telemetry and running Gemini AI synthesis...</p>
          </div>
        ) : brief ? (
          <div className="space-y-6">
            {/* Executive Summary Card */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Executive Summary</span>
              </div>
              <p className="text-slate-200 text-sm font-medium leading-relaxed">
                {brief.executive_summary}
              </p>
            </div>

            {/* Top Problems & Priority Segments Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Problems */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  Top Root Cause Churn Drivers
                </h3>
                <ul className="space-y-2.5">
                  {brief.top_problems.map((prob: string, idx: number) => (
                    <li key={idx} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{prob}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Priority Customer Segments */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-400" />
                  Priority Vulnerable Segments
                </h3>
                <ul className="space-y-2.5">
                  {brief.priority_segments.map((seg: string, idx: number) => (
                    <li key={idx} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{seg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Actions & Campaigns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recommended Actions */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-emerald-400" />
                  Strategic Recommended Actions
                </h3>
                <ul className="space-y-2.5">
                  {brief.recommended_actions.map((act: string, idx: number) => (
                    <li key={idx} className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200 flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Campaigns */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-teal-400" />
                  Suggested Retention Campaigns
                </h3>
                <ul className="space-y-2.5">
                  {brief.suggested_campaigns.map((camp: string, idx: number) => (
                    <li key={idx} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-teal-300 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{camp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
