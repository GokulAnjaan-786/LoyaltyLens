export interface RecommendedActionItem {
  priority?: string;
  action?: string;
  owner?: string;
  timeline?: string;
  [key: string]: any;
}

export interface SuggestedCampaignItem {
  campaign_name?: string;
  target_audience?: string;
  recommended_offer?: string;
  expected_impact?: string;
  [key: string]: any;
}

export interface WeeklySnapshot {
  total_customers?: number;
  high_risk_count?: number;
  medium_risk_count?: number;
  low_risk_count?: number;
  critical_zone?: string;
  [key: string]: any;
}

export interface AIWeeklyBrief {
  generated_at?: string;
  is_ai_generated?: boolean;
  ai_provider?: string;
  executive_summary?: string;
  top_problems?: string[];
  priority_customer_segments?: string[];
  priority_segments?: string[];
  recommended_actions?: (RecommendedActionItem | string)[];
  suggested_campaigns?: (SuggestedCampaignItem | string)[];
  weekly_snapshot?: WeeklySnapshot;
}
