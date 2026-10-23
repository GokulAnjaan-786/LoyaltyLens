import type { AIWeeklyBrief, RecommendedActionItem, SuggestedCampaignItem } from '../types/ai';

export function safeArray<T>(val: any, fallback: T[] = []): T[] {
  if (Array.isArray(val)) return val;
  if (val === null || val === undefined) return fallback;
  return fallback;
}

export function safeObject<T extends object>(val: any, fallback: T = {} as T): T {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val;
  return fallback;
}

export function safeString(val: any, fallback: string = ''): string {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return fallback;
  return String(val);
}

export function safeNumber(val: any, fallback: number = 0): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

export function formatPct(val: any, decimals: number = 1): string {
  const num = safeNumber(val, 0);
  return `${num.toFixed(decimals)}%`;
}

export function formatNumber(val: any): string {
  const num = safeNumber(val, 0);
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(val: any, fallback: string = 'N/A'): string {
  if (!val) return fallback;
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fallback;
  }
}

/**
 * Normalizes an action item whether the API provided a plain string or a structured object.
 */
export function normalizeActionItem(item: RecommendedActionItem | string | any): RecommendedActionItem {
  if (!item) {
    return { priority: 'Medium', action: 'Monitor customer risk signals', owner: 'Retention Team', timeline: 'Immediate' };
  }
  if (typeof item === 'string') {
    return { priority: 'Medium', action: item, owner: 'Retention Team', timeline: 'This Week' };
  }
  return {
    priority: item.priority || 'Medium',
    action: item.action || item.title || item.name || 'Execute retention intervention',
    owner: item.owner || 'Customer Success',
    timeline: item.timeline || 'Next 48 Hours',
    ...item,
  };
}

/**
 * Normalizes a campaign suggestion whether provided as a string or a structured object.
 */
export function normalizeCampaignItem(item: SuggestedCampaignItem | string | any): SuggestedCampaignItem {
  if (!item) {
    return {
      campaign_name: 'Customer Re-engagement',
      target_audience: 'High Risk Users',
      recommended_offer: 'Special Retention Discount',
      expected_impact: 'Save vulnerable cohort',
    };
  }
  if (typeof item === 'string') {
    return {
      campaign_name: item,
      target_audience: 'Identified Cohort',
      recommended_offer: 'Custom retention perk',
      expected_impact: 'Positive churn reduction',
    };
  }
  return {
    campaign_name: item.campaign_name || item.name || item.title || 'Targeted Win-Back',
    target_audience: item.target_audience || item.audience || 'Vulnerable Users',
    recommended_offer: item.recommended_offer || item.offer || 'Exclusive Incentive',
    expected_impact: item.expected_impact || item.impact || 'Projected retention boost',
    ...item,
  };
}

/**
 * Safely normalizes the entire AI Weekly Action Briefing response, guaranteeing
 * that all arrays exist and all fields have sensible fallbacks.
 */
export function normalizeAiBrief(raw: any): AIWeeklyBrief {
  if (!raw || typeof raw !== 'object') {
    return {
      generated_at: new Date().toUTCString(),
      is_ai_generated: false,
      ai_provider: 'LoyaltyLens Deterministic Engine (Fallback)',
      executive_summary: 'No active AI briefing has been generated yet for this period. Click "Refresh Analysis" to synthesize current metrics.',
      top_problems: [],
      priority_customer_segments: [],
      priority_segments: [],
      recommended_actions: [],
      suggested_campaigns: [],
      weekly_snapshot: {
        total_customers: 0,
        high_risk_count: 0,
        medium_risk_count: 0,
        low_risk_count: 0,
        critical_zone: 'None',
      },
    };
  }

  // Handle both priority_segments and priority_customer_segments safely
  const priorityList = safeArray<string>(
    (Array.isArray(raw.priority_segments) && raw.priority_segments.length > 0)
      ? raw.priority_segments
      : raw.priority_customer_segments
  );

  return {
    generated_at: safeString(raw.generated_at, 'Recently generated'),
    is_ai_generated: Boolean(raw.is_ai_generated),
    ai_provider: safeString(raw.ai_provider, 'LoyaltyLens Engine'),
    executive_summary: safeString(
      raw.executive_summary,
      'Customer churn telemetry indicates consistent activity with select vulnerable segments requiring proactive retention outreach.'
    ),
    top_problems: safeArray<string>(raw.top_problems),
    priority_customer_segments: priorityList,
    priority_segments: priorityList,
    recommended_actions: safeArray(raw.recommended_actions).map(normalizeActionItem),
    suggested_campaigns: safeArray(raw.suggested_campaigns).map(normalizeCampaignItem),
    weekly_snapshot: {
      total_customers: safeNumber(raw.weekly_snapshot?.total_customers, 0),
      high_risk_count: safeNumber(raw.weekly_snapshot?.high_risk_count, 0),
      medium_risk_count: safeNumber(raw.weekly_snapshot?.medium_risk_count, 0),
      low_risk_count: safeNumber(raw.weekly_snapshot?.low_risk_count, 0),
      critical_zone: safeString(raw.weekly_snapshot?.critical_zone, 'N/A'),
      ...safeObject(raw.weekly_snapshot),
    },
  };
}
