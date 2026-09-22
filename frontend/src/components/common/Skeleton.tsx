import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 animate-pulse space-y-4">
    <div className="h-4 bg-slate-800 rounded w-1/3"></div>
    <div className="h-8 bg-slate-800 rounded w-1/2"></div>
    <div className="h-3 bg-slate-800/60 rounded w-2/3"></div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3 animate-pulse">
    <div className="h-8 bg-slate-800 rounded w-full"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 bg-slate-800/40 rounded w-full"></div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 animate-pulse space-y-4">
    <div className="flex justify-between">
      <div className="h-5 bg-slate-800 rounded w-1/4"></div>
      <div className="h-4 bg-slate-800 rounded w-1/6"></div>
    </div>
    <div className="h-64 bg-slate-800/40 rounded w-full"></div>
  </div>
);
