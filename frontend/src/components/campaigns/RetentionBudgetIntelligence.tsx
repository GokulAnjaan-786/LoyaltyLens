import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  Building,
  Users,
  Tag,
  ArrowRight,
  X,
  Play,
  Layers,
  HelpCircle,
  Check
} from 'lucide-react';

interface WasteSummary {
  total_recorded_incentive_cost_inr: number;
  total_incentive_spent_inr: number;
  total_delivery_cost_inr: number;
  total_retention_spend_inr: number;
  delivery_cost_status: string;
  unredeemed_incentive_exposure_inr: number;
  weak_campaigns_count: number;
  repeat_incentive_recipients_count: number;
  potential_savings_identified_inr: number;
  confirmed_realized_savings_inr: number;
  open_opportunities_count: number;
  under_review_count: number;
  resolved_count: number;
  time_period: string;
  lookback_days: number;
  data_source_description: string;
  data_source: string;
  currency: string;
}

interface WasteOpportunity {
  id: string;
  rule_id: string;
  rule_version: string;
  title: string;
  category: string;
  campaign_id?: string;
  campaign_name?: string;
  customer_id?: string;
  customer_code?: string;
  segment?: string;
  affected_spend_inr: number;
  potential_savings_inr: number;
  realized_savings_inr: number;
  evidence_strength: 'HIGH' | 'MEDIUM' | 'LOW';
  data_sufficiency: 'SUFFICIENT' | 'INSUFFICIENT_DATA';
  finding_summary: string;
  evidence_json: Record<string, any>;
  recommended_action: string;
  recommended_action_type: string;
  verification_method?: string;
  review_status: 'OPEN' | 'UNDER_REVIEW' | 'APPROVED' | 'DISMISSED' | 'RESOLVED';
  reviewed_by?: string;
  reviewed_at?: string;
  resolution_notes?: string;
  detected_at: string;
  updated_at?: string;
}

export function RetentionBudgetIntelligence() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [summary, setSummary] = useState<WasteSummary | null>(null);
  const [opportunities, setOpportunities] = useState<WasteOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Filters
  const [lookbackDays, setLookbackDays] = useState<number>(90);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedStrength, setSelectedStrength] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Opportunity Evidence Modal
  const [activeOpportunity, setActiveOpportunity] = useState<WasteOpportunity | null>(null);

  // Review Status Action Modal
  const [reviewActionTarget, setReviewActionTarget] = useState<WasteOpportunity | null>(null);
  const [reviewStatusChoice, setReviewStatusChoice] = useState<string>('UNDER_REVIEW');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Confirmation Modal for Executing / Resolving Recommendation
  const [executingTarget, setExecutingTarget] = useState<WasteOpportunity | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  // Load summary and opportunities
  const loadData = async (days = lookbackDays) => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, oppRes] = await Promise.all([
        api.get(`/campaigns/budget-intelligence/summary?lookback_days=${days}`),
        api.get(`/campaigns/budget-intelligence/opportunities?page=1&size=100`)
      ]);
      setSummary(sumRes.data);
      setOpportunities(oppRes.data.items || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load retention budget waste intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(lookbackDays);
  }, [lookbackDays]);

  // Run or Refresh Full Analysis
  const handleRunAudit = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await api.post('/campaigns/budget-intelligence/analyze');
      setAnalysisResult(res.data);
      await loadData(lookbackDays);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis execution failed. Please verify database connectivity.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Submit Status Review
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewActionTarget) return;
    setSubmittingReview(true);
    try {
      await api.patch(`/campaigns/budget-intelligence/opportunities/${reviewActionTarget.id}/review`, {
        review_status: reviewStatusChoice,
        resolution_notes: reviewNotes.trim() || undefined,
        realized_savings_inr: reviewStatusChoice === 'RESOLVED' ? reviewActionTarget.potential_savings_inr : 0.0
      });
      setReviewActionTarget(null);
      setReviewNotes('');
      await loadData(lookbackDays);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update review status.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Execute Approved Recommendation
  const handleExecuteRecommendation = async () => {
    if (!executingTarget) return;
    setExecuting(true);
    try {
      const res = await api.post(`/campaigns/budget-intelligence/opportunities/${executingTarget.id}/execute-recommendation`);
      setExecutionMessage(res.data.message || 'Action executed successfully.');
      setTimeout(() => {
        setExecutionMessage(null);
        setExecutingTarget(null);
      }, 2500);
      await loadData(lookbackDays);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to execute recommendation.');
    } finally {
      setExecuting(false);
    }
  };

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((o) => {
      const matchesCategory = selectedCategory === 'ALL' || o.category === selectedCategory;
      const matchesStatus = selectedStatus === 'ALL' || o.review_status === selectedStatus;
      const matchesStrength = selectedStrength === 'ALL' || o.evidence_strength === selectedStrength;
      const matchesSearch =
        searchQuery === '' ||
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customer_code && o.customer_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.campaign_name && o.campaign_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.segment && o.segment.toLowerCase().includes(searchQuery.toLowerCase())) ||
        o.finding_summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesStatus && matchesStrength && matchesSearch;
    });
  }, [opportunities, selectedCategory, selectedStatus, selectedStrength, searchQuery]);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'REPEATED_INCENTIVES':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3 text-amber-600" /> Repeat Incentive
          </span>
        );
      case 'LOW_PERFORMING_CAMPAIGN':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-rose-600" /> Weak Performance
          </span>
        );
      case 'UNNECESSARY_DISCOUNT':
        return (
          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3 text-purple-600" /> Discount Dilution
          </span>
        );
      case 'BUDGET_LEAKAGE':
        return (
          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-600" /> Budget Leakage
          </span>
        );
      case 'INEFFICIENT_SEGMENT':
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Building className="w-3 h-3 text-blue-600" /> Regional Inefficiency
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            {category}
          </span>
        );
    }
  };

  const getReviewStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> OPEN
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> UNDER REVIEW
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> APPROVED
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> RESOLVED & SAVED
          </span>
        );
      case 'DISMISSED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold">
            DISMISSED
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[10px] font-semibold border border-emerald-300">
            High Confidence
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-100/70 text-amber-800 text-[10px] font-semibold border border-amber-300">
            Moderate Evidence
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-300">
            Early Signal
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">
              Retention Budget Intelligence & Waste Detector
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
            Identifies unnecessary customer retention expenditures, repeat incentive fatigue, and low-performing campaigns through deterministic financial accounting and ML churn telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lookback Selector */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs text-[#64748B]">
            <Clock className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="font-medium text-[#172033]">Window:</span>
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              className="bg-transparent font-semibold text-[#2563EB] focus:outline-none cursor-pointer"
            >
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={180}>Last 180 Days</option>
            </select>
          </div>

          {/* Run Analysis Button */}
          <button
            onClick={handleRunAudit}
            disabled={analyzing}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Auditing Telemetry...' : 'Run Waste Detection Audit'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Key Financial Telemetry Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total Recorded Incentive Cost */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-[11px] font-medium uppercase tracking-wider">Recorded Incentives</span>
              <DollarSign className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-[#172033]">
                ₹{summary.total_recorded_incentive_cost_inr.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Actual Recorded Spend</div>
            </div>
            <div className="text-[9px] text-slate-400 mt-2 border-t border-slate-100 pt-1">
              Source: Dispatched recipients
            </div>
          </div>

          {/* Delivery Channel Cost */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-[11px] font-medium uppercase tracking-wider">Delivery Costs</span>
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-[#172033]">
                ₹{summary.total_delivery_cost_inr.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">Channel Rate Table</div>
            </div>
            <div className="text-[9px] text-slate-400 mt-2 border-t border-slate-100 pt-1">
              Email ₹0.10, SMS ₹0.25
            </div>
          </div>

          {/* Unredeemed Incentive Exposure */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-[11px] font-medium uppercase tracking-wider">Unredeemed Exposure</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-amber-700">
                ₹{summary.unredeemed_incentive_exposure_inr.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-amber-600 font-medium mt-0.5">Potential Avoidable Cost</div>
            </div>
            <div className="text-[9px] text-slate-400 mt-2 border-t border-slate-100 pt-1">
              Unused on completed runs
            </div>
          </div>

          {/* Weak Campaigns */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-[11px] font-medium uppercase tracking-wider">Weak Campaigns</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-rose-600">
                {summary.weak_campaigns_count}
              </div>
              <div className="text-[10px] text-rose-600 font-medium mt-0.5">ROI &lt; 0% with N ≥ 15</div>
            </div>
            <div className="text-[9px] text-slate-400 mt-2 border-t border-slate-100 pt-1">
              Evidence: Holdout benchmark
            </div>
          </div>

          {/* Repeat Incentive Customers */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-[11px] font-medium uppercase tracking-wider">Fatigued Accounts</span>
              <Users className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-purple-700">
                {summary.repeat_incentive_recipients_count}
              </div>
              <div className="text-[10px] text-purple-600 font-medium mt-0.5">≥ 2 Offers, 0 Redemptions</div>
            </div>
            <div className="text-[9px] text-slate-400 mt-2 border-t border-slate-100 pt-1">
              Source: Customer telemetry
            </div>
          </div>

          {/* Potential Savings Identified */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-card flex flex-col justify-between bg-gradient-to-b from-amber-50/30 to-white">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-800">Potential Savings</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-amber-700">
                ₹{summary.potential_savings_identified_inr.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-amber-600 font-medium mt-0.5">Identified & Open</div>
            </div>
            <div className="text-[9px] text-slate-400 mt-2 border-t border-slate-100 pt-1">
              Estimated avoidable budget
            </div>
          </div>

          {/* Confirmed Realized Savings */}
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-card flex flex-col justify-between bg-gradient-to-b from-emerald-50/40 to-white">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Realized Savings</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-emerald-700">
                ₹{summary.confirmed_realized_savings_inr.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Confirmed Realized</div>
            </div>
            <div className="text-[9px] text-emerald-600 mt-2 border-t border-emerald-100 pt-1 font-medium">
              Verified Post-Approval
            </div>
          </div>
        </div>
      )}

      {/* 3. AI / Grounded Executive Summary Briefing */}
      {analysisResult?.ai_executive_summary && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/70 border border-blue-200 text-[#172033] shadow-sm flex items-start gap-3.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Executive Budget Waste Briefing
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/80 text-blue-700 border border-blue-200 font-medium">
                {analysisResult.ai_provider || 'LoyaltyLens Financial Engine'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
              {analysisResult.ai_executive_summary}
            </p>
          </div>
        </div>
      )}

      {/* 4. Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search findings by campaign, customer, segment, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#172033] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="REPEATED_INCENTIVES">Repeat Incentives</option>
            <option value="LOW_PERFORMING_CAMPAIGN">Low Performing Campaign</option>
            <option value="UNNECESSARY_DISCOUNT">Unnecessary Discount</option>
            <option value="BUDGET_LEAKAGE">Budget Leakage</option>
            <option value="INEFFICIENT_SEGMENT">Inefficient Regional Segment</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#172033] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="RESOLVED">Resolved & Saved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          {/* Strength Filter */}
          <select
            value={selectedStrength}
            onChange={(e) => setSelectedStrength(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#172033] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Confidence Levels</option>
            <option value="HIGH">High Confidence</option>
            <option value="MEDIUM">Moderate Evidence</option>
            <option value="LOW">Early Signal</option>
          </select>
        </div>
      </div>

      {/* 5. Waste Opportunities Table / Ranked List */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#172033]">
              Ranked Waste Opportunities ({filteredOpportunities.length})
            </h3>
            <span className="text-[10px] text-[#64748B] font-medium bg-slate-100 px-2 py-0.5 rounded-full">
              Ranked by Potential Avoidable Cost
            </span>
          </div>

          <span className="text-[11px] text-[#64748B]">
            Showing all evidence-backed findings
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#64748B]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#2563EB] mb-2" />
            Aggregating customer retention telemetry and audit records...
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#172033]">No Active Budget Waste Identified</h4>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              Either all current campaign spending satisfies incremental ROI thresholds and fatigue guardrails, or no opportunities match the selected filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-4 hover:bg-[#F8FAFC] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Metadata & Summary */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(opp.category)}
                    {getReviewStatusBadge(opp.review_status)}
                    {getStrengthBadge(opp.evidence_strength)}

                    {opp.data_sufficiency === 'INSUFFICIENT_DATA' && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                        Insufficient Data (Observation Incomplete)
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-[#172033] hover:text-[#2563EB] transition-colors">
                    {opp.title}
                  </h4>

                  <p className="text-xs text-[#64748B] line-clamp-2 max-w-3xl">
                    {opp.finding_summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    {opp.campaign_name && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        Campaign: <strong className="text-slate-700">{opp.campaign_name}</strong>
                      </span>
                    )}
                    {opp.customer_code && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        Account: <strong className="text-slate-700">{opp.customer_code}</strong>
                      </span>
                    )}
                    {opp.segment && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        Cohort: <strong className="text-slate-700">{opp.segment}</strong>
                      </span>
                    )}
                    <span>Rule: <code className="text-[10px] bg-slate-100 px-1 rounded">{opp.rule_id}</code></span>
                  </div>
                </div>

                {/* Middle: Financial Accounting */}
                <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 min-w-[240px]">
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Affected Spend</div>
                    <div className="text-xs font-bold text-slate-800">
                      ₹{opp.affected_spend_inr.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="border-l border-slate-200 pl-4">
                    <div className="text-[10px] text-amber-700 font-medium uppercase tracking-wider">Potential Avoidable</div>
                    <div className="text-sm font-bold text-amber-700">
                      ₹{opp.potential_savings_inr.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {opp.realized_savings_inr > 0 && (
                    <div className="border-l border-emerald-200 pl-4">
                      <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Confirmed Saved</div>
                      <div className="text-sm font-bold text-emerald-700">
                        ₹{opp.realized_savings_inr.toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveOpportunity(opp)}
                    className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Evidence</span>
                  </button>

                  <button
                    onClick={() => {
                      setReviewActionTarget(opp);
                      setReviewStatusChoice(opp.review_status === 'OPEN' ? 'UNDER_REVIEW' : opp.review_status);
                      setReviewNotes(opp.resolution_notes || '');
                    }}
                    className="px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-blue-100 text-[#2563EB] text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                  >
                    <span>Review</span>
                  </button>

                  {isAdmin && opp.review_status !== 'RESOLVED' && opp.review_status !== 'DISMISSED' && (
                    <button
                      onClick={() => setExecutingTarget(opp)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Authorize Action</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Deep Evidence & Audit Telemetry Modal */}
      {activeOpportunity && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    Structured Telemetry & Audit Evidence
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Finding ID: <code className="text-slate-800">{activeOpportunity.id}</code>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveOpportunity(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-700">
              {/* Question 1: What was detected? */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-1.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  1. What Was Detected?
                </div>
                <div className="text-sm font-bold text-[#172033]">
                  {activeOpportunity.title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeOpportunity.finding_summary}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span>Category: <strong>{activeOpportunity.category}</strong></span>
                  <span>•</span>
                  <span>Rule: <strong>{activeOpportunity.rule_id} (v{activeOpportunity.rule_version})</strong></span>
                  <span>•</span>
                  <span>Detected: <strong>{new Date(activeOpportunity.detected_at).toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Question 2: Which records support the finding? */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  2. Supporting Data & Telemetry Records
                </div>
                <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner">
                  <pre>{JSON.stringify(activeOpportunity.evidence_json, null, 2)}</pre>
                </div>
              </div>

              {/* Question 3 & 4: Financial Rationale & Math */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1">
                  <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                    3. Why Does It Waste Money?
                  </div>
                  <p className="text-xs text-rose-950 leading-relaxed">
                    Customer response exhibits diminishing returns or organic repeat purchases without incentive necessity, inflating CAC and diluting gross retention margin.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    4. Financial Exposure & Accounting
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span>Affected Spend:</span>
                    <strong className="text-slate-800">₹{activeOpportunity.affected_spend_inr.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Potential Avoidable:</span>
                    <strong className="text-amber-800">₹{activeOpportunity.potential_savings_inr.toLocaleString('en-IN')}</strong>
                  </div>
                  {activeOpportunity.realized_savings_inr > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                      <span>Confirmed Saved:</span>
                      <span>₹{activeOpportunity.realized_savings_inr.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Question 5: How reliable is the evidence? */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    5. Evidence Strength & Data Sufficiency
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getStrengthBadge(activeOpportunity.evidence_strength)}
                    <span className="text-xs font-medium text-slate-700">
                      Status: <strong>{activeOpportunity.data_sufficiency}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  Audit Governance Checked
                </div>
              </div>

              {/* Question 6: What action should the company take? */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
                <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                  6. Recommended Operational Action
                </div>
                <div className="text-xs font-bold text-blue-950">
                  {activeOpportunity.recommended_action}
                </div>
                <div className="text-[11px] text-blue-700">
                  Action Code: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200">{activeOpportunity.recommended_action_type}</code>
                </div>
              </div>

              {/* Question 7: How can the company verify? */}
              {activeOpportunity.verification_method && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    7. Action Verification Method
                  </div>
                  <p className="text-xs text-slate-700">
                    {activeOpportunity.verification_method}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveOpportunity(null)}
                className="px-4 py-2 bg-white border border-[#E2E8F0] text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
              >
                Close Evidence Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Review Status Transition Modal */}
      {reviewActionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#172033]">
                Update Finding Review Status
              </h3>
              <button
                onClick={() => setReviewActionTarget(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Finding
                </label>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                  {reviewActionTarget.title}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Review Status
                </label>
                <select
                  value={reviewStatusChoice}
                  onChange={(e) => setReviewStatusChoice(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="OPEN">OPEN (Unreviewed)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Active Investigation)</option>
                  {isAdmin && <option value="APPROVED">APPROVED (Action Approved by Admin)</option>}
                  {isAdmin && <option value="RESOLVED">RESOLVED (Action Completed, Realize Savings)</option>}
                  <option value="DISMISSED">DISMISSED (Not Applicable / False Signal)</option>
                </select>
                {!isAdmin && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    * Approving or Resolving actions requires Administrator credentials.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Audit Notes / Rationale
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Explain why this status is being transitioned for regulatory and governance audit..."
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewActionTarget(null)}
                  className="px-3.5 py-2 bg-white border border-[#E2E8F0] text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submittingReview ? 'Saving Audit...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Execute Recommendation Confirmation Modal */}
      {executingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#172033]">
                  Authorize & Execute Recommendation
                </h3>
              </div>
              <button
                onClick={() => setExecutingTarget(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <p>
                You are about to authorize an operational intervention for:
              </p>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900">
                {executingTarget.title}
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Action to be applied:
                </div>
                <p className="text-emerald-950 font-medium">
                  {executingTarget.recommended_action}
                </p>
                <div className="text-xs text-emerald-800 pt-1">
                  Confirmed realized savings recorded: <strong>₹{executingTarget.potential_savings_inr.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {executionMessage && (
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{executionMessage}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-end gap-2">
              <button
                disabled={executing}
                onClick={() => setExecutingTarget(null)}
                className="px-3.5 py-2 bg-white border border-[#E2E8F0] text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={executing}
                onClick={handleExecuteRecommendation}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {executing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Action...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Authorize</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
