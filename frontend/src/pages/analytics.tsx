import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { BarChart3, MapPin, PieChart as PieIcon, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
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
  Legend
} from 'recharts';

const MapComponent = dynamic(() => import('@/components/common/MapComponent'), { ssr: false });

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

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
        api.get('/analytics/churn-by-location', { params: { app_type: appType } })
      ]);
      setOverview(ovRes.data);
      setLocationData(locRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const riskPieData = overview ? [
    { name: 'Low Risk', value: overview.low_risk_count },
    { name: 'Medium Risk', value: overview.medium_risk_count },
    { name: 'High Risk', value: overview.high_risk_count },
  ] : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-emerald-400" />
              Advanced Analytics & Geo Intelligence
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Deep dive into customer churn metrics, risk distributions, and spatial analysis across Indian cities.
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400">
            DEMO/SYNTHETIC DATA
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 text-sm">Calculating real-time analytics...</p>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Total Customers</span>
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{overview?.total_customers || 0}</div>
                <p className="text-slate-400 text-xs mt-1">Active customer base</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Avg Churn Probability</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-amber-400">
                  {((overview?.average_churn_probability || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-slate-400 text-xs mt-1">Predicted by Logistic Regression</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>High Risk Cohort</span>
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-3xl font-extrabold text-red-400">{overview?.high_risk_count || 0}</div>
                <p className="text-slate-400 text-xs mt-1">Require immediate retention action</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Top Risk City</span>
                  <MapPin className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-extrabold text-teal-300 truncate">
                  {locationData?.highest_churn_city || 'N/A'}
                </div>
                <p className="text-slate-400 text-xs mt-1">Highest concentration of churn risk</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Distribution Donut */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-emerald-400" />
                    Customer Risk Breakdown
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Categorized by Risk Engine</span>
                </div>
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
                        {riskPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Churn by City Bar Chart */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    High Risk Customers by City
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Major Metros</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(locationData?.cities || []).slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="city" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                      <Bar dataKey="high_risk_customers" fill="#ef4444" name="High Risk" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Indian City Churn Geo Map */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-400" />
                    Indian Cities Churn Map Visualization (Leaflet)
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Interactive spatial clustering of customer volume and risk levels across Indian cities.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Low Risk</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Medium Risk</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> High Risk</span>
                </div>
              </div>

              {locationData?.cities && locationData.cities.length > 0 ? (
                <MapComponent cities={locationData.cities} />
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">No location data available.</div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
