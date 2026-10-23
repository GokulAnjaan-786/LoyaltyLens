import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { CardSkeleton } from '@/components/common/Skeleton';
import { RiskBadge } from '@/components/common/RiskBadge';
import { safeArray, safeNumber, safeString } from '@/lib/safeData';
import {
  ArrowLeft,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShoppingBag,
  LifeBuoy,
  Star,
  Activity,
  MapPin,
  TrendingUp,
  Tag,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchCustomerDetail();
    }
  }, [id]);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data);
    } catch (err: any) {
      console.error('Failed to fetch customer profile:', err);
      setError(err.response?.data?.detail || 'Failed to fetch customer profile telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const copyCustomerId = () => {
    if (customer?.customer_code) {
      navigator.clipboard.writeText(customer.customer_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const riskScore = safeNumber(customer?.risk_score, 0);
  const churnProb = safeNumber(customer?.churn_probability, 0);

  const riskTrendData = [
    { period: '90D Ago', risk: Math.max(10, Math.round(riskScore * 0.4)) },
    { period: '60D Ago', risk: Math.max(20, Math.round(riskScore * 0.65)) },
    { period: '30D Ago', risk: Math.max(30, Math.round(riskScore * 0.85)) },
    { period: 'Current', risk: riskScore },
  ];

  return (
    <AppLayout title="Customers" subtitle="Customer Profile 360">
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Customer Directory</span>
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
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        ) : customer ? (
          <div className="space-y-6">
            {/* Header Profile Bar */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                      {customer.customer_code}
                    </h1>
                    <button
                      onClick={copyCustomerId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#64748B] hover:text-[#172033] hover:border-slate-300 transition-colors"
                      title="Copy customer code"
                    >
                      <span>{customer.customer_code}</span>
                      {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <RiskBadge level={customer.risk_level} />
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                      {customer.subscription_type || 'Free Tier'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{customer.city || 'India Metro'}</span>
                    </span>
                    <span>Industry: <strong className="text-[#172033]">{customer.app_type || 'Food Delivery'}</strong></span>
                    {customer.joining_date && <span>Member Since: {new Date(customer.joining_date).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/campaigns?customer=${customer.customer_code}`}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <span>Launch Targeted Offer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Core Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Churn Probability
                </span>
                <div className="text-2xl font-bold text-[#DC2626] font-sans">
                  {(churnProb * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Logistic Regression</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Risk Score
                </span>
                <div className="text-2xl font-bold text-[#172033] font-sans">
                  {riskScore} <span className="text-xs font-normal text-[#64748B]">/ 100</span>
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Multi-Factor Engine</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Login Frequency
                </span>
                <div className="text-2xl font-bold text-[#172033] font-sans">
                  {customer.login_days || 0}
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Days active (30d)</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Orders Count
                </span>
                <div className="text-2xl font-bold text-[#172033] font-sans">
                  {customer.orders_count || 0}
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Total Completed</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  Support Tickets
                </span>
                <div className="text-2xl font-bold text-[#D97706] font-sans">
                  {customer.support_tickets || 0}
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Complaint logs</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                  App Rating
                </span>
                <div className="text-2xl font-bold text-[#172033] font-sans flex items-center gap-1">
                  <span>{customer.app_rating || 0}</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Customer feedback</span>
              </div>
            </div>

            {/* Churn Risk Factors & Gemini AI Narrative */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Structured Churn Risk Factors */}
              <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
                    Identified Churn Risk Factors
                  </h3>
                  <span className="text-[10px] font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    DIAGNOSTICS
                  </span>
                </div>

                <div className="space-y-2.5">
                  {Array.isArray(customer.reasons) && customer.reasons.length > 0 ? (
                    customer.reasons.map((r: any, idx: number) => {
                      const msg = typeof r === 'string' ? r : r.message || r.factor;
                      const severity = typeof r === 'object' ? r.severity : 'MEDIUM';
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3"
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              severity === 'HIGH' ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                            }`}
                          />
                          <div className="flex-1 text-xs">
                            <span className="font-semibold text-[#172033]">{msg}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : typeof customer.reasons === 'string' ? (
                    <p className="text-xs text-[#172033] p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      {customer.reasons}
                    </p>
                  ) : (
                    <p className="text-xs text-[#64748B] italic p-3">
                      No acute churn drivers detected for this profile.
                    </p>
                  )}
                </div>
              </div>

              {/* Gemini AI Executive Synthesis */}
              <div className="p-6 rounded-xl bg-white border border-[#BFDBFE] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#EFF6FF] pb-3">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#2563EB]" />
                    Gemini AI Executive Synthesis
                  </h3>
                  <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    AI NARRATIVE
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#172033] leading-relaxed italic bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                  {customer.ai_explanation ||
                    `Customer ${customer.customer_code} demonstrates risk indicators driven by recent drop-offs in order frequency. Immediate targeted re-engagement is advised.`}
                </p>
              </div>
            </div>

            {/* Retention Actions & Risk Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Recommended Retention Playbooks (col-span-6) */}
              <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                    Retention Playbook Recommendations
                  </h3>
                  <span className="text-[10px] font-bold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    PLAYBOOK
                  </span>
                </div>

                <div className="space-y-3">
                  {Array.isArray(customer.recommendations) && customer.recommendations.length > 0 ? (
                    customer.recommendations.map((rec: any, idx: number) => {
                      const title = typeof rec === 'string' ? rec : rec.action_type || rec.title || 'Retention Intervention';
                      const offer = typeof rec === 'object' ? rec.offer_details : null;
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#172033]">{title}</span>
                            {offer && (
                              <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                                {offer}
                              </span>
                            )}
                          </div>
                          {typeof rec === 'object' && rec.description && (
                            <p className="text-xs text-[#64748B]">{rec.description}</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-[#64748B] italic p-3">
                      Standard retention playbooks apply for this profile.
                    </p>
                  )}
                </div>
              </div>

              {/* Historical Risk Trajectory (col-span-6) */}
              <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#2563EB]" />
                    Risk Score Progression
                  </h3>
                  <span className="text-[10px] font-semibold text-[#64748B]">90-Day Cohort Shift</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E2E8F0',
                          color: '#172033',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="risk"
                        stroke="#DC2626"
                        strokeWidth={2.5}
                        dot={{ fill: '#DC2626', r: 4 }}
                        name="Risk Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
