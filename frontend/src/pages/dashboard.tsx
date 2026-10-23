import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { CardSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import { KpiCard } from '@/components/common/KpiCard';
import { RiskBadge } from '@/components/common/RiskBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { safeArray, safeNumber, formatPct } from '@/lib/safeData';
import type { CityData } from '@/components/common/MapComponent';
import {
  Users,
  AlertTriangle,
  Activity,
  ShieldCheck,
  TrendingUp,
  MapPin,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Sparkles,
  PieChart as PieIcon,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const MapComponent = dynamic(() => import('@/components/common/MapComponent'), { ssr: false });

const RISK_CHART_COLORS = ['#16A34A', '#D97706', '#DC2626'];

export default function DashboardPage() {
  const { user, appType } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [locationData, setLocationData] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [appType]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, locRes, custRes] = await Promise.all([
        api.get('/analytics/overview', { params: { app_type: appType } }),
        api.get('/analytics/churn-by-location', { params: { app_type: appType } }),
        api.get('/customers', { params: { app_type: appType, size: 6 } }),
      ]);
      setOverview(ovRes.data || null);
      setLocationData(locRes.data || null);
      setCustomers(safeArray(custRes.data?.items));
    } catch (err: any) {
      console.error('Failed to load dashboard telemetry:', err);
      setError(err.response?.data?.detail || 'Failed to load live dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const totalCustomers = safeNumber(overview?.total_customers, 0);
  const highRiskCount = safeNumber(overview?.high_risk_count, 0);
  const medRiskCount = safeNumber(overview?.medium_risk_count, 0);
  const lowRiskCount = safeNumber(overview?.low_risk_count, 0);
  const avgChurnProb = safeNumber(overview?.avg_churn_probability, 0);
  const savedCount = safeNumber(locationData?.total_opportunity_save_count, 0);

  // Retention rate calculation
  const retentionRatePct = totalCustomers > 0
    ? (((totalCustomers - highRiskCount) / totalCustomers) * 100).toFixed(1)
    : '0.0';

  // Risk Distribution Data for Donut Chart
  const riskPieData = totalCustomers > 0
    ? [
        { name: 'Low Risk', value: lowRiskCount },
        { name: 'Medium Risk', value: medRiskCount },
        { name: 'High Risk', value: highRiskCount },
      ]
    : [];

  // Locations array safely extracted
  const locationsList = safeArray<CityData>(locationData?.locations);

  // Top Churn Factors aggregated from location risk telemetry
  const churnFactorsMap: Record<string, number> = {};
  locationsList.forEach((loc: any) => {
    if (loc?.top_reasons && typeof loc.top_reasons === 'object') {
      Object.entries(loc.top_reasons).forEach(([reason, count]) => {
        churnFactorsMap[reason] = (churnFactorsMap[reason] || 0) + (typeof count === 'number' ? count : 1);
      });
    }
  });

  const topChurnFactors = Object.entries(churnFactorsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([factor, count]) => ({ factor, count }));

  // Churn trend / trajectory points based on actual risk tiers
  const riskDistributionBarData = locationsList.slice(0, 6).map((l: any) => ({
    city: l.city || 'Metro',
    churn_rate: safeNumber(l.churn_percentage ?? l.churn_rate_pct, 0),
    total: safeNumber(l.total_customers, 0),
    vulnerable: safeNumber(l.churn_count ?? l.high_risk_customers, 0),
  }));

  return (
    <AppLayout title="Dashboard" subtitle="Customer Intelligence Overview">
      <div className="space-y-6">
        {/* Executive Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
          <div>
            <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
              Customer Intelligence Overview
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              Understand customer behaviour, identify churn risks, and take action to improve retention.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] shadow-subtle text-xs font-semibold text-[#172033]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span>Live Production Data</span>
            </div>
            <Link
              href="/ai-insights"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 font-semibold text-xs transition-all shadow-subtle active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Action Brief</span>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs font-medium shadow-subtle">
            <span>{error}</span>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1 bg-[#DC2626] text-white rounded-md text-xs font-semibold hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI CARDS (Phase 5 Required: Total, High, Med, Low, Avg Churn Prob, Retention Rate, Customers Saved) */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard
              title="Total Customers"
              value={totalCustomers}
              subtitle="Active Org Accounts"
              icon={Users}
              variant="blue"
            />
            <KpiCard
              title="High-Risk"
              value={highRiskCount}
              subtitle="Require Win-Back"
              icon={AlertTriangle}
              variant="danger"
            />
            <KpiCard
              title="Medium-Risk"
              value={medRiskCount}
              subtitle="Early Friction"
              icon={Activity}
              variant="warning"
            />
            <KpiCard
              title="Low-Risk"
              value={lowRiskCount}
              subtitle="Healthy & Active"
              icon={ShieldCheck}
              variant="success"
            />
            <KpiCard
              title="Avg Churn Prob"
              value={`${(avgChurnProb * 100).toFixed(1)}%`}
              subtitle="ML Risk Predictor"
              icon={TrendingUp}
              variant="default"
            />
            <KpiCard
              title="Retention Rate"
              value={`${retentionRatePct}%`}
              subtitle={savedCount > 0 ? `${savedCount} Rescuable` : 'Current Cohort'}
              icon={CheckCircle2}
              variant="success"
            />
          </div>
        )}

        {/* SECTION 1 & 2: Customer Risk Distribution & Regional Risk Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section 1: Customer Risk Distribution (Donut Chart) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-[#2563EB]" />
                  Customer Risk Distribution
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Multi-factor categorization across low, medium, and high churn probability.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                LIVE COHORT
              </span>
            </div>

            {totalCustomers === 0 ? (
              <div className="py-16 text-center text-xs text-[#64748B]">
                No customer records available to compute risk distribution.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {riskPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_CHART_COLORS[index % RISK_CHART_COLORS.length]} />
                      ))}
                    </Pie>
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
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => <span className="text-xs text-[#172033] font-medium">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Section 2: Regional Churn Rate Breakdown */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0D9488]" />
                  Churn Risk by Metro Region
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Actual churn percentage across major Indian operations.
                </p>
              </div>
              {locationData?.highest_churn_city && (
                <span className="text-[11px] font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Critical: {locationData.highest_churn_city}
                </span>
              )}
            </div>

            {riskDistributionBarData.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#64748B]">
                No regional location analytics available.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskDistributionBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="city" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        color: '#172033',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val}%`, 'Churn Rate']}
                    />
                    <Bar dataKey="churn_rate" fill="#2563EB" radius={[4, 4, 0, 0]} name="Churn Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Top Churn Factors */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
                Top Churn Factors
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Primary friction triggers identified across active user behavioral logs.
              </p>
            </div>
            <Link
              href="/retention"
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>View Retention Playbooks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {topChurnFactors.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              No acute churn friction points recorded for this cohort.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topChurnFactors.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3 hover:border-slate-300 transition-colors"
                >
                  <span className="w-6 h-6 rounded-md bg-[#FEE2E2] text-[#DC2626] font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#172033] leading-snug">{item.factor}</h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Affecting {item.count} regional accounts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: Churn by Location (Geo Map) */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0D9488]" />
                Indian Cities Geo-Spatial Churn Distribution
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Interactive spatial density and risk clustering across Indian operating cities.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" /> Low Risk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" /> Med Risk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" /> High Risk
              </span>
            </div>
          </div>

          {locationsList.length > 0 ? (
            <MapComponent cities={locationsList} height="400px" />
          ) : (
            <div className="py-16 text-center text-xs text-[#64748B]">
              No location coordinate data available for current accounts.
            </div>
          )}
        </div>

        {/* SECTION 5: Priority Customers Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                Priority Customers Requiring Intervention
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Accounts exhibiting high ML churn probability and critical score levels.
              </p>
            </div>
            <Link
              href="/customers"
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>View All Customers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {customers.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#64748B]">
              No customer profiles found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-5 py-3.5">Customer Code</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Plan Tier</th>
                    <th className="px-5 py-3.5">Activity Days</th>
                    <th className="px-5 py-3.5">Churn Probability</th>
                    <th className="px-5 py-3.5">Risk Score</th>
                    <th className="px-5 py-3.5">Risk Severity</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#172033]">
                        {c.customer_code}
                      </td>
                      <td className="px-5 py-3.5 text-[#64748B] font-medium">{c.city || 'N/A'}</td>
                      <td className="px-5 py-3.5 text-[#64748B] font-medium">{c.subscription_type || 'Free'}</td>
                      <td className="px-5 py-3.5 text-[#172033] font-mono">{c.login_days || 0} days</td>
                      <td className="px-5 py-3.5 font-bold text-[#172033]">
                        {(safeNumber(c.churn_probability, 0) * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#172033]">
                        {c.risk_score} <span className="text-[#64748B] font-normal">/ 100</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <RiskBadge level={c.risk_level} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/customers/${c.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 font-semibold text-xs transition-colors border border-[#BFDBFE]"
                        >
                          <span>Profile 360</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
