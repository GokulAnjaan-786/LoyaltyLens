export * from './ai';

export interface Customer {
  id: string;
  organization_id: string;
  customer_code: string;
  app_type: string;
  subscription_type: string;
  city: string;
  latitude?: number;
  longitude?: number;
  industry_type?: string;
  joining_date?: string;
  login_days: number;
  hours_spent: number;
  support_tickets: number;
  orders_count: number;
  avg_delivery_delay_mins: number;
  app_rating: number;
  last_purchase_days: number;
  cart_abandon_count: number;
  return_count: number;
  last_active_days: number;
  course_progress_percent?: number;
  avg_session_time?: number;
  quiz_attempts?: number;
  created_at?: string;
  churn_probability: number;
  risk_score: number;
  risk_level: string;
  reasons: any;
  recommendations: any;
  ai_explanation?: string;
}

export interface CustomerListResponse {
  total: number;
  page: number;
  size: number;
  items: Customer[];
}

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  target_segment: string;
  target_risk_level: string;
  offer: string;
  action_strength: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | string;
  target_customer_count: number;
  expected_saved_count: number;
  expected_risk_reduction_pct: number;
  estimated_cost_inr: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface OverviewStats {
  total_customers: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  avg_churn_probability: number;
  avg_risk_score: number;
  risk_distribution?: {
    high: number;
    medium: number;
    low: number;
  };
  total_rescued?: number;
  retention_rate_pct?: number;
}
