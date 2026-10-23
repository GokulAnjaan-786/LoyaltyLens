import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { CardSkeleton } from '@/components/common/Skeleton';
import { formatDate, safeNumber } from '@/lib/safeData';
import {
  ArrowLeft,
  Megaphone,
  Play,
  CheckCircle2,
  XCircle,
  Users,
  TrendingDown,
  ShieldAlert,
  Calendar,
  Tag,
} from 'lucide-react';

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id]);

  const fetchCampaign = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/campaigns/${id}`);
      setCampaign(res.data);
    } catch (err: any) {
      console.error('Failed to fetch campaign:', err);
      setError(err.response?.data?.detail || 'Failed to fetch campaign details.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await api.patch(`/campaigns/${id}`, { status: newStatus });
      fetchCampaign();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update campaign status');
    }
  };

  return (
    <AppLayout title="Campaigns" subtitle="Campaign Execution Details">
      <div className="space-y-6">
        {/* Top Back Link */}
        <div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Campaigns Roster</span>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <CardSkeleton />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        ) : campaign ? (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                      {campaign.name}
                    </h1>
                    <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold uppercase tracking-wider">
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    {campaign.description || 'No description provided.'}
                  </p>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2">
                  {campaign.status !== 'ACTIVE' && (
                    <button
                      onClick={() => updateStatus('ACTIVE')}
                      className="px-4 py-2 bg-[#2563EB] text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Launch Campaign</span>
                    </button>
                  )}
                  {campaign.status === 'ACTIVE' && (
                    <button
                      onClick={() => updateStatus('COMPLETED')}
                      className="px-4 py-2 bg-[#16A34A] text-white font-semibold text-xs rounded-lg hover:bg-green-700 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  )}
                  {campaign.status !== 'CANCELLED' && (
                    <button
                      onClick={() => updateStatus('CANCELLED')}
                      className="px-4 py-2 bg-white text-[#DC2626] hover:bg-red-50 font-semibold text-xs rounded-lg border border-red-200 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Campaign Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Target Segment
                </span>
                <div className="text-lg font-bold text-[#172033] truncate">{campaign.target_segment}</div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Level: {campaign.target_risk_level}</span>
              </div>

              <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Target Audience
                </span>
                <div className="text-2xl font-bold text-[#0D9488] font-sans">
                  {safeNumber(campaign.target_customer_count, 0)}
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Affected accounts</span>
              </div>

              <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Expected Saved
                </span>
                <div className="text-2xl font-bold text-[#2563EB] font-sans">
                  {safeNumber(campaign.expected_saved_count, 0)}
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Projected retained accounts</span>
              </div>

              <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Risk Reduction
                </span>
                <div className="text-2xl font-bold text-[#16A34A] font-sans">
                  {campaign.expected_risk_reduction_pct || 0}%
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Estimated ML impact</span>
              </div>
            </div>

            {/* Campaign Specifications Card */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
              <h3 className="font-bold text-base text-[#172033] border-b border-[#E2E8F0] pb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#2563EB]" />
                Campaign Specifications & Parameters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#64748B]">
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="font-semibold text-[#64748B] block mb-1">Retention Offer</span>
                    <span className="text-base font-bold text-[#0D9488]">{campaign.offer}</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="font-semibold text-[#64748B] block mb-1">Action Strength</span>
                    <span className="font-bold text-[#172033]">{campaign.action_strength} Impact</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="font-semibold text-[#64748B] block mb-1">Start Date</span>
                    <span className="font-medium text-[#172033]">
                      {campaign.start_date ? formatDate(campaign.start_date) : 'Immediate Deploy'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="font-semibold text-[#64748B] block mb-1">End Date</span>
                    <span className="font-medium text-[#172033]">
                      {campaign.end_date ? formatDate(campaign.end_date) : 'Continuous (Until Revoked)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
