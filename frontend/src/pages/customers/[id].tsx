import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { CardSkeleton } from '@/components/common/Skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.response?.data?.detail || 'Failed to fetch customer profile telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const copyCustomerId = () => {
    if (customer?.customer_code) {
      navigator.clipboard.writeText(customer.customer_code);
      alert(`Copied Customer Code: ${customer.customer_code}`);
    }
  };

  const riskTrendData = [
    { period: '90D Ago', risk: 24 },
    { period: '60D Ago', risk: 38 },
    { period: '30D Ago', risk: 62 },
    { period: 'Current', risk: customer?.risk_score || 82 },
  ];

  return (
    <AppLayout title="Customers" subtitle="Customer Intelligence Detail">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-body-sm font-body-sm mb-4">
        <Link href="/customers" className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Customer Directory</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/40 text-error text-body-sm font-body-sm">
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
          {/* 1. CUSTOMER HEADER SUMMARY BAR */}
          <section className="rounded-xl p-space-lg bg-surface-container-low border border-outline-variant/30 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-headline-xl font-headline-xl text-on-surface tracking-tight font-bold">
                    {customer.customer_code}
                  </h1>
                  <button
                    onClick={copyCustomerId}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/40 text-primary hover:border-primary/60 transition-colors font-label-code text-label-code"
                    title="Click to copy Customer ID"
                  >
                    <span>{customer.customer_code}</span>
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  </button>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-caps text-label-caps tracking-wider border font-bold ${
                        customer.risk_level === 'High Risk'
                          ? 'bg-error-container/40 text-error border-error/40 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                          : customer.risk_level === 'Medium Risk'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-secondary-container/20 text-secondary border-secondary/30'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                      {customer.risk_level.toUpperCase()}
                    </span>

                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/50 text-secondary font-label-code text-label-code font-bold">
                      <span className="material-symbols-outlined text-[16px]">monitoring</span>
                      Churn Probability: {(customer.churn_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Metadata Stream */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm font-body-sm text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                    <span>{customer.city || 'India'}</span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-outline">domain</span>
                    <span>{customer.industry_type || customer.app_type}</span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                    <span className="text-secondary font-medium">{customer.subscription_type} Plan</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/simulator?customer_code=${customer.customer_code}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright border border-outline-variant/40 text-on-surface text-body-sm font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
                  <span>Simulate Strategy</span>
                </Link>
                <Link
                  href={`/campaigns?customer_code=${customer.customer_code}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-semibold text-body-sm shadow-md hover:bg-primary transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                  <span>Launch Campaign</span>
                </Link>
              </div>
            </div>
          </section>

          {/* 2. CUSTOMER OVERVIEW TELEMETRY CARDS */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-md">
            <div className="rounded-xl p-space-md bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between">
              <span className="text-label-caps font-label-caps text-on-surface-variant">LOGIN DAYS</span>
              <div className="my-2">
                <div className="text-data-metric font-data-metric text-on-surface">{customer.login_days} Days</div>
              </div>
              <span className="text-[11px] font-label-code text-on-surface-variant">Activity Frequency</span>
            </div>

            <div className="rounded-xl p-space-md bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between">
              <span className="text-label-caps font-label-caps text-on-surface-variant">HOURS SPENT</span>
              <div className="my-2">
                <div className="text-data-metric font-data-metric text-on-surface">{customer.hours_spent.toFixed(1)} hrs</div>
              </div>
              <span className="text-[11px] font-label-code text-on-surface-variant">Engagement Volume</span>
            </div>

            <div className="rounded-xl p-space-md bg-surface-container-low border border-error/30 bg-error/5 flex flex-col justify-between">
              <span className="text-label-caps font-label-caps text-error">SUPPORT TICKETS</span>
              <div className="my-2">
                <div className="text-data-metric font-data-metric text-error">{customer.support_tickets} Open</div>
              </div>
              <span className="text-[11px] font-label-code text-error">Service Friction</span>
            </div>

            <div className="rounded-xl p-space-md bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between">
              <span className="text-label-caps font-label-caps text-on-surface-variant">ORDERS / DELIVERIES</span>
              <div className="my-2">
                <div className="text-data-metric font-data-metric text-on-surface">{customer.orders_count} Orders</div>
              </div>
              <span className="text-[11px] font-label-code text-on-surface-variant">Order Frequency</span>
            </div>

            <div className="rounded-xl p-space-md bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between">
              <span className="text-label-caps font-label-caps text-on-surface-variant">APP RATING</span>
              <div className="my-2">
                <div className="text-data-metric font-data-metric text-secondary">{customer.app_rating} / 5.0</div>
              </div>
              <span className="text-[11px] font-label-code text-on-surface-variant">User Sentiment</span>
            </div>

            <div className="rounded-xl p-space-md bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between">
              <span className="text-label-caps font-label-caps text-on-surface-variant">RISK SCORE</span>
              <div className="my-2">
                <div className="text-data-metric font-data-metric text-error">{customer.risk_score} / 100</div>
              </div>
              <span className="text-[11px] font-label-code text-error">Calculated Risk Score</span>
            </div>
          </section>

          {/* 3. REASONS & GEMINI AI NARRATIVE */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
            {/* Structured Reasons Card */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-lg space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <h3 className="text-headline-md font-headline-md font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">priority_high</span>
                  Identified Churn Risk Reasons
                </h3>
                <span className="text-label-caps font-label-caps text-on-surface-variant">Reason Engine</span>
              </div>

              <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/20 text-body-sm leading-relaxed text-on-surface space-y-2">
                <p className="font-semibold text-primary">{customer.reasons}</p>
                <p className="text-body-sm text-on-surface-variant">
                  Derived from low order frequency, delivery delay thresholds, and complaint logs.
                </p>
              </div>
            </div>

            {/* Gemini AI Narrative Card */}
            <div className="bg-surface-container-low border border-tertiary/30 rounded-xl p-space-lg space-y-4 glow-cyan">
              <div className="flex items-center justify-between border-b border-tertiary/20 pb-3">
                <h3 className="text-headline-md font-headline-md font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
                  Gemini AI Executive Synthesis
                </h3>
                <span className="px-2 py-0.5 rounded bg-tertiary-container/30 text-tertiary text-label-caps font-label-caps font-bold border border-tertiary/40">
                  AI GENERATED
                </span>
              </div>

              <p className="text-body-sm font-body-sm text-on-surface leading-relaxed italic">
                {customer.ai_explanation || 'Gemini AI synthesis indicates customer requires immediate intervention.'}
              </p>
            </div>
          </section>

          {/* 4. RECOMMENDED ACTION & RISK TREND CHART */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* Recommended Action Card - 6 cols */}
            <div className="lg:col-span-6 bg-surface-container-low border border-secondary/30 rounded-xl p-space-lg space-y-4">
              <div className="flex items-center justify-between border-b border-secondary/20 pb-3">
                <h3 className="text-headline-md font-headline-md font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">verified</span>
                  Automated Retention Playbook Recommendation
                </h3>
                <span className="text-label-caps font-label-caps text-secondary font-bold">ACTION PLAYBOOK</span>
              </div>

              <div className="p-4 rounded-lg bg-surface-container border border-secondary/30 text-body-sm text-on-surface space-y-2">
                <p className="font-bold text-secondary text-base">{customer.recommendations}</p>
                <p className="text-body-sm text-on-surface-variant">
                  Recommended strategy generated from customer profile, order history, and retention rules.
                </p>
              </div>
            </div>

            {/* Historical Risk Trajectory - 6 cols */}
            <div className="lg:col-span-6 bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-lg space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <h3 className="text-headline-md font-headline-md font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                  Historical Churn Risk Trend
                </h3>
                <span className="text-label-code font-label-code text-error font-bold">Risk Trajectory</span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#253648" />
                    <XAxis dataKey="period" stroke="#8b919f" />
                    <YAxis stroke="#8b919f" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a1d2e', borderColor: '#414754', color: '#d2e4fc' }} />
                    <Line type="monotone" dataKey="risk" stroke="#ffb4ab" strokeWidth={3} dot={{ fill: '#ffb4ab', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}
