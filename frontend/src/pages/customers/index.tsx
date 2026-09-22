import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  customer_code: string;
  app_type: string;
  subscription_type: string;
  city: string;
  login_days: number;
  orders_count: number;
  support_tickets: number;
  churn_probability: number;
  risk_score: number;
  risk_level: string;
}

export default function CustomersPage() {
  const { appType } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, [appType, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/customers?app_type=${encodeURIComponent(appType)}&search=${encodeURIComponent(search)}&size=100`
      );
      setCustomers(res.data.items);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (selectedRisk === 'ALL') return true;
    return c.risk_level === selectedRisk;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Search & Filter Header */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer code, city, tier, or region..."
              className="w-full pl-11 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-body-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary font-body-sm"
            />
          </div>

          {/* Risk Level Filter Tabs */}
          <div className="flex items-center space-x-2 bg-surface-container p-1.5 rounded-xl text-body-sm font-semibold text-on-surface-variant">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedRisk(lvl)}
                className={`px-4 py-1.5 rounded-lg transition-all text-body-sm font-semibold ${
                  selectedRisk === lvl
                    ? 'bg-surface-container-high text-secondary border border-secondary/30 shadow-sm'
                    : 'hover:text-on-surface text-on-surface-variant'
                }`}
              >
                {lvl === 'ALL' ? 'All Risks' : `${lvl} Risk`}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-on-surface-variant text-body-sm font-medium space-y-3">
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading Customer Intelligence Database...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-16 text-center text-on-surface-variant text-body-sm font-medium space-y-2">
              <span className="material-symbols-outlined text-[36px] text-outline-variant">person_search</span>
              <p className="text-on-surface font-semibold text-headline-md">No matching customer profiles found</p>
              <p className="text-label-caps text-on-surface-variant">Try adjusting your search criteria or risk severity filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-surface-container-lowest text-on-surface-variant uppercase tracking-wider font-label-caps text-label-caps border-b border-outline-variant/30">
                  <tr>
                    <th className="px-5 py-3.5">Customer Code</th>
                    <th className="px-5 py-3.5">Location / City</th>
                    <th className="px-5 py-3.5">Tier / Plan</th>
                    <th className="px-5 py-3.5">Activity Days</th>
                    <th className="px-5 py-3.5">Support Tickets</th>
                    <th className="px-5 py-3.5">Churn Prob</th>
                    <th className="px-5 py-3.5">Risk Score</th>
                    <th className="px-5 py-3.5">Risk Severity</th>
                    <th className="px-5 py-3.5 text-right">360 View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container/60 transition-colors">
                      <td className="px-5 py-4 font-bold text-on-surface text-body-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        {c.customer_code}
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant font-medium">{c.city}</td>
                      <td className="px-5 py-4 text-on-surface-variant font-medium">{c.subscription_type}</td>
                      <td className="px-5 py-4 text-on-surface font-label-code font-label-code">{c.login_days} days</td>
                      <td className="px-5 py-4 text-on-surface font-label-code font-label-code">{c.support_tickets} tickets</td>
                      <td className="px-5 py-4 font-bold text-data-metric font-data-metric text-on-surface">
                        {(c.churn_probability * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-data-metric font-data-metric text-on-surface">{c.risk_score}</span>
                        <span className="text-on-surface-variant text-label-caps"> / 100</span>
                      </td>
                      <td className="px-5 py-4">
                        {c.risk_level === 'HIGH' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error/15 text-error border border-error/30 font-label-caps text-label-caps font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                            CRITICAL (HIGH)
                          </span>
                        ) : c.risk_level === 'MEDIUM' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-label-caps text-label-caps font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            ELEVATED (MEDIUM)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/30 font-label-caps text-label-caps font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            HEALTHY (LOW)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/customers/${c.id}`}
                          className="inline-flex items-center gap-1 bg-surface-container-high hover:bg-secondary/20 text-secondary hover:text-secondary border border-secondary/30 font-semibold text-body-sm px-3 py-1.5 rounded-lg transition-all active:scale-95"
                        >
                          <span>Profile 360</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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

