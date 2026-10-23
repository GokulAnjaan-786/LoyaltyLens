import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  BookOpen,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Tag,
  ArrowRight,
  Sliders,
  RefreshCw,
  Target,
} from 'lucide-react';
import { CardSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { RiskBadge } from '@/components/common/RiskBadge';
import { safeArray } from '@/lib/safeData';

export default function RetentionPlaybookPage() {
  const { appType } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [appType]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/retention/recommendations', { params: { app_type: appType } });
      if (Array.isArray(res.data)) {
        setRecommendations(res.data);
      } else if (res.data) {
        const combined = [
          ...safeArray(res.data.high_risk_actions).map((item: any) => ({
            ...item,
            title: item.title || item.action,
            description: item.description || item.reason,
            risk_level: item.risk_level || 'HIGH',
            target_segment: item.target_segment || 'High Risk Cohort',
            expected_impact: item.expected_impact || item.impact,
          })),
          ...safeArray(res.data.medium_risk_actions).map((item: any) => ({
            ...item,
            title: item.title || item.action,
            description: item.description || item.reason,
            risk_level: item.risk_level || 'MEDIUM',
            target_segment: item.target_segment || 'Medium Risk Cohort',
            expected_impact: item.expected_impact || item.impact,
          })),
          ...safeArray(res.data.low_risk_actions).map((item: any) => ({
            ...item,
            title: item.title || item.action,
            description: item.description || item.reason,
            risk_level: item.risk_level || 'LOW',
            target_segment: item.target_segment || 'Loyal Customers',
            expected_impact: item.expected_impact || item.impact,
          })),
        ];
        setRecommendations(combined);
      } else {
        setRecommendations([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
      setError(err.response?.data?.detail || 'Failed to fetch retention recommendations.');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = recommendations.filter((r) => {
    if (selectedFilter === 'ALL') return true;
    const level = (r.risk_level || '').toUpperCase();
    return level.includes(selectedFilter);
  });

  return (
    <AppLayout title="Retention Intelligence" subtitle="Automated Playbooks & Interventions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <BookOpen className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                Retention Intelligence & Action Playbooks
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
              Data-driven retention strategies synthesized from customer telemetry, behavioral friction indicators, and domain rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/simulator"
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4" />
              <span>Retention Simulator</span>
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#E2E8F0] shadow-subtle w-fit text-xs font-semibold">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedFilter === lvl
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                  : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
              }`}
            >
              {lvl === 'ALL' ? 'All Playbooks' : `${lvl} Priority`}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Playbook Recommendations Found"
            description="No specific retention playbooks found for the selected risk filter."
            actionText="Reset Filter"
            onAction={() => setSelectedFilter('ALL')}
            icon={BookOpen}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((rec, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <RiskBadge level={rec.risk_level} size="sm" />
                    <span className="text-[11px] font-semibold text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                      {rec.target_segment}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#172033] leading-snug">{rec.title}</h3>
                    <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">{rec.description}</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D9488]">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Recommended Intervention</span>
                    </div>
                    <p className="text-xs font-semibold text-[#172033]">{rec.action}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[#16A34A] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Impact: {rec.expected_impact}</span>
                  </span>
                  <Link
                    href={`/campaigns?action=${encodeURIComponent(rec.action)}`}
                    className="inline-flex items-center gap-1 font-bold text-[#2563EB] hover:underline"
                  >
                    <span>Deploy Campaign</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
