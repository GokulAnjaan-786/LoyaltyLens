import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-card animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-3.5 bg-slate-200 rounded w-1/3"></div>
      <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
    </div>
    <div className="h-7 bg-slate-200 rounded w-1/2"></div>
    <div className="h-3 bg-slate-100 rounded w-2/3"></div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full rounded-xl bg-white border border-[#E2E8F0] shadow-card p-4 space-y-3 animate-pulse">
    <div className="h-9 bg-slate-100 rounded w-full"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 bg-slate-50 border border-slate-100 rounded w-full"></div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-card animate-pulse space-y-4">
    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
      <div className="h-5 bg-slate-200 rounded w-1/3"></div>
      <div className="h-4 bg-slate-100 rounded w-1/6"></div>
    </div>
    <div className="h-64 bg-slate-50 rounded-lg w-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);
