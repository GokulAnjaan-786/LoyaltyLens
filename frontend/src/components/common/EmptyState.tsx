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
  <div className="p-12 text-center rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-3">
    <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] mx-auto shadow-subtle">
      <Icon className="w-6 h-6 text-[#2563EB]" />
    </div>
    <h3 className="text-base font-bold text-[#172033] tracking-tight">{title}</h3>
    <p className="text-[#64748B] text-xs max-w-md mx-auto leading-relaxed">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="mt-3 inline-flex items-center px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all active:scale-95"
      >
        {actionText}
      </button>
    )}
  </div>
);
