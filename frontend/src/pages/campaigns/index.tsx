import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Campaign Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_segment: 'All High Risk Users',
    target_risk_level: 'HIGH',
    offer: '20% OFF Next Order',
    action_strength: 'Medium'
  });
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch campaigns.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/campaigns', formData);
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        target_segment: 'All High Risk Users',
        target_risk_level: 'HIGH',
        offer: '20% OFF Next Order',
        action_strength: 'Medium'
      });
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/30 text-label-caps font-label-caps font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span> ACTIVE
          </span>
        );
      case 'SIMULATED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-tertiary-container/20 text-tertiary border border-tertiary/30 text-label-caps font-label-caps font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">tune</span> SIMULATED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-label-caps font-label-caps font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span> COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-error/15 text-error border border-error/30 text-label-caps font-label-caps font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">cancel</span> CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-caps font-label-caps font-bold">
            DRAFT
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[28px]">campaign</span>
              <h1 className="text-headline-xl font-headline-xl font-bold tracking-tight text-on-surface">Retention Campaign Roster</h1>
            </div>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">
              Create, simulate, deploy, and monitor automated customer win-back & loyalty campaigns.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-primary-container text-on-primary-container font-semibold text-body-sm rounded-lg hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Create New Campaign</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-body-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-on-surface-variant text-body-sm">Loading campaign roster...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
            <span className="material-symbols-outlined text-outline-variant text-[48px]">campaign</span>
            <h3 className="text-headline-md font-bold text-on-surface">No campaigns found</h3>
            <p className="text-on-surface-variant text-body-sm max-w-sm mx-auto">
              Create your first retention campaign to start engaging high-risk customers.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 px-4 py-2 bg-primary-container text-on-primary-container text-body-sm font-semibold rounded-lg"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:border-secondary/40 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(c.status)}
                    <span className="text-label-caps font-label-caps text-on-surface-variant">{c.target_segment}</span>
                  </div>

                  <div>
                    <h3 className="text-headline-md font-bold text-on-surface leading-snug">{c.name}</h3>
                    <p className="text-on-surface-variant text-body-sm mt-2 line-clamp-2">{c.description || 'No description provided.'}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 text-body-sm space-y-1.5">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Target Risk Level:</span>
                      <span className="font-bold text-error">{c.target_risk_level}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Offer details:</span>
                      <span className="font-bold text-secondary">{c.offer}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Est. Risk Reduction:</span>
                      <span className="font-bold text-primary">{c.expected_risk_reduction_pct}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="text-label-code font-label-code text-on-surface-variant">
                    Created: {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/campaigns/${c.id}`}
                    className="text-body-sm font-bold text-secondary hover:underline flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-outline-variant/40 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <h3 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">campaign</span>
                  Create Retention Campaign
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-on-surface-variant hover:text-on-surface text-headline-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-body-sm">
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Chennai High-Risk Winback"
                    className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/40 p-2.5 text-on-surface focus:border-secondary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the retention offer and objective..."
                    className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/40 p-2.5 text-on-surface focus:border-secondary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1">Target Segment</label>
                    <input
                      type="text"
                      value={formData.target_segment}
                      onChange={(e) => setFormData({ ...formData, target_segment: e.target.value })}
                      className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/40 p-2.5 text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1">Target Risk Level</label>
                    <select
                      value={formData.target_risk_level}
                      onChange={(e) => setFormData({ ...formData, target_risk_level: e.target.value })}
                      className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/40 p-2.5 text-on-surface focus:border-secondary focus:outline-none"
                    >
                      <option value="HIGH">HIGH RISK</option>
                      <option value="MEDIUM">MEDIUM RISK</option>
                      <option value="ALL">ALL RISK LEVELS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1">Retention Offer</label>
                    <input
                      type="text"
                      value={formData.offer}
                      onChange={(e) => setFormData({ ...formData, offer: e.target.value })}
                      className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/40 p-2.5 text-on-surface focus:border-secondary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1">Action Strength</label>
                    <select
                      value={formData.action_strength}
                      onChange={(e) => setFormData({ ...formData, action_strength: e.target.value })}
                      className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/40 p-2.5 text-on-surface focus:border-secondary focus:outline-none"
                    >
                      <option value="Low">Low Impact</option>
                      <option value="Medium">Medium Impact</option>
                      <option value="High">High Impact</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary font-semibold shadow-sm"
                  >
                    {creating ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

