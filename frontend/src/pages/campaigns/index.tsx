import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { CardSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { safeArray, safeNumber, formatDate } from '@/lib/safeData';
import {
  Megaphone,
  Plus,
  ArrowRight,
  RefreshCw,
  X,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function CampaignsPage() {
  const router = useRouter();
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
    action_strength: 'Medium',
  });
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Pre-fill modal if query params exist (e.g. from Playbook or AI insights)
  useEffect(() => {
    if (router.query.name || router.query.offer || router.query.action) {
      setFormData((prev) => ({
        ...prev,
        name: (router.query.name as string) || prev.name,
        offer: (router.query.offer as string) || (router.query.action as string) || prev.offer,
      }));
      setShowModal(true);
    }
  }, [router.query]);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/campaigns');
      setCampaigns(safeArray(res.data));
    } catch (err: any) {
      console.error('Failed to fetch campaigns:', err);
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
        action_strength: 'Medium',
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
          <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse"></span> ACTIVE
          </span>
        );
      case 'SIMULATED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase tracking-wider">
            SIMULATED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-[#16A34A] border border-green-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-[#DC2626] border border-red-200 text-[10px] font-bold uppercase tracking-wider">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#64748B] border border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            DRAFT
          </span>
        );
    }
  };

  return (
    <AppLayout title="Campaigns" subtitle="Retention Campaign Roster">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <Megaphone className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                Retention Campaign Roster
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
              Create, simulate, deploy, and monitor automated customer win-back and loyalty campaigns.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
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
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="No Campaigns Created Yet"
            description="Create your first customer win-back or retention incentive campaign to start engaging high-risk accounts."
            actionText="Create Campaign"
            onAction={() => setShowModal(true)}
            icon={Megaphone}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(c.status)}
                    <span className="text-[11px] font-semibold text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                      {c.target_segment}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#172033] leading-snug">{c.name}</h3>
                    <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                      {c.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Target Risk:</span>
                      <strong className="text-[#DC2626]">{c.target_risk_level}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Incentive Offer:</span>
                      <strong className="text-[#2563EB]">{c.offer}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Est. Risk Reduction:</span>
                      <strong className="text-[#16A34A]">{c.expected_risk_reduction_pct || 0}%</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">
                    Created: {formatDate(c.created_at)}
                  </span>
                  <Link
                    href={`/campaigns/${c.id}`}
                    className="inline-flex items-center gap-1 font-bold text-[#2563EB] hover:underline"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Campaign Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-5 shadow-dropdown animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-[#172033]">Create Retention Campaign</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Coimbatore Food Delivery Win-Back Drive"
                    className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Summary of objectives, target cohort, and discount terms..."
                    className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Target Segment</label>
                    <input
                      type="text"
                      value={formData.target_segment}
                      onChange={(e) => setFormData({ ...formData, target_segment: e.target.value })}
                      className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Target Risk Level</label>
                    <select
                      value={formData.target_risk_level}
                      onChange={(e) => setFormData({ ...formData, target_risk_level: e.target.value })}
                      className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                    >
                      <option value="HIGH">HIGH RISK</option>
                      <option value="MEDIUM">MEDIUM RISK</option>
                      <option value="ALL">ALL COHORTS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Retention Offer</label>
                    <input
                      type="text"
                      value={formData.offer}
                      onChange={(e) => setFormData({ ...formData, offer: e.target.value })}
                      className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Action Strength</label>
                    <select
                      value={formData.action_strength}
                      onChange={(e) => setFormData({ ...formData, action_strength: e.target.value })}
                      className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                    >
                      <option value="Low">Low Impact</option>
                      <option value="Medium">Medium Impact</option>
                      <option value="High">High Impact</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0] font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 font-semibold shadow-sm disabled:opacity-50"
                  >
                    {creating ? 'Deploying...' : 'Create Campaign'}
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
