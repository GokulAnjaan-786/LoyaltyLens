import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

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
    <AppLayout>
      <div className="space-y-6">
        {/* Top Back Link */}
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-body-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Campaigns Roster</span>
        </Link>

        {error && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-body-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-on-surface-variant text-body-sm">Loading campaign details...</p>
          </div>
        ) : campaign ? (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-headline-xl font-headline-xl font-bold text-on-surface tracking-tight">{campaign.name}</h1>
                    <span className="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/30 text-label-caps font-label-caps font-bold">
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-body-md mt-1">{campaign.description || 'No description provided.'}</p>
                </div>

                <div className="flex items-center gap-2">
                  {campaign.status !== 'ACTIVE' && (
                    <button
                      onClick={() => updateStatus('ACTIVE')}
                      className="px-4 py-2 bg-primary-container text-on-primary-container font-semibold text-body-sm rounded-lg hover:bg-primary transition-all flex items-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                      <span>Launch Campaign</span>
                    </button>
                  )}
                  {campaign.status === 'ACTIVE' && (
                    <button
                      onClick={() => updateStatus('COMPLETED')}
                      className="px-4 py-2 bg-secondary-container text-on-secondary-container font-semibold text-body-sm rounded-lg hover:bg-secondary transition-all flex items-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Mark Completed</span>
                    </button>
                  )}
                  {campaign.status !== 'CANCELLED' && (
                    <button
                      onClick={() => updateStatus('CANCELLED')}
                      className="px-4 py-2 bg-surface-container text-on-surface-variant hover:text-error hover:bg-error/15 font-semibold text-body-sm rounded-lg border border-outline-variant/30 transition-colors"
                    >
                      Cancel Campaign
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Campaign Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
                <div className="text-on-surface-variant text-label-caps font-label-caps uppercase mb-1">Target Segment</div>
                <div className="text-headline-md font-bold text-on-surface truncate">{campaign.target_segment}</div>
                <div className="text-on-surface-variant text-label-code font-label-code mt-1">Level: {campaign.target_risk_level}</div>
              </div>

              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
                <div className="text-on-surface-variant text-label-caps font-label-caps uppercase mb-1">Target Audience</div>
                <div className="text-display-lg font-data-metric font-bold text-secondary">{campaign.target_customer_count || 0}</div>
                <div className="text-on-surface-variant text-label-code font-label-code mt-1">Affected accounts</div>
              </div>

              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
                <div className="text-on-surface-variant text-label-caps font-label-caps uppercase mb-1">Expected Saved</div>
                <div className="text-display-lg font-data-metric font-bold text-primary">{campaign.expected_saved_count || 0}</div>
                <div className="text-on-surface-variant text-label-code font-label-code mt-1">Projected retained accounts</div>
              </div>

              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
                <div className="text-on-surface-variant text-label-caps font-label-caps uppercase mb-1">Risk Reduction</div>
                <div className="text-display-lg font-data-metric font-bold text-amber-300">{campaign.expected_risk_reduction_pct || 0}%</div>
                <div className="text-on-surface-variant text-label-code font-label-code mt-1">Estimated impact</div>
              </div>
            </div>

            {/* Campaign Details Card */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm space-y-4">
              <h3 className="font-bold text-headline-md text-on-surface border-b border-outline-variant/20 pb-3">Campaign Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-body-sm text-on-surface-variant">
                <div className="space-y-3">
                  <div>
                    <span className="text-on-surface-variant font-semibold block mb-0.5">Offer Details</span>
                    <span className="font-bold text-secondary text-headline-md">{campaign.offer}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-semibold block mb-0.5">Action Strength</span>
                    <span className="font-medium text-on-surface">{campaign.action_strength}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-on-surface-variant font-semibold block mb-0.5">Start Date</span>
                    <span className="text-on-surface font-label-code">{campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'Immediate'}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-semibold block mb-0.5">End Date</span>
                    <span className="text-on-surface font-label-code">{campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Ongoing'}</span>
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

