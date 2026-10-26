import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
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
  ShieldCheck,
  Clock,
  Pause,
  AlertTriangle,
  RefreshCw,
  Send,
  Eye,
  Check,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  BarChart2,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [campaign, setCampaign] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [totalRecipients, setTotalRecipients] = useState<number>(0);
  const [recipientsPage, setRecipientsPage] = useState<number>(1);
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<string>('ALL');
  const [recipientSearch, setRecipientSearch] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Execution modal state
  const [showExecModal, setShowExecModal] = useState<boolean>(false);
  const [execDryRun, setExecDryRun] = useState<boolean>(true);

  // Approval modal state
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  // Selected recipient for message preview
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadAllData();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchRecipients(recipientsPage, recipientStatusFilter, recipientSearch);
    }
  }, [recipientsPage, recipientStatusFilter, recipientSearch]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchCampaign(),
        fetchPerformance(),
        fetchRecipients(1, 'ALL', ''),
      ]);
    } catch (err: any) {
      console.error('Failed to load campaign data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaign = async () => {
    try {
      const res = await api.get(`/campaigns/${id}`);
      setCampaign(res.data);
      setExecDryRun(res.data.is_dry_run ?? true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch campaign details.');
    }
  };

  const fetchPerformance = async () => {
    try {
      const res = await api.get(`/campaigns/${id}/performance`);
      setPerformance(res.data);
    } catch (err: any) {
      console.warn('Performance tracking not yet available', err);
    }
  };

  const fetchRecipients = async (page: number, statusFilter: string, search: string) => {
    try {
      const res = await api.get(`/campaigns/${id}/recipients`, {
        params: {
          page,
          size: 20,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: search.trim() || undefined,
        },
      });
      setRecipients(res.data?.items || []);
      setTotalRecipients(res.data?.total || 0);
    } catch (err: any) {
      console.warn('Failed to fetch recipients', err);
    }
  };

  // Submit for Approval
  const handleSubmitApproval = async () => {
    setActionLoading(true);
    try {
      await api.post(`/campaigns/${id}/request-approval`);
      await loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit campaign for approval');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve / Reject
  const handleApprove = async (decision: 'APPROVE' | 'REJECT') => {
    setActionLoading(true);
    try {
      await api.post(`/campaigns/${id}/approve`, {
        decision,
        notes: approvalNotes || undefined,
      });
      setShowApproveModal(false);
      setApprovalNotes('');
      await loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Approval failed. Administrator privileges required.');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Campaign
  const handleExecute = async () => {
    setActionLoading(true);
    try {
      await api.post(`/campaigns/${id}/execute`, { is_dry_run: execDryRun });
      setShowExecModal(false);
      await loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Campaign execution failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Pause / Resume
  const handlePause = async () => {
    setActionLoading(true);
    try {
      await api.post(`/campaigns/${id}/pause`);
      await loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to pause campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await api.post(`/campaigns/${id}/resume`);
      await loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to resume campaign');
    } finally {
      setActionLoading(false);
    }
  };

  // Simulate / Record interaction for testing
  const handleSimulateInteraction = async (eventType: 'OPEN' | 'REDEEM') => {
    try {
      const res = await api.post(`/campaigns/${id}/record-interaction`, null, {
        params: { event_type: eventType }
      });
      alert(`Recorded test ${eventType} event for ${res.data.customer_code}!`);
      await loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record test interaction.');
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 0;
      case 'SIMULATED':
        return 1;
      case 'PENDING_APPROVAL':
        return 2;
      case 'APPROVED':
        return 3;
      case 'SCHEDULED':
      case 'RUNNING':
      case 'ACTIVE':
      case 'PAUSED':
        return 4;
      case 'COMPLETED':
      case 'CANCELLED':
        return 5;
      default:
        return 0;
    }
  };

  const lifecycleSteps = [
    'Draft',
    'Simulated',
    'Pending Approval',
    'Approved',
    'Running',
    'Completed',
  ];

  const currentStep = campaign ? getStepIndex(campaign.status) : 0;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <AppLayout title="Campaigns" subtitle="Campaign Execution & Telemetry">
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Retention Campaigns Roster</span>
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
            {/* Header Card with Lifecycle Stepper */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                      {campaign.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold uppercase tracking-wider">
                      {campaign.status}
                    </span>
                    {campaign.is_dry_run && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B] border border-slate-300 text-[10px] font-bold">
                        DRY-RUN MODE
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    {campaign.description || 'Targeted customer retention intervention.'}
                  </p>
                </div>

                {/* Governance Action Controls */}
                <div className="flex items-center gap-2">
                  {/* Draft / Simulated: Submit for Approval */}
                  {(campaign.status === 'DRAFT' || campaign.status === 'SIMULATED') && (
                    <button
                      onClick={handleSubmitApproval}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit for Approval</span>
                    </button>
                  )}

                  {/* Pending Approval: Approve or Reject (Admin) */}
                  {campaign.status === 'PENDING_APPROVAL' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowApproveModal(true)}
                        className="px-4 py-2 bg-[#16A34A] hover:bg-green-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Review & Approve</span>
                      </button>
                    </div>
                  )}

                  {/* Approved: Execute Campaign */}
                  {campaign.status === 'APPROVED' && (
                    <button
                      onClick={() => setShowExecModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Execute Campaign</span>
                    </button>
                  )}

                  {/* Running / Active: Pause */}
                  {(campaign.status === 'RUNNING' || campaign.status === 'ACTIVE') && (
                    <button
                      onClick={handlePause}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#172033] font-semibold text-xs rounded-lg border border-[#E2E8F0] transition-all flex items-center gap-1.5"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Campaign</span>
                    </button>
                  )}

                  {/* Paused: Resume */}
                  {campaign.status === 'PAUSED' && (
                    <button
                      onClick={handleResume}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Resume Campaign</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Lifecycle Stepper */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] mb-2">
                  <span>Campaign Lifecycle Progress</span>
                  <span className="text-[#2563EB]">Stage {currentStep + 1} of 6</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {lifecycleSteps.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={step} className="space-y-1.5">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isDone
                              ? 'bg-[#16A34A]'
                              : isCurrent
                              ? 'bg-[#2563EB] animate-pulse'
                              : 'bg-[#E2E8F0]'
                          }`}
                        />
                        <span
                          className={`text-[10px] block truncate ${
                            isCurrent
                              ? 'font-bold text-[#2563EB]'
                              : isDone
                              ? 'text-[#16A34A]'
                              : 'text-[#64748B]'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Targeted Accounts
                </span>
                <div className="text-2xl font-bold text-[#172033]">
                  {performance?.total_targeted ?? campaign.target_customer_count ?? 0}
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Eligible audience</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Delivered Messages
                </span>
                <div className="text-2xl font-bold text-[#16A34A]">
                  {performance?.delivered_count ?? 0}
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                  {performance?.delivery_rate_pct ?? 0}% dispatch rate
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Holdout Control Group
                </span>
                <div className="text-2xl font-bold text-[#D97706]">
                  {performance?.control_group_count ?? 0}
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Holdout benchmark</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Offer Redemptions
                </span>
                <div className="text-2xl font-bold text-[#2563EB]">
                  {performance?.redeemed_count ?? 0}
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                  {performance?.redemption_rate_pct ?? 0}% converted
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Incentive Budget Spent
                </span>
                <div className="text-2xl font-bold text-[#172033]">
                  ₹{performance?.total_incentive_spent_inr?.toLocaleString('en-IN') ?? 0}
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Total incentive cost</span>
              </div>
            </div>

            {/* Performance Tracking & Control Group Incrementality Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT: Control Group vs Treatment Group Comparison Card (col-span-7) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#2563EB]" />
                    <h3 className="font-bold text-base text-[#172033]">
                      Incrementality & Retention Lift Analysis
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    A/B HOLDOUT
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Treatment Group */}
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
                    <span className="text-[11px] font-bold text-[#2563EB] uppercase">
                      Treatment Group (Incentivized)
                    </span>
                    <div className="text-3xl font-bold text-[#2563EB]">
                      {performance?.treatment_conversion_rate_pct ?? 0}%
                    </div>
                    <span className="text-[11px] text-[#64748B] block">
                      Conversion rate on {performance?.treatment_group_count ?? 0} contacted accounts
                    </span>
                  </div>

                  {/* Holdout Control Group */}
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                    <span className="text-[11px] font-bold text-[#D97706] uppercase">
                      Holdout Control (No Message)
                    </span>
                    <div className="text-3xl font-bold text-[#D97706]">
                      {performance?.control_conversion_rate_pct ?? 0}%
                    </div>
                    <span className="text-[11px] text-[#64748B] block">
                      Natural retention on {performance?.control_group_count ?? 0} holdout accounts
                    </span>
                  </div>
                </div>

                {/* Net Measured Retention Lift */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">
                      Statistically Isolated Retention Lift
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Net retention uplift directly attributable to the incentive offer.
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#16A34A]">
                      +{performance?.incremental_retention_lift_pct ?? 0}%
                    </div>
                    <span className="text-[10px] text-[#16A34A] font-semibold">Net Incremental Lift</span>
                  </div>
                </div>

                {/* Delivery Telemetry & Integration Status */}
                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                  <span>
                    Clicks Telemetry:{' '}
                    <strong className="text-[#172033]">
                      {performance?.clicks_count !== null ? performance?.clicks_count : 'N/A (Integration Not Connected)'}
                    </strong>
                  </span>
                  {campaign.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleSimulateInteraction('REDEEM')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded text-[11px] font-semibold text-[#2563EB] flex items-center gap-1"
                    >
                      <span>Simulate User Redemption</span>
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT: Campaign Specifications & Governance Logs (col-span-5) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#2563EB]" />
                    Campaign Specifications
                  </h3>
                  <span className="text-[10px] text-[#64748B]">ID: {campaign.id.slice(0, 8)}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-[#64748B]">Retention Offer:</span>
                    <strong className="text-[#2563EB]">{campaign.offer}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-[#64748B]">Offer Type & Unit:</span>
                    <strong className="text-[#172033]">{campaign.offer_type} ({campaign.discount_unit})</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-[#64748B]">Max Concession Cap:</span>
                    <strong className="text-[#172033]">₹{campaign.max_discount_cap_inr}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-[#64748B]">Delivery Channel:</span>
                    <strong className="text-[#172033]">{campaign.delivery_channel || 'EMAIL'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-[#64748B]">Target Risk Tier:</span>
                    <strong className="text-[#DC2626]">{campaign.target_risk_level}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-[#64748B]">Control Holdout %:</span>
                    <strong className="text-[#172033]">{campaign.control_group_pct || 10}%</strong>
                  </div>
                  {campaign.approved_by && (
                    <div className="flex justify-between py-1 border-b border-slate-100 bg-emerald-50/60 p-2 rounded">
                      <span className="text-emerald-800">Approved By:</span>
                      <strong className="text-emerald-900">{campaign.approved_by}</strong>
                    </div>
                  )}
                </div>

                {/* Personalized Message Preview */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-[#64748B] block mb-1">Dispatched Message Copy:</span>
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] text-[#172033] whitespace-pre-line max-h-28 overflow-y-auto">
                    {campaign.message_body || 'Standard retention win-back message.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Telemetry Roster Table */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#2563EB]" />
                  <div>
                    <h3 className="font-bold text-base text-[#172033]">
                      Recipient Delivery & Outcome Telemetry
                    </h3>
                    <span className="text-xs text-[#64748B]">
                      {totalRecipients} total accounts targeted in this intervention
                    </span>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <select
                    value={recipientStatusFilter}
                    onChange={(e) => setRecipientStatusFilter(e.target.value)}
                    className="p-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#172033]"
                  >
                    <option value="ALL">All Recipient States</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CONTROL_GROUP">Control Group</option>
                    <option value="REDEEMED">Redeemed</option>
                    <option value="FAILED">Failed</option>
                  </select>

                  <div className="relative">
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Search recipient..."
                      className="pl-7 pr-2 py-1 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#172033] w-36 sm:w-48"
                    />
                    <Search className="w-3 h-3 text-[#64748B] absolute left-2 top-2" />
                  </div>
                </div>
              </div>

              {recipients.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  No recipients recorded yet. Execute the campaign to record individual delivery telemetry.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                      <tr>
                        <th className="p-3">Customer Code</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Risk Level</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Execution Mode</th>
                        <th className="p-3">Cost (₹)</th>
                        <th className="p-3">Dispatched Time</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {recipients.map((r) => (
                        <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="p-3 font-mono font-medium text-[#172033]">
                            {r.customer_code}
                          </td>
                          <td className="p-3 text-[#64748B]">{r.customer_email || '—'}</td>
                          <td className="p-3">
                            <span className="font-bold text-[#DC2626]">{r.risk_score}</span>
                            <span className="text-[10px] text-[#64748B] ml-1">({r.risk_level})</span>
                          </td>
                          <td className="p-3">
                            {r.status === 'DELIVERED' && (
                              <span className="px-2 py-0.5 rounded-full bg-green-50 text-[#16A34A] border border-green-200 text-[10px] font-bold">
                                DELIVERED
                              </span>
                            )}
                            {r.status === 'CONTROL_GROUP' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#D97706] border border-amber-200 text-[10px] font-bold">
                                CONTROL GROUP
                              </span>
                            )}
                            {r.status === 'REDEEMED' && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 text-[10px] font-bold">
                                REDEEMED
                              </span>
                            )}
                            {r.status === 'FAILED' && (
                              <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#DC2626] border border-red-200 text-[10px] font-bold">
                                FAILED
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {r.is_dry_run ? (
                              <span className="text-[11px] text-[#64748B]">Dry-Run Sandbox</span>
                            ) : (
                              <span className="text-[11px] text-[#16A34A] font-semibold">Live Dispatch</span>
                            )}
                          </td>
                          <td className="p-3 font-medium text-[#172033]">
                            ₹{r.incentive_cost_inr}
                          </td>
                          <td className="p-3 text-[#64748B]">
                            {r.dispatched_at ? formatDate(r.dispatched_at) : '—'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedRecipient(r)}
                              className="text-[#2563EB] hover:underline font-semibold"
                            >
                              View Message
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recipient Message Preview Modal */}
            {selectedRecipient && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-4 shadow-dropdown">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <h3 className="font-bold text-base text-[#172033]">
                      Personalized Message to {selectedRecipient.customer_code}
                    </h3>
                    <button
                      onClick={() => setSelectedRecipient(null)}
                      className="p-1 rounded text-[#64748B] hover:text-[#172033]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Recipient Email:</span>
                      <strong className="text-[#172033]">{selectedRecipient.customer_email}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Delivery Status:</span>
                      <strong className="text-[#16A34A]">{selectedRecipient.status}</strong>
                    </div>
                    {selectedRecipient.error_message && (
                      <div className="p-2.5 rounded bg-red-50 text-red-700 text-xs">
                        Error: {selectedRecipient.error_message}
                      </div>
                    )}
                    <div className="pt-2">
                      <span className="font-semibold text-[#64748B] block mb-1">Message Content:</span>
                      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-xs whitespace-pre-line text-[#172033]">
                        {selectedRecipient.personalized_message}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Execute Confirmation Modal */}
            {showExecModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-md rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-4 shadow-dropdown">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <h3 className="font-bold text-base text-[#172033]">Confirm Campaign Execution</h3>
                    <button
                      onClick={() => setShowExecModal(false)}
                      className="p-1 rounded text-[#64748B] hover:text-[#172033]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-[#64748B]">
                    <p>
                      You are about to execute <strong>{campaign.name}</strong> targeting{' '}
                      <strong>{campaign.target_customer_count}</strong> accounts.
                    </p>

                    <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                      <div className="flex justify-between">
                        <span>Holdout Control Group:</span>
                        <strong className="text-[#D97706]">{campaign.control_group_pct}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Per-Account Incentive:</span>
                        <strong className="text-[#172033]">₹{campaign.per_customer_cost_inr}</strong>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#172033] pt-1">
                      <input
                        type="checkbox"
                        checked={execDryRun}
                        onChange={(e) => setExecDryRun(e.target.checked)}
                        className="w-4 h-4 rounded text-[#2563EB]"
                      />
                      <span>Run in Safe Dry-Run Mode (Recommended for testing)</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => setShowExecModal(false)}
                      className="px-4 py-2 rounded-lg bg-[#F8FAFC] text-[#64748B] font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleExecute}
                      className="px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{actionLoading ? 'Executing...' : 'Execute Now'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Modal (Admin Only) */}
            {showApproveModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-md rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-4 shadow-dropdown">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <h3 className="font-bold text-base text-[#172033]">Governance Approval Review</h3>
                    <button
                      onClick={() => setShowApproveModal(false)}
                      className="p-1 rounded text-[#64748B] hover:text-[#172033]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="text-[#64748B]">
                      Review campaign incentive budget and audience scope before granting authorization.
                    </p>

                    <div>
                      <label className="block text-[#172033] font-semibold mb-1">Approval Notes / Conditions</label>
                      <textarea
                        rows={3}
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="e.g., Authorized for Q4 Coimbatore win-back drive..."
                        className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2 text-[#172033]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleApprove('REJECT')}
                      className="px-4 py-2 rounded-lg bg-red-50 text-[#DC2626] border border-red-200 font-semibold text-xs"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleApprove('APPROVE')}
                      className="px-4 py-2 rounded-lg bg-[#16A34A] text-white hover:bg-green-700 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Authorize Campaign</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
