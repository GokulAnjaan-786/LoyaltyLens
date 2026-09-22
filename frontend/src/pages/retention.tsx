import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { BookOpen, CheckCircle, ShieldAlert, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { CardSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';

export default function RetentionPlaybookPage() {
  const { appType } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
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
          ...(res.data.high_risk_actions || []).map((item: any) => ({
            ...item,
            title: item.title || item.action,
            description: item.description || item.reason,
            risk_level: item.risk_level || 'High Risk',
            target_segment: item.target_segment || 'High Risk Cohort',
            expected_impact: item.expected_impact || item.impact
          })),
          ...(res.data.medium_risk_actions || []).map((item: any) => ({
            ...item,
            title: item.title || item.action,
            description: item.description || item.reason,
            risk_level: item.risk_level || 'Medium Risk',
            target_segment: item.target_segment || 'Medium Risk Cohort',
            expected_impact: item.expected_impact || item.impact
          })),
          ...(res.data.low_risk_actions || []).map((item: any) => ({
            ...item,
            title: item.title || item.action,
            description: item.description || item.reason,
            risk_level: item.risk_level || 'Low Risk',
            target_segment: item.target_segment || 'Loyal Users',
            expected_impact: item.expected_impact || item.impact
          }))
        ];
        setRecommendations(combined);
      } else {
        setRecommendations([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch retention recommendations.');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Retention Playbook">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-emerald-400" />
              Automated Retention Playbook & Recommendations
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Data-driven retention strategies generated from customer activity, risk scores, and industry rules.
            </p>
          </div>
          <Link
            href="/simulator"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <span>Run Campaign Simulator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : recommendations.length === 0 ? (
          <EmptyState
            title="No Playbook Recommendations Found"
            description="No specific retention playbooks are configured for this industry mode."
            actionText="Go to Settings"
            onAction={() => window.location.href = '/settings'}
            icon={BookOpen}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(recommendations) && recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                      rec.risk_level === 'High Risk' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      rec.risk_level === 'Medium Risk' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {rec.risk_level}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{rec.target_segment}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">{rec.title}</h3>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">{rec.description}</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Recommended Retention Action</span>
                    </div>
                    <p className="text-slate-200 text-xs font-medium">{rec.action}</p>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Impact: {rec.expected_impact}
                  </span>
                  <Link
                    href={`/campaigns?action=${encodeURIComponent(rec.action)}`}
                    className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                  >
                    Launch Campaign &rarr;
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
