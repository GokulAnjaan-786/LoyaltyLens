import React from 'react';

interface RiskBadgeProps {
  level: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const normalized = (level || '').toUpperCase();
  const isHigh = normalized.includes('HIGH') || normalized === 'CRITICAL';
  const isMedium = normalized.includes('MED') || normalized.includes('ELEVATED');

  let badgeClasses = 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]';
  let dotColor = 'bg-[#16A34A]';
  let text = 'LOW RISK';

  if (isHigh) {
    badgeClasses = 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
    dotColor = 'bg-[#DC2626] animate-pulse';
    text = 'HIGH RISK';
  } else if (isMedium) {
    badgeClasses = 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';
    dotColor = 'bg-[#D97706]';
    text = 'MEDIUM RISK';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border ${badgeClasses} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />}
      <span>{text}</span>
    </span>
  );
};
