import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { KpiCard } from '@/components/common/KpiCard';
import { CardSkeleton } from '@/components/common/Skeleton';
import { safeArray, safeNumber } from '@/lib/safeData';
import type { CityData } from '@/components/common/MapComponent';
import {
  BarChart3,
  MapPin,
  PieChart as PieIcon,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Users,
  Activity,
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
} from 'recharts';

const MapComponent = dynamic(() => import('@/components/common/MapComponent'), { ssr: false });

const RISK_COLORS = ['#16A34A', '#D97706', '#DC2626'];

export default function AnalyticsPage() {
  const { appType } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [locationData, setLocationData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [appType]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, locRes] = await Promise.all([
        api.get('/analytics/overview', { params: { app_type: appType } }),
        api.get('/analytics/churn-by-location', { params: { app_type: appType } }),
      ]);
      setOverview(ovRes.data || null);
      setLocationData(locRes.data || null);
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
      setError(err.response?.data?.detail || 'Failed to load analytics telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const totalCustomers = safeNumber(overview?.total_customers, 0);
  const highRiskCount = safeNumber(overview?.high_risk_count, 0);
  const medRiskCount = safeNumber(overview?.medium_risk_count, 0);
  const lowRiskCount = safeNumber(overview?.low_risk_count, 0);
  const avgChurnProb = safeNumber(overview?.avg_churn_probability, 0);

  const riskPieData = totalCustomers > 0
    ? [
        { name: 'Low Risk', value: lowRiskCount },
        { name: 'Medium Risk', value: medRiskCount },
        { name: 'High Risk', value: highRiskCount },
      ]
    : [];

  // Locations array correctly read from backend response
  const locations = safeArray<CityData>(locationData?.locations);

  // Top metros bar chart data
  const topMetrosBarData = locations.slice(0, 8).map((l: any) => ({
    city: l.city || 'Metro',
    high_risk_customers: safeNumber(l.churn_count ?? l.high_risk_customers, 0),
    total_customers: safeNumber(l.total_customers, 0),
    churn_rate: safeNumber(l.churn_percentage ?? l.churn_rate_pct, 0),
  }));

  const industryMetrics = safeArray(overview?.industry_metrics);

  return (
    <AppLayout title="Analytics" subtitle="Advanced Analytics & Geo Intelligence">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <BarChart3 className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                Advanced Analytics & Geo Intelligence
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
              Deep dive into customer churn metrics, risk distributions, and spatial analysis across Indian operating regions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#172033]">
              Active Industry: <strong className="text-[#2563EB]">{appType}</strong>
            </span>
            <button
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="p-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-[#172033] transition-colors shadow-subtle"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2563EB]' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Total Customers"
                value={totalCustomers}
                subtitle="Active customer base"
                icon={Users}
                variant="blue"
              />
              <KpiCard
                title="Avg Churn Probability"
                value={`${(avgChurnProb * 100).toFixed(1)}%`}
                subtitle="Predicted by Logistic Regression"
                icon={TrendingUp}
                variant="warning"
              />
              <KpiCard
                title="High Risk Cohort"
                value={highRiskCount}
                subtitle="Require immediate win-back"
                icon={ShieldAlert}
                variant="danger"
              />
              <KpiCard
                title="Top Risk City"
                value={locationData?.highest_churn_city || 'N/A'}
                subtitle="Highest risk concentration"
                icon={MapPin}
                variant="default"
              />
            </div>

            {/* Industry Specific Metrics If Present */}
            {industryMetrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {industryMetrics.map((im: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                        {im.label}
                      </span>
                      <div className="text-xl font-bold text-[#172033]">{im.value}</div>
                    </div>
                    {im.delta && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#475569] border border-slate-200">
                        {im.delta}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Distribution Donut */}
              <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-[#2563EB]" />
                    Customer Risk Breakdown
                  </h3>
                  <span className="text-xs text-[#64748B] font-medium">Categorized by Risk Engine</span>
                </div>
                {totalCustomers === 0 ? (
                  <div className="py-16 text-center text-xs text-[#64748B]">No risk data available.</div>
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {riskPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
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

              {/* Churn by City Bar Chart */}
              <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#DC2626]" />
                    High Risk Customers by City
                  </h3>
                  <span className="text-xs text-[#64748B] font-medium">Major Metros</span>
                </div>
                {topMetrosBarData.length === 0 ? (
                  <div className="py-16 text-center text-xs text-[#64748B]">No location data available.</div>
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topMetrosBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="city" stroke="#64748B" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
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
                        <Bar
                          dataKey="high_risk_customers"
                          fill="#DC2626"
                          name="High Risk Users"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Indian City Churn Geo Map */}
            <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#0D9488]" />
                    Indian Cities Churn Map Visualization
                  </h3>
                  <p className="text-[#64748B] text-xs mt-0.5">
                    Spatial clustering of customer volume and risk levels across Indian cities.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-[#64748B]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span> Low Risk
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span> Medium Risk
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span> High Risk
                  </span>
                </div>
              </div>

              {locations.length > 0 ? (
                <MapComponent cities={locations} height="420px" />
              ) : (
                <div className="py-16 text-center text-[#64748B] text-xs">No location telemetry available.</div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
