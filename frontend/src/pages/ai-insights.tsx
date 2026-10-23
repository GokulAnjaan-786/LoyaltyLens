import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Target,
  Lightbulb,
  Megaphone,
  ArrowRight,
  TrendingDown,
  Building2,
  Calendar,
  Clock,
} from 'lucide-react';
import { AIWeeklyBrief, RecommendedActionItem, SuggestedCampaignItem } from '@/types/ai';
import { normalizeAiBrief, safeArray, safeString } from '@/lib/safeData';
import { CardSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';

export default function AIWeeklyBriefPage() {
  const { appType } = useAuth();
  const [brief, setBrief] = useState<AIWeeklyBrief | null>(null);
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
      const normalized = normalizeAiBrief(res.data);
      setBrief(normalized);
    } catch (err: any) {
      console.error('Error fetching AI weekly brief:', err);
      setError(err.response?.data?.detail || 'Failed to synthesize AI Weekly Briefing. You can retry below.');
    } finally {
      setLoading(false);
    }
  };

  const prioritySegments = safeArray<string>(brief?.priority_segments?.length ? brief.priority_segments : brief?.priority_customer_segments);
  const topProblems = safeArray<string>(brief?.top_problems);
  const recommendedActions = safeArray<RecommendedActionItem>(brief?.recommended_actions);
  const suggestedCampaigns = safeArray<SuggestedCampaignItem>(brief?.suggested_campaigns);
  const snapshot = brief?.weekly_snapshot;

  return (
    <AppLayout title="AI Insights" subtitle="Autonomous Strategic Brief">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <Sparkles className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                AI Action Brief & Executive Intelligence
              </h1>
            </div>
            <p className="text-[#64748B] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Autonomous AI synthesis of customer risk trajectories, root-cause friction points, vulnerable segment prioritization, and strategic playbooks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                brief?.is_ai_generated
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{brief?.ai_provider || 'LoyaltyLens Engine'}</span>
            </span>

            <button
              onClick={fetchBrief}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] text-xs font-semibold flex items-center gap-2 shadow-subtle transition-all active:scale-95 disabled:opacity-50"
              title="Refresh AI Synthesis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2563EB]' : 'text-[#64748B]'}`} />
              <span>{loading ? 'Synthesizing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Error Notification with Retry */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
              <span className="text-xs font-medium">{error}</span>
            </div>
            <button
              onClick={fetchBrief}
              className="px-3 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-semibold hover:bg-red-700 transition-colors shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
            </div>
          </div>
        ) : brief ? (
          <div className="space-y-6">
            {/* Telemetry Snapshot Strip */}
            {snapshot && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    Analyzed Base
                  </span>
                  <div className="text-2xl font-bold text-[#172033] font-sans">
                    {snapshot.total_customers || 0}
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">Active Cohorts</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-red-200 shadow-card">
                  <span className="text-[11px] font-semibold text-[#DC2626] uppercase tracking-wider block mb-1">
                    High Risk Cohort
                  </span>
                  <div className="text-2xl font-bold text-[#DC2626] font-sans">
                    {snapshot.high_risk_count || 0}
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">Immediate Focus</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-card">
                  <span className="text-[11px] font-semibold text-[#D97706] uppercase tracking-wider block mb-1">
                    Medium Risk
                  </span>
                  <div className="text-2xl font-bold text-[#D97706] font-sans">
                    {snapshot.medium_risk_count || 0}
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">Early Warning</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-teal-200 shadow-card">
                  <span className="text-[11px] font-semibold text-[#0D9488] uppercase tracking-wider block mb-1">
                    Critical Geography
                  </span>
                  <div className="text-xl font-bold text-[#0D9488] truncate font-sans">
                    {snapshot.critical_zone || 'Coimbatore'}
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">Highest Risk Concentration</span>
                </div>
              </div>
            )}

            {/* Executive Summary Card */}
            <div className="p-6 rounded-xl bg-white border border-[#BFDBFE] shadow-card relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between border-b border-[#EFF6FF] pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span>Executive Intelligence Summary</span>
                </div>
                {brief.generated_at && (
                  <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{brief.generated_at}</span>
                  </span>
                )}
              </div>
              <p className="text-[#172033] text-sm sm:text-base font-normal leading-relaxed">
                {brief.executive_summary || 'Executive summary unavailable for current dataset.'}
              </p>
            </div>

            {/* Top Problems & Priority Segments Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Root Cause Drivers */}
              <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
                    Top Root Cause Churn Drivers
                  </h3>
                  <span className="text-[11px] font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    ACUTE FRICTION
                  </span>
                </div>

                {topProblems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748B]">
                    No critical root cause churn drivers detected.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {topProblems.map((prob: string, idx: number) => (
                      <li
                        key={idx}
                        className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#172033] flex items-start gap-3 hover:border-slate-300 transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#FEE2E2] text-[#DC2626] font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed font-medium">{prob}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Priority Vulnerable Segments */}
              <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#D97706]" />
                    Priority Vulnerable Segments
                  </h3>
                  <span className="text-[11px] font-bold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    TARGET AUDIENCE
                  </span>
                </div>

                {prioritySegments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748B]">
                    No prioritized vulnerable segments flagged this cycle.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {prioritySegments.map((seg: string, idx: number) => (
                      <li
                        key={idx}
                        className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#172033] flex items-start gap-3 hover:border-slate-300 transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#D97706] font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed font-medium">{seg}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Recommended Actions & Campaigns Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strategic Actions */}
              <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-[#16A34A]" />
                    Strategic Retention Actions
                  </h3>
                  <span className="text-[11px] font-bold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    TACTICAL
                  </span>
                </div>

                {recommendedActions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748B]">
                    No recommended strategic actions at this time.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendedActions.map((act: RecommendedActionItem, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-300 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                            <span>Action {idx + 1}</span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              act.priority === 'High'
                                ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]'
                                : 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                            }`}
                          >
                            {act.priority || 'Medium'} Priority
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#172033] pl-5 leading-relaxed">
                          {act.action}
                        </p>
                        <div className="flex items-center justify-between pt-2 pl-5 text-[11px] text-[#64748B] border-t border-slate-200/60">
                          <span>Owner: <strong className="text-[#172033]">{act.owner || 'Retention Ops'}</strong></span>
                          <span>Timeline: <strong className="text-[#172033]">{act.timeline || 'This Week'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested Campaigns */}
              <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-[#0D9488]" />
                    Suggested Retention Campaigns
                  </h3>
                  <span className="text-[11px] font-bold text-[#0D9488] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    GROWTH PLAYBOOK
                  </span>
                </div>

                {suggestedCampaigns.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748B]">
                    No suggested retention campaigns configured.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestedCampaigns.map((camp: SuggestedCampaignItem, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-300 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#0D9488] shrink-0" />
                            <span>{camp.campaign_name}</span>
                          </h4>
                          <span className="text-[10px] font-semibold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                            {camp.target_audience}
                          </span>
                        </div>

                        <div className="p-2.5 rounded bg-white border border-[#E2E8F0] text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Offer:</span>
                            <span className="font-bold text-[#0D9488]">{camp.recommended_offer}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Expected Impact:</span>
                            <span className="font-medium text-[#172033]">{camp.expected_impact}</span>
                          </div>
                        </div>

                        <div className="pt-1 flex justify-end">
                          <Link
                            href={`/campaigns?name=${encodeURIComponent(camp.campaign_name || '')}&offer=${encodeURIComponent(camp.recommended_offer || '')}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
                          >
                            <span>Deploy in Campaigns</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No AI Synthesis Available"
            description="Unable to load AI weekly brief. Please verify your connection or click retry."
            actionText="Generate Brief"
            onAction={fetchBrief}
          />
        )}
      </div>
    </AppLayout>
  );
}
