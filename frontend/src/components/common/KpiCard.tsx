import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'blue';
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  variant = 'default',
  className = '',
}) => {
  let iconBg = 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
  let valueColor = 'text-[#172033]';
  let cardBorder = 'border-[#E2E8F0]';

  if (variant === 'danger') {
    iconBg = 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
    valueColor = 'text-[#DC2626]';
    cardBorder = 'border-red-200';
  } else if (variant === 'warning') {
    iconBg = 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';
    valueColor = 'text-[#D97706]';
    cardBorder = 'border-amber-200';
  } else if (variant === 'success') {
    iconBg = 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]';
    valueColor = 'text-[#16A34A]';
    cardBorder = 'border-green-200';
  } else if (variant === 'blue') {
    iconBg = 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
    valueColor = 'text-[#2563EB]';
    cardBorder = 'border-blue-200';
  }

  return (
    <div
      className={`bg-white rounded-xl p-5 border ${cardBorder} shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className={`text-2xl font-bold tracking-tight font-sans ${valueColor}`}>
          {value}
        </div>
        {(subtitle || badge) && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#64748B]">
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-[#475569] border border-slate-200">
                {badge}
              </span>
            )}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
