import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
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
  Clock,
  ShieldCheck,
  TrendingDown,
  Users,
  Sliders,
  DollarSign,
  Send,
  Eye,
  Info,
  ChevronRight,
  ChevronLeft,
  Mail,
  Smartphone,
  Bell,
  Play,
  Pause,
  XCircle,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { RetentionBudgetIntelligence } from '@/components/campaigns/RetentionBudgetIntelligence';

export default function CampaignsPage() {
  const router = useRouter();
  const { user, appType } = useAuth();

  const [viewMode, setViewMode] = useState<'BUDGET_INTELLIGENCE' | 'CAMPAIGNS'>('BUDGET_INTELLIGENCE');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [providerStatus, setProviderStatus] = useState<any>(null);

  // AI Retention Intelligence Co-Pilot state
  const [showAgentModal, setShowAgentModal] = useState<boolean>(false);
  const [agentLoading, setAgentLoading] = useState<boolean>(false);
  const [agentProposal, setAgentProposal] = useState<any>(null);
  const [agentError, setAgentError] = useState<string | null>(null);

  // Multi-step Create Campaign Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [creating, setCreating] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objective: 'Prevent High-Risk Churn',
    target_segment: 'All High-Risk Accounts',
    target_risk_level: 'HIGH',
    city: 'ALL',
    min_inactivity_days: 0,
    min_orders: 0,
    offer: '20% OFF Next Order',
    offer_type: 'DISCOUNT',
    discount_value: 20.0,
    discount_unit: '%',
    max_discount_cap_inr: 150.0,
    total_budget_inr: 5000.0,
    per_customer_cost_inr: 45.0,
    action_strength: 'Medium',
    control_group_pct: 10.0,
    is_dry_run: true,
    delivery_channel: 'EMAIL',
    message_subject: 'Special 20% Retention Offer for You',
    message_body: 'Hello {{customer_code}},\n\nWe noticed you haven\'t ordered recently. We value your loyalty and want to make your next experience exceptional.\n\nEnjoy 20% OFF your next order with code RETAIN20!\n\n— The LoyaltyLens Team',
  });

  // Audience Preview state
  const [audienceLoading, setAudienceLoading] = useState<boolean>(false);
  const [audienceData, setAudienceData] = useState<any>(null);

  // Recommended Offers state
  const [offersLoading, setOffersLoading] = useState<boolean>(false);
  const [recommendedOffers, setRecommendedOffers] = useState<any[]>([]);

  // Economics Simulator state
  const [economicsLoading, setEconomicsLoading] = useState<boolean>(false);
  const [economicsData, setEconomicsData] = useState<any>(null);
  const [simAssumptions, setSimAssumptions] = useState({
    response_rate_pct: 15.0,
    avg_order_value_inr: 500.0,
    gross_margin_pct: 40.0,
    repeat_purchase_factor: 1.4,
  });

  // Available cities from dataset
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    fetchCampaigns();
    fetchProviderStatus();
    fetchDistinctCities();
  }, []);

  // Pre-fill modal if query params exist (from Playbook, Simulator, or AI Insights)
  useEffect(() => {
    if (router.query.name || router.query.offer || router.query.action) {
      setFormData((prev) => ({
        ...prev,
        name: (router.query.name as string) || prev.name,
        offer: (router.query.offer as string) || (router.query.action as string) || prev.offer,
        discount_value: router.query.discount ? Number(router.query.discount) : prev.discount_value,
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

  const fetchProviderStatus = async () => {
    try {
      const res = await api.get('/campaigns/integrations/status');
      setProviderStatus(res.data);
    } catch (e) {
      console.error('Failed to fetch messaging status', e);
    }
  };

  const fetchDistinctCities = async () => {
    try {
      const res = await api.get('/customers', { params: { size: 100 } });
      const items = res.data?.items || [];
      const cities = Array.from(new Set(items.map((c: any) => c.city).filter(Boolean))) as string[];
      setAvailableCities(cities.sort());
    } catch (e) {
      console.error('Failed to fetch cities', e);
    }
  };

  // Run Audience Preview query
  const queryAudiencePreview = async (riskLevel: string, city: string, minInactivity: number, minOrders: number) => {
    setAudienceLoading(true);
    try {
      const res = await api.post('/campaigns/audience-preview', {
        target_risk_level: riskLevel,
        city: city,
        min_inactivity_days: minInactivity > 0 ? minInactivity : undefined,
        min_orders: minOrders > 0 ? minOrders : undefined,
        exclude_fatigue_days: 0,
      });
      setAudienceData(res.data);
    } catch (err) {
      console.error('Audience preview failed', err);
    } finally {
      setAudienceLoading(false);
    }
  };

  // Run Offer Recommendations
  const queryRecommendedOffers = async (riskLevel: string, city: string) => {
    setOffersLoading(true);
    try {
      const res = await api.post('/campaigns/recommend-offers', {
        target_risk_level: riskLevel,
        city: city,
        app_type: appType.replace(/[^a-zA-Z ]/g, '').trim(),
      });
      setRecommendedOffers(safeArray(res.data));
    } catch (err) {
      console.error('Failed to recommend offers', err);
    } finally {
      setOffersLoading(false);
    }
  };

  // Run Economics Simulation
  const queryEconomicsSimulation = async (targetCount: number, perCustomerCost: number, assumptions: typeof simAssumptions, budgetCap: number) => {
    setEconomicsLoading(true);
    try {
      const res = await api.post('/campaigns/simulate-economics', {
        target_customer_count: targetCount,
        per_customer_cost_inr: perCustomerCost,
        assumed_response_rate_pct: assumptions.response_rate_pct,
        avg_order_value_inr: assumptions.avg_order_value_inr,
        gross_margin_pct: assumptions.gross_margin_pct,
        repeat_purchase_factor: assumptions.repeat_purchase_factor,
        total_budget_cap_inr: budgetCap,
      });
      setEconomicsData(res.data);
    } catch (err) {
      console.error('Economics simulation failed', err);
    } finally {
      setEconomicsLoading(false);
    }
  };

  // Fetch AI Retention Agent Proposal
  const handleRunRetentionAgent = async () => {
    setAgentLoading(true);
    setAgentError(null);
    setShowAgentModal(true);
    try {
      const res = await api.post('/campaigns/agent/recommend', null, {
        params: { focus_risk_level: 'HIGH' }
      });
      setAgentProposal(res.data);
    } catch (err: any) {
      setAgentError(err.response?.data?.detail || 'Retention agent failed to generate briefing.');
    } finally {
      setAgentLoading(false);
    }
  };

  // Apply Agent Proposal to Campaign Builder
  const handleApplyAgentProposal = (proposal: any) => {
    const pc = proposal.proposed_campaign;
    setFormData((prev) => ({
      ...prev,
      name: pc.name,
      description: pc.description,
      objective: pc.objective,
      target_segment: pc.target_segment,
      target_risk_level: pc.target_risk_level,
      city: pc.audience_filters?.city || 'ALL',
      offer: pc.offer,
      offer_type: pc.offer_type || 'DISCOUNT',
      discount_value: pc.discount_value || 25.0,
      max_discount_cap_inr: pc.max_discount_cap_inr || 150.0,
      total_budget_inr: pc.total_budget_inr || 3500.0,
      per_customer_cost_inr: pc.per_customer_cost_inr || 45.0,
      delivery_channel: pc.delivery_channel || 'EMAIL',
      message_subject: pc.message_subject || 'Exclusive Retention Offer',
      message_body: pc.message_body || '',
      control_group_pct: pc.control_group_pct || 10.0,
      is_dry_run: pc.is_dry_run ?? true,
    }));
    setShowAgentModal(false);
    setShowModal(true);
    setWizardStep(1);
  };

  // Wizard Navigation Handler
  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!formData.name.trim()) {
        alert('Please provide a campaign name.');
        return;
      }
      queryAudiencePreview(formData.target_risk_level, formData.city, formData.min_inactivity_days, formData.min_orders);
      setWizardStep(2);
    } else if (wizardStep === 2) {
      queryRecommendedOffers(formData.target_risk_level, formData.city);
      setWizardStep(3);
    } else if (wizardStep === 3) {
      const targetCount = audienceData?.total_matching ?? 50;
      queryEconomicsSimulation(targetCount, formData.per_customer_cost_inr, simAssumptions, formData.total_budget_inr);
      setWizardStep(4);
    } else if (wizardStep === 4) {
      setWizardStep(5);
    }
  };

  const handlePrevStep = () => {
    setWizardStep((prev) => Math.max(1, prev - 1));
  };

  // Handle final campaign submission
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        objective: formData.objective,
        target_segment: formData.target_segment,
        target_risk_level: formData.target_risk_level,
        offer: formData.offer,
        offer_type: formData.offer_type,
        discount_value: Number(formData.discount_value),
        discount_unit: formData.discount_unit,
        max_discount_cap_inr: Number(formData.max_discount_cap_inr),
        total_budget_inr: Number(formData.total_budget_inr),
        per_customer_cost_inr: Number(formData.per_customer_cost_inr),
        action_strength: formData.action_strength,
        control_group_pct: Number(formData.control_group_pct),
        is_dry_run: formData.is_dry_run,
        delivery_channel: formData.delivery_channel,
        message_subject: formData.message_subject,
        message_body: formData.message_body,
        audience_filters: {
          target_risk_level: formData.target_risk_level,
          city: formData.city,
          min_inactivity_days: formData.min_inactivity_days > 0 ? formData.min_inactivity_days : undefined,
          min_orders: formData.min_orders > 0 ? formData.min_orders : undefined,
          exclude_fatigue_days: 0,
        },
        simulation_assumptions: economicsData || undefined,
      };

      await api.post('/campaigns', payload);
      setShowModal(false);
      setWizardStep(1);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  // Quick Status Actions
  const handleQuickPause = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/campaigns/${id}/pause`);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to pause campaign');
    }
  };

  const handleQuickResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/campaigns/${id}/resume`);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to resume campaign');
    }
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.offer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.target_segment && c.target_segment.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'ALL') return true;
      if (activeTab === 'ACTIVE') return c.status === 'ACTIVE' || c.status === 'RUNNING';
      if (activeTab === 'PENDING') return c.status === 'PENDING_APPROVAL';
      if (activeTab === 'DRAFTS') return c.status === 'DRAFT' || c.status === 'SIMULATED';
      if (activeTab === 'COMPLETED') return c.status === 'COMPLETED';
      return true;
    });
  }, [campaigns, activeTab, searchQuery]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'RUNNING').length;
    const totalTargeted = campaigns.reduce((acc, c) => acc + (c.target_customer_count || 0), 0);
    const totalBudget = campaigns.reduce((acc, c) => acc + (c.total_budget_inr || 0), 0);
    return { total, active, totalTargeted, totalBudget };
  }, [campaigns]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse"></span>
            ACTIVE
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-[#D97706] border border-amber-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> PENDING APPROVAL
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> APPROVED
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
      case 'PAUSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Pause className="w-3 h-3" /> PAUSED
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
    <AppLayout title="Campaigns" subtitle="Retention Intelligence Command Center">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <Megaphone className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                Retention Campaign Command Center
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
              Architect, target, simulate, approve, and execute measurable customer retention interventions powered by real ML churn telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* AI Agent Button */}
            <button
              onClick={handleRunRetentionAgent}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Retention Co-Pilot</span>
            </button>

            {/* Create Campaign Wizard Button */}
            <button
              onClick={() => {
                setShowModal(true);
                setWizardStep(1);
              }}
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher: Retention Budget Intelligence vs Campaign Roster */}
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
          <button
            onClick={() => setViewMode('BUDGET_INTELLIGENCE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'BUDGET_INTELLIGENCE'
                ? 'bg-[#172033] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Retention Budget Intelligence</span>
          </button>

          <button
            onClick={() => setViewMode('CAMPAIGNS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'CAMPAIGNS'
                ? 'bg-[#172033] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
            }`}
          >
            <Megaphone className="w-4 h-4 text-[#2563EB]" />
            <span>Campaign Roster & Interventions ({aggregateStats.total})</span>
          </button>
        </div>

        {viewMode === 'BUDGET_INTELLIGENCE' ? (
          <RetentionBudgetIntelligence />
        ) : (
          <>
            {/* Aggregate KPI Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
              Total Campaigns
            </span>
            <div className="text-2xl font-bold text-[#172033]">{aggregateStats.total}</div>
            <span className="text-[10px] text-[#64748B] mt-0.5 block">Managed interventions</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
              Active / Running
            </span>
            <div className="text-2xl font-bold text-[#2563EB]">{aggregateStats.active}</div>
            <span className="text-[10px] text-[#64748B] mt-0.5 block">Live in-market campaigns</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
              Targeted Account Reach
            </span>
            <div className="text-2xl font-bold text-[#0D9488]">
              {aggregateStats.totalTargeted.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-[#64748B] mt-0.5 block">Unique customer cohort</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
              Total Budget Committed
            </span>
            <div className="text-2xl font-bold text-[#172033]">
              ₹{aggregateStats.totalBudget.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${providerStatus?.configured ? 'bg-green-500' : 'bg-blue-500'}`} />
              <span className="text-[10px] text-[#64748B]">
                {providerStatus?.configured ? 'Live SMTP Provider' : 'Safe Dry-Run Sandbox'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab & Search Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Campaigns' },
              { id: 'ACTIVE', label: 'Active & Running' },
              { id: 'PENDING', label: 'Pending Approval' },
              { id: 'DRAFTS', label: 'Drafts' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns or offers..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] text-xs text-[#172033] rounded-lg border border-[#E2E8F0] focus:bg-white focus:border-[#2563EB] focus:outline-none"
            />
            <Target className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Campaign List Grid */}
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
        ) : filteredCampaigns.length === 0 ? (
          <EmptyState
            title="No Matching Retention Campaigns"
            description="Create your first campaign or use the AI Retention Co-Pilot to generate a data-driven proposal."
            actionText="Create Campaign"
            onAction={() => {
              setShowModal(true);
              setWizardStep(1);
            }}
            icon={Megaphone}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((c) => (
              <div
                key={c.id}
                className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(c.status)}
                    <span className="text-[11px] font-semibold text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                      {c.target_segment || 'All Accounts'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#172033] leading-snug">{c.name}</h3>
                    <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                      {c.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Campaign Telemetry Spec */}
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Incentive Offer:</span>
                      <strong className="text-[#2563EB] truncate max-w-[170px]">{c.offer}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Target Risk Tier:</span>
                      <strong className="text-[#DC2626]">{c.target_risk_level}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Eligible Reach:</span>
                      <strong className="text-[#172033]">
                        {safeNumber(c.target_customer_count, 0)} accounts
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Budget Allocated:</span>
                      <strong className="text-[#16A34A]">
                        ₹{safeNumber(c.total_budget_inr, 0).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {c.status === 'RUNNING' && (
                      <button
                        onClick={(e) => handleQuickPause(c.id, e)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                      >
                        Pause
                      </button>
                    )}
                    {c.status === 'PAUSED' && (
                      <button
                        onClick={(e) => handleQuickResume(c.id, e)}
                        className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px]"
                      >
                        Resume
                      </button>
                    )}
                    <span className="text-[#64748B] text-[11px]">
                      {formatDate(c.created_at)}
                    </span>
                  </div>

                  <Link
                    href={`/campaigns/${c.id}`}
                    className="inline-flex items-center gap-1 font-bold text-[#2563EB] hover:underline"
                  >
                    <span>Mission Control</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}

        {/* AI Retention Co-Pilot Modal */}
        {showAgentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-5 shadow-dropdown animate-fadeIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#172033]">Retention Intelligence Agent</h3>
                    <span className="text-[11px] text-[#64748B]">
                      Real-time analysis of churn segments, friction points, and historical performance.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowAgentModal(false)}
                  className="p-1 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {agentLoading ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-[#172033]">
                    Analyzing active customer database, ML churn scores, and past campaign effectiveness...
                  </p>
                </div>
              ) : agentError ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {agentError}
                </div>
              ) : agentProposal ? (
                <div className="space-y-4 text-xs">
                  {/* Strategic Rationale Card */}
                  <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Executive Synthesis & Rationale
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        {agentProposal.agent_provider}
                      </span>
                    </div>
                    <p className="text-[#172033] leading-relaxed">
                      {agentProposal.strategic_rationale}
                    </p>
                  </div>

                  {/* Segment Telemetry Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[10px]">Critical Hotspot</span>
                      <strong className="text-sm text-[#DC2626]">
                        {agentProposal.segment_summary.critical_city}
                      </strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[10px]">High-Risk Cohort</span>
                      <strong className="text-sm text-[#172033]">
                        {agentProposal.segment_summary.eligible_cohort_size} accounts
                      </strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[10px]">Projected Saved</span>
                      <strong className="text-sm text-[#2563EB]">
                        {agentProposal.segment_summary.projected_retained_accounts} accounts
                      </strong>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[10px]">Projected ROI</span>
                      <strong className="text-sm text-[#16A34A]">
                        {agentProposal.segment_summary.projected_roi_pct}%
                      </strong>
                    </div>
                  </div>

                  {/* Proposed Campaign Draft */}
                  <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-3 shadow-sm">
                    <span className="font-bold text-[#172033] block border-b border-[#E2E8F0] pb-2">
                      Proposed Retention Intervention
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Campaign Title:</span>
                        <strong className="text-[#172033]">{agentProposal.proposed_campaign.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Recommended Offer:</span>
                        <strong className="text-[#2563EB]">{agentProposal.proposed_campaign.offer}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Estimated Budget:</span>
                        <strong className="text-[#16A34A]">
                          ₹{agentProposal.proposed_campaign.total_budget_inr.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <span className="font-semibold text-[#64748B] block mb-1">Generated Message Copy:</span>
                      <div className="p-3 rounded-lg bg-[#F8FAFC] text-[11px] text-[#172033] whitespace-pre-line font-mono border border-[#E2E8F0]">
                        {agentProposal.proposed_campaign.message_body}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Governance Safeguard:</strong> This proposed campaign cannot be launched automatically by the AI. You must review and submit it through the standard governance approval workflow.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => setShowAgentModal(false)}
                      className="px-4 py-2 rounded-lg bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0] font-semibold"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyAgentProposal(agentProposal)}
                      className="px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 font-semibold shadow-sm flex items-center gap-1.5"
                    >
                      <span>Apply to Campaign Builder</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Multi-Step Create Campaign Wizard Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-5 shadow-dropdown animate-fadeIn max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#172033]">Retention Campaign Studio</h3>
                    <span className="text-[11px] text-[#64748B]">Step {wizardStep} of 5: {
                      wizardStep === 1 ? 'Campaign Objective & Details' :
                      wizardStep === 2 ? 'Intelligent Audience Targeting' :
                      wizardStep === 3 ? 'Offer Recommendation Engine' :
                      wizardStep === 4 ? 'Economics & ROI Simulator' :
                      'Message Template & Governance'
                    }</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Stepper Bar */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all ${
                      step <= wizardStep ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'
                    }`}
                  />
                ))}
              </div>

              {/* STEP 1: Objective & Details */}
              {wizardStep === 1 && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Campaign Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Coimbatore Food Delivery Win-Back Drive"
                      className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#172033] font-semibold mb-1">Strategic Objective</label>
                      <select
                        value={formData.objective}
                        onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                        className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                      >
                        <option value="Prevent High-Risk Churn">Prevent High-Risk Churn</option>
                        <option value="Reactivate Dormant Accounts">Reactivate Dormant Accounts</option>
                        <option value="Mitigate Delivery Friction Churn">Mitigate Delivery Friction Churn</option>
                        <option value="Upsell to Pro/Prime Tier">Upsell to Pro/Prime Tier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#172033] font-semibold mb-1">Delivery Channel</label>
                      <select
                        value={formData.delivery_channel}
                        onChange={(e) => setFormData({ ...formData, delivery_channel: e.target.value })}
                        className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                      >
                        <option value="EMAIL">Email Campaign</option>
                        <option value="PUSH">App Push Notification</option>
                        <option value="SMS">SMS Notification</option>
                        <option value="IN_APP">In-App Banner & Modal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Context on target problem, friction root cause, and intended customer journey..."
                      className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Intelligent Audience Targeting */}
              {wizardStep === 2 && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#172033] font-semibold mb-1">Target Risk Severity</label>
                      <select
                        value={formData.target_risk_level}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, target_risk_level: val });
                          queryAudiencePreview(val, formData.city, formData.min_inactivity_days, formData.min_orders);
                        }}
                        className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                      >
                        <option value="HIGH">High Risk Accounts Only</option>
                        <option value="MEDIUM">Medium Risk Accounts</option>
                        <option value="HIGH_OR_MEDIUM">High + Medium Risk</option>
                        <option value="ALL">All Cohorts (Broad)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#172033] font-semibold mb-1">Geographic Region / City</label>
                      <select
                        value={formData.city}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, city: val });
                          queryAudiencePreview(formData.target_risk_level, val, formData.min_inactivity_days, formData.min_orders);
                        }}
                        className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                      >
                        <option value="ALL">All Cities (Pan-India)</option>
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#172033] font-semibold mb-1">
                        Minimum Inactivity Days: {formData.min_inactivity_days} days
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        step="5"
                        value={formData.min_inactivity_days}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData({ ...formData, min_inactivity_days: val });
                          queryAudiencePreview(formData.target_risk_level, formData.city, val, formData.min_orders);
                        }}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#172033] font-semibold mb-1">
                        Minimum Past Orders: {formData.min_orders} orders
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        step="1"
                        value={formData.min_orders}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData({ ...formData, min_orders: val });
                          queryAudiencePreview(formData.target_risk_level, formData.city, formData.min_inactivity_days, val);
                        }}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>
                  </div>

                  {/* Real Customer Audience Preview Section */}
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#2563EB]" />
                        <span className="font-bold text-[#172033]">
                          Real Customer Telemetry Match
                        </span>
                      </div>
                      {audienceLoading ? (
                        <RefreshCw className="w-4 h-4 text-[#2563EB] animate-spin" />
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]">
                          {audienceData?.total_matching ?? 0} Matching Accounts
                        </span>
                      )}
                    </div>

                    {audienceData && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                          <span>High Risk: <strong className="text-[#DC2626]">{audienceData.risk_distribution?.HIGH || 0}</strong></span>
                          <span>Medium: <strong className="text-[#D97706]">{audienceData.risk_distribution?.MEDIUM || 0}</strong></span>
                          <span>Excluded (Fatigue Safeguard): <strong>{audienceData.excluded_fatigue_count}</strong></span>
                        </div>

                        {/* Customer Preview Table */}
                        <div className="max-h-40 overflow-y-auto border border-[#E2E8F0] rounded-lg bg-white">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 text-[#64748B]">
                              <tr>
                                <th className="p-2">Customer</th>
                                <th className="p-2">City</th>
                                <th className="p-2">Orders</th>
                                <th className="p-2">Risk Score</th>
                                <th className="p-2">Level</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                              {audienceData.sample_customers?.slice(0, 5).map((c: any) => (
                                <tr key={c.id}>
                                  <td className="p-2 font-mono font-medium text-[#172033]">{c.customer_code}</td>
                                  <td className="p-2 text-[#64748B]">{c.city}</td>
                                  <td className="p-2 text-[#172033]">{c.orders_count}</td>
                                  <td className="p-2 font-bold text-[#DC2626]">{c.risk_score}</td>
                                  <td className="p-2">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-[#DC2626]">
                                      {c.risk_level}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Offer Recommendation Engine */}
              {wizardStep === 3 && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <span>
                      <strong>Rule-Based Offer Engine:</strong> Offers below are dynamically tailored to the dominant churn reasons observed across your selected {audienceData?.total_matching ?? 0} customers.
                    </span>
                  </div>

                  {offersLoading ? (
                    <div className="py-8 text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin mx-auto" />
                      <p className="text-[#64748B]">Generating friction-aligned recommendations...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recommendedOffers.map((rec, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              offer: rec.offer_name,
                              offer_type: rec.offer_type,
                              discount_value: rec.discount_value,
                              discount_unit: rec.discount_unit,
                              max_discount_cap_inr: rec.max_discount_cap_inr,
                              per_customer_cost_inr: rec.estimated_per_customer_cost_inr,
                              delivery_channel: rec.recommended_channel,
                            }));
                          }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            formData.offer === rec.offer_name
                              ? 'border-[#2563EB] bg-[#EFF6FF]'
                              : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-[#172033] text-sm">{rec.offer_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#2563EB]">
                              Est. Cost: ₹{rec.estimated_per_customer_cost_inr}/user
                            </span>
                          </div>
                          <p className="text-[#64748B] mb-2 leading-relaxed">{rec.rationale}</p>
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60 text-[#64748B]">
                            <span>Constraint: {rec.business_limits}</span>
                            <span className="text-[10px] text-amber-700 italic">Redemption required for retention</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custom Offer Overrides */}
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                    <span className="font-bold text-[#172033] block">Customize Offer & Guardrails</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[#64748B] font-semibold mb-1">Offer Title</label>
                        <input
                          type="text"
                          value={formData.offer}
                          onChange={(e) => setFormData({ ...formData, offer: e.target.value })}
                          className="w-full rounded-lg bg-white border border-[#E2E8F0] p-2 text-[#172033]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#64748B] font-semibold mb-1">Max Discount Cap (₹)</label>
                        <input
                          type="number"
                          value={formData.max_discount_cap_inr}
                          onChange={(e) => setFormData({ ...formData, max_discount_cap_inr: Number(e.target.value) })}
                          className="w-full rounded-lg bg-white border border-[#E2E8F0] p-2 text-[#172033]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#64748B] font-semibold mb-1">Est. Cost / User (₹)</label>
                        <input
                          type="number"
                          value={formData.per_customer_cost_inr}
                          onChange={(e) => setFormData({ ...formData, per_customer_cost_inr: Number(e.target.value) })}
                          className="w-full rounded-lg bg-white border border-[#E2E8F0] p-2 text-[#172033]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Retention Simulator & Economics */}
              {wizardStep === 4 && (
                <div className="space-y-4 text-xs">
                  {/* Economics Sandbox Levers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div>
                      <div className="flex justify-between font-semibold text-[#172033] mb-1">
                        <span>Assumed Response Rate</span>
                        <span className="text-[#2563EB]">{simAssumptions.response_rate_pct}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        value={simAssumptions.response_rate_pct}
                        onChange={(e) => {
                          const updated = { ...simAssumptions, response_rate_pct: Number(e.target.value) };
                          setSimAssumptions(updated);
                          queryEconomicsSimulation(audienceData?.total_matching ?? 50, formData.per_customer_cost_inr, updated, formData.total_budget_inr);
                        }}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-[#172033] mb-1">
                        <span>Average Order Value (AOV)</span>
                        <span className="text-[#2563EB]">₹{simAssumptions.avg_order_value_inr}</span>
                      </div>
                      <input
                        type="range"
                        min="200"
                        max="1500"
                        step="50"
                        value={simAssumptions.avg_order_value_inr}
                        onChange={(e) => {
                          const updated = { ...simAssumptions, avg_order_value_inr: Number(e.target.value) };
                          setSimAssumptions(updated);
                          queryEconomicsSimulation(audienceData?.total_matching ?? 50, formData.per_customer_cost_inr, updated, formData.total_budget_inr);
                        }}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>
                  </div>

                  {/* Simulation Projections */}
                  {economicsData && (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center justify-between">
                        <span>{economicsData.simulation_label}</span>
                        <span>Assumed Rate: {economicsData.assumed_response_rate_pct}%</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-sm">
                          <span className="text-[#64748B] block text-[10px]">Total Incentive Cost</span>
                          <strong className="text-base text-[#DC2626]">
                            ₹{economicsData.total_potential_cost_inr.toLocaleString('en-IN')}
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-sm">
                          <span className="text-[#64748B] block text-[10px]">Projected Retained</span>
                          <strong className="text-base text-[#2563EB]">
                            {economicsData.estimated_saved_count} accounts
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-sm">
                          <span className="text-[#64748B] block text-[10px]">Break-Even Target</span>
                          <strong className="text-base text-[#D97706]">
                            {economicsData.break_even_customers} accounts
                          </strong>
                        </div>
                        <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-sm">
                          <span className="text-[#64748B] block text-[10px]">Projected Net ROI</span>
                          <strong className="text-base text-[#16A34A]">
                            {economicsData.estimated_roi_pct}%
                          </strong>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-[11px] text-[#64748B]">
                        <span className="font-bold text-[#172033] block">Mathematical Assumptions:</span>
                        {economicsData.documented_assumptions?.map((asm: string, i: number) => (
                          <div key={i}>• {asm}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Message Template & Review */}
              {wizardStep === 5 && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Message Subject Line</label>
                    <input
                      type="text"
                      value={formData.message_subject}
                      onChange={(e) => setFormData({ ...formData, message_subject: e.target.value })}
                      className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[#172033] font-semibold">Message Copy Template</label>
                      <span className="text-[10px] text-[#64748B]">
                        Supported tags: {'{{customer_code}}'}, {'{{city}}'}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.message_body}
                      onChange={(e) => setFormData({ ...formData, message_body: e.target.value })}
                      className="w-full rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[#172033] font-mono"
                    />
                  </div>

                  {/* Holdout Control Group & Dry Run Safeguards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div>
                      <div className="flex justify-between font-semibold text-[#172033] mb-1">
                        <span>Holdout Control Group</span>
                        <span className="text-[#2563EB]">{formData.control_group_pct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="5"
                        value={formData.control_group_pct}
                        onChange={(e) => setFormData({ ...formData, control_group_pct: Number(e.target.value) })}
                        className="w-full accent-[#2563EB]"
                      />
                      <span className="text-[10px] text-[#64748B] block mt-1">
                        Reserved holdout audience to isolate incremental retention lift.
                      </span>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#172033]">
                        <input
                          type="checkbox"
                          checked={formData.is_dry_run}
                          onChange={(e) => setFormData({ ...formData, is_dry_run: e.target.checked })}
                          className="w-4 h-4 rounded text-[#2563EB] focus:ring-0"
                        />
                        <span>Safe Dry-Run Execution Mode</span>
                      </label>
                      <span className="text-[10px] text-[#64748B] mt-1">
                        Simulates external delivery and logs telemetry safely without contacting external recipient inboxes.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 rounded-lg bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0] font-semibold text-xs flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0] font-semibold text-xs"
                  >
                    Cancel
                  </button>
                )}

                {wizardStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 font-semibold text-xs shadow-sm flex items-center gap-1"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={creating}
                    onClick={handleCreateCampaign}
                    className="px-5 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 font-semibold text-xs shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{creating ? 'Finalizing Campaign...' : 'Save Retention Campaign'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
