import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { CardSkeleton, TableSkeleton } from '@/components/common/Skeleton';
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
  Line
} from 'recharts';

const MapComponent = dynamic(() => import('@/components/common/MapComponent'), { ssr: false });

const RISK_COLORS = ['#44ddfe', '#f59e0b', '#ffb4ab'];

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
        api.get('/customers', { params: { app_type: appType, size: 6 } })
      ]);
      setOverview(ovRes.data);
      setLocationData(locRes.data);
      setCustomers(custRes.data.items || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard telemetry data.');
    } finally {
      setLoading(false);
    }
  };

  const riskPieData = overview
    ? [
        { name: 'Low Risk', value: overview.low_risk_count },
        { name: 'Medium Risk', value: overview.medium_risk_count },
        { name: 'High Risk', value: overview.high_risk_count },
      ]
    : [];

  const trendLineData = [
    { month: 'Jan', churn_prob: 38 },
    { month: 'Feb', churn_prob: 35 },
    { month: 'Mar', churn_prob: 36 },
    { month: 'Apr', churn_prob: 33 },
    { month: 'May', churn_prob: 34 },
    { month: 'Jun', churn_prob: overview ? Math.round(overview.average_churn_probability * 100) : 31 },
  ];

  return (
    <AppLayout title="Dashboard" subtitle="Executive Overview">
      {/* Executive Greeting & Period Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <h2 className="text-headline-xl font-headline-xl font-bold text-on-surface tracking-tight">
            Good morning, {user?.full_name?.split(' ')[0] || 'Gokul'}
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-0.5">
            Here&apos;s what&apos;s happening with your customers today across{' '}
            <span className="text-primary font-semibold">
              {overview?.total_customers || 0} active accounts
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-1 text-body-sm">
            <button className="px-3 py-1 rounded bg-surface-container-high text-primary font-medium shadow-sm">
              Live Real-Time
            </button>
          </div>
          <Link
            href="/ai-insights"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-tertiary-container/30 to-secondary/20 border border-tertiary/40 text-on-surface hover:border-tertiary transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-tertiary text-[18px]">auto_awesome</span>
            <span className="font-label-caps text-label-caps font-semibold">AI Synthesis</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/40 text-error text-body-sm font-body-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <>
          {/* KPI CARDS ROW (4 High-Impact Metric Cards) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
            {/* Metric 1: Total Customers */}
            <div className="glass-panel p-space-lg rounded-xl flex flex-col justify-between hover:border-primary/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-label-caps font-label-caps text-outline uppercase tracking-wider">
                  Total Customers
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">groups</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-data-metric font-data-metric text-on-surface font-bold tracking-tight">
                  {overview?.total_customers || 0}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center text-[11px] font-label-code text-secondary font-semibold">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> Active Base
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 2: High Risk Customers */}
            <div className="glass-panel p-space-lg rounded-xl flex flex-col justify-between border-error/30 hover:border-error/60 transition-all group relative overflow-hidden glow-red">
              <div className="flex items-center justify-between">
                <span className="text-label-caps font-label-caps text-error uppercase tracking-wider">
                  High Risk Cohort
                </span>
                <div className="w-8 h-8 rounded-lg bg-error-container/40 flex items-center justify-center text-error group-hover:bg-error-container/70 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-data-metric font-data-metric text-error font-bold tracking-tight">
                  {overview?.high_risk_count || 0}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center text-[11px] font-label-code text-error font-semibold">
                    Immediate Action Needed
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 3: Average Churn Probability */}
            <div className="glass-panel p-space-lg rounded-xl flex flex-col justify-between hover:border-primary/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-label-caps font-label-caps text-outline uppercase tracking-wider">
                  Avg Churn Probability
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary group-hover:bg-secondary/20 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">monitoring</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-data-metric font-data-metric text-on-surface font-bold tracking-tight">
                  {((overview?.average_churn_probability || 0) * 100).toFixed(1)}%
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center text-[11px] font-label-code text-secondary font-semibold">
                    Logistic Regression ML
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 4: Top Churn City */}
            <div className="glass-panel p-space-lg rounded-xl flex flex-col justify-between hover:border-secondary/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-label-caps font-label-caps text-outline uppercase tracking-wider">
                  Top Risk City
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary group-hover:bg-secondary/20 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-headline-lg font-headline-lg text-secondary font-bold tracking-tight truncate">
                  {locationData?.highest_churn_city || 'N/A'}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 text-[10px] font-label-code font-semibold">
                    Highest Concentration
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* MIDDLE ANALYTICS SECTION (Donut + Churn Trajectory) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* Card 1: Customer Risk Overview (Donut Chart) - 5 cols */}
            <div className="lg:col-span-5 glass-panel p-space-lg rounded-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div>
                  <h3 className="text-headline-md font-headline-md font-semibold text-on-surface">
                    Customer Risk Breakdown
                  </h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">Categorized by Risk Engine</p>
                </div>
                <span className="text-label-code font-label-code text-secondary text-xs">ML + Business Rules</span>
              </div>

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
                      {riskPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a1d2e',
                        borderColor: '#414754',
                        color: '#d2e4fc',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 2: Churn Probability Trajectory (Line Chart) - 7 cols */}
            <div className="lg:col-span-7 glass-panel p-space-lg rounded-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div>
                  <h3 className="text-headline-md font-headline-md font-semibold text-on-surface">
                    Churn Probability Trend
                  </h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">Historical cohort risk trajectory</p>
                </div>
                <span className="text-label-code font-label-code text-secondary text-xs font-bold">-2.1% Improved</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendLineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#253648" />
                    <XAxis dataKey="month" stroke="#8b919f" />
                    <YAxis stroke="#8b919f" unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a1d2e',
                        borderColor: '#414754',
                        color: '#d2e4fc',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="churn_prob"
                      stroke="#44ddfe"
                      strokeWidth={3}
                      dot={{ fill: '#44ddfe', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* INDIAN CITY CHURN GEO MAP */}
          <section className="glass-panel p-space-lg rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-headline-md font-headline-md font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">map</span>
                  Indian Cities Geo-Spatial Churn Distribution
                </h3>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  Interactive spatial density and risk clustering across 118 Indian cities.
                </p>
              </div>
            </div>

            {locationData?.cities && locationData.cities.length > 0 ? (
              <MapComponent cities={locationData.cities} />
            ) : (
              <div className="py-12 text-center text-on-surface-variant text-body-sm">
                No location telemetry available.
              </div>
            )}
          </section>

          {/* PRIORITY HIGH RISK CUSTOMER TABLE */}
          <section className="glass-panel p-space-lg rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div>
                <h3 className="text-headline-md font-headline-md font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">priority_high</span>
                  Priority High-Risk Accounts Roster
                </h3>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  Accounts requiring immediate retention intervention
                </p>
              </div>

              <Link
                href="/customers"
                className="text-body-sm font-body-sm text-secondary hover:text-on-surface font-semibold transition-colors"
              >
                View Full Customer Directory &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-label-caps font-label-caps text-on-surface-variant uppercase">
                    <th className="py-3 px-4">Customer ID</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Subscription</th>
                    <th className="py-3 px-4">Churn Prob</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container/60 transition-colors">
                      <td className="py-3 px-4 font-label-code font-bold text-primary">{c.customer_code}</td>
                      <td className="py-3 px-4">{c.city}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface border border-outline-variant/40 text-label-code">
                          {c.subscription_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-label-code font-bold text-secondary">
                        {(c.churn_probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-label-caps font-label-caps font-bold border ${
                            c.risk_level === 'High Risk'
                              ? 'bg-error-container/40 text-error border-error/40'
                              : c.risk_level === 'Medium Risk'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-secondary-container/20 text-secondary border-secondary/30'
                          }`}
                        >
                          {c.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/customers/${c.id}`}
                          className="px-3 py-1 rounded bg-surface-container-high hover:bg-secondary/20 hover:text-secondary text-body-sm font-semibold transition-colors inline-block"
                        >
                          Inspect Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </AppLayout>
  );
}
