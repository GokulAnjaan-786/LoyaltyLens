import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { RiskBadge } from '@/components/common/RiskBadge';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { safeArray, safeNumber } from '@/lib/safeData';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Building2,
  MapPin,
  Tag,
} from 'lucide-react';

interface CustomerItem {
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
  industry_type?: string;
}

type SortField = 'customer_code' | 'risk_score' | 'churn_probability' | 'login_days' | 'orders_count';
type SortOrder = 'asc' | 'desc';

export default function CustomersPage() {
  const { appType } = useAuth();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedSubscription, setSelectedSubscription] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [appType, search, page, pageSize]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/customers', {
        params: {
          app_type: appType,
          search: search.trim() || undefined,
          page,
          size: 100, // fetch generous batch for responsive client filtering & sorting
        },
      });
      const items = safeArray<CustomerItem>(res.data?.items);
      setCustomers(items);
      setTotalCount(safeNumber(res.data?.total, items.length));
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      setError(err.response?.data?.detail || 'Failed to fetch customer telemetry roster.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Distinct city list from dataset for location filter
  const distinctCities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.city) set.add(c.city);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Distinct subscription list from dataset
  const distinctSubscriptions = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.subscription_type) set.add(c.subscription_type);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtering
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedRisk !== 'ALL' && c.risk_level !== selectedRisk) return false;
      if (selectedSubscription !== 'ALL' && c.subscription_type !== selectedSubscription) return false;
      if (selectedCity !== 'ALL' && c.city !== selectedCity) return false;
      return true;
    });
  }, [customers, selectedRisk, selectedSubscription, selectedCity]);

  // Sorting
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCustomers, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedCustomers.slice(start, start + pageSize);
  }, [sortedCustomers, page, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <AppLayout title="Customers" subtitle="Customer Risk & Telemetry Roster">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <Users className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                Customer Intelligence Directory
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
              Inspect multi-factor churn probability, ML risk scores, engagement telemetry, and personalized retention interventions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#64748B] bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
              Showing <strong className="text-[#172033]">{sortedCustomers.length}</strong> of {totalCount} Records
            </span>
            <button
              onClick={fetchCustomers}
              disabled={loading}
              className="p-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-[#172033] transition-colors shadow-subtle"
              title="Refresh Customer Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2563EB]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-card space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by customer code, city, tier..."
                className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            {/* Risk Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedRisk}
                onChange={(e) => {
                  setSelectedRisk(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs font-medium rounded-lg border border-[#E2E8F0] px-3 py-2 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>

            {/* Location / City Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs font-medium rounded-lg border border-[#E2E8F0] px-3 py-2 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
              >
                <option value="ALL">All Operating Cities</option>
                {distinctCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Subscription Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedSubscription}
                onChange={(e) => {
                  setSelectedSubscription(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs font-medium rounded-lg border border-[#E2E8F0] px-3 py-2 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
              >
                <option value="ALL">All Plan Tiers</option>
                {distinctSubscriptions.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-card overflow-hidden">
          {loading ? (
            <TableSkeleton rows={8} />
          ) : paginatedCustomers.length === 0 ? (
            <EmptyState
              title="No Matching Customers Found"
              description="Adjust your search query or reset the risk and location filters to see more results."
              actionText="Reset Filters"
              onAction={() => {
                setSearch('');
                setSelectedRisk('ALL');
                setSelectedCity('ALL');
                setSelectedSubscription('ALL');
              }}
              icon={Users}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th
                      onClick={() => toggleSort('customer_code')}
                      className="px-5 py-3.5 cursor-pointer hover:text-[#172033] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Customer Code</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Plan Tier</th>
                    <th
                      onClick={() => toggleSort('login_days')}
                      className="px-5 py-3.5 cursor-pointer hover:text-[#172033] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Activity Days</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('churn_probability')}
                      className="px-5 py-3.5 cursor-pointer hover:text-[#172033] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Churn Prob</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('risk_score')}
                      className="px-5 py-3.5 cursor-pointer hover:text-[#172033] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Risk Score</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5">Risk Severity</th>
                    <th className="px-5 py-3.5 text-right">360 View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paginatedCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#172033]">
                        {c.customer_code}
                      </td>
                      <td className="px-5 py-3.5 text-[#64748B] font-medium">
                        {c.city || 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-[#64748B] font-medium">
                        {c.subscription_type || 'Standard'}
                      </td>
                      <td className="px-5 py-3.5 text-[#172033] font-mono">
                        {c.login_days || 0} days
                      </td>
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 font-semibold text-xs transition-colors border border-[#BFDBFE]"
                        >
                          <span>Profile 360</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {sortedCustomers.length > 0 && (
            <div className="p-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded px-2 py-1 text-xs text-[#172033] focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  Page {page} of {totalPages}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
