import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = FolderOpen,
}) => (
  <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-3">
    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mx-auto">
      <Icon className="w-6 h-6 text-slate-400" />
    </div>
    <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
    <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="mt-3 inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
      >
        {actionText}
      </button>
    )}
  </div>
);
