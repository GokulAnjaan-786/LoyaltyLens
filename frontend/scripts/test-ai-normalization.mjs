import assert from 'node:assert';
import { normalizeAiBrief, safeArray, safeNumber, safeString } from '../src/lib/safeData.ts';

console.log('🧪 Running AI Insights & Data Resilience Unit Tests...\n');

// 1. Complete response with priority_segments
{
  const raw = {
    generated_at: 'Oct 23, 2026',
    is_ai_generated: true,
    ai_provider: 'Google Gemini 1.5 Flash',
    executive_summary: 'Retention is stable.',
    top_problems: ['Problem 1', 'Problem 2'],
    priority_segments: ['Segment A', 'Segment B'],
    recommended_actions: [{ priority: 'High', action: 'Action 1', owner: 'Ops', timeline: 'Today' }],
    suggested_campaigns: [{ campaign_name: 'Camp 1', target_audience: 'Aud 1', recommended_offer: 'Off 1', expected_impact: 'Imp 1' }],
    weekly_snapshot: { total_customers: 100, high_risk_count: 10, medium_risk_count: 20, low_risk_count: 70, critical_zone: 'Mumbai' }
  };
  const normalized = normalizeAiBrief(raw);
  assert.strictEqual(normalized.priority_segments.length, 2);
  assert.strictEqual(normalized.priority_segments[0], 'Segment A');
  assert.strictEqual(normalized.top_problems.length, 2);
  assert.strictEqual(normalized.recommended_actions.length, 1);
  assert.strictEqual(typeof normalized.recommended_actions[0].action, 'string');
  console.log('✓ Scenario 1: Complete response passes');
}

// 2. priority_segments missing (only priority_customer_segments provided)
{
  const raw = {
    priority_customer_segments: ['Fallback Segment 1', 'Fallback Segment 2'],
  };
  const normalized = normalizeAiBrief(raw);
  assert(Array.isArray(normalized.priority_segments));
  assert.strictEqual(normalized.priority_segments.length, 2);
  assert.strictEqual(normalized.priority_segments[0], 'Fallback Segment 1');
  console.log('✓ Scenario 2: Missing priority_segments falls back to priority_customer_segments');
}

// 3. priority_segments is null
{
  const raw = {
    priority_segments: null,
    priority_customer_segments: null,
  };
  const normalized = normalizeAiBrief(raw);
  assert(Array.isArray(normalized.priority_segments));
  assert.strictEqual(normalized.priority_segments.length, 0);
  // Guarantee .map() can be called safely
  normalized.priority_segments.map((s) => s.toUpperCase());
  console.log('✓ Scenario 3: priority_segments: null safely yields empty array');
}

// 4. priority_segments is empty array
{
  const raw = {
    priority_segments: [],
  };
  const normalized = normalizeAiBrief(raw);
  assert(Array.isArray(normalized.priority_segments));
  assert.strictEqual(normalized.priority_segments.length, 0);
  console.log('✓ Scenario 4: priority_segments: [] handled safely');
}

// 5. Entire brief is missing (null or undefined)
{
  const normalizedNull = normalizeAiBrief(null);
  assert(normalizedNull !== null);
  assert(Array.isArray(normalizedNull.priority_segments));
  assert(Array.isArray(normalizedNull.top_problems));
  assert(Array.isArray(normalizedNull.recommended_actions));
  assert(Array.isArray(normalizedNull.suggested_campaigns));
  assert.strictEqual(typeof normalizedNull.executive_summary, 'string');
  // Confirm .map() executes with 0 errors
  normalizedNull.priority_segments.map((s) => s);
  normalizedNull.recommended_actions.map((a) => a.action);

  const normalizedUndef = normalizeAiBrief(undefined);
  assert(Array.isArray(normalizedUndef.priority_segments));
  console.log('✓ Scenario 5: Entire brief is null or undefined handled safely without crash');
}

// 6. recommended_actions & suggested_campaigns as strings or objects
{
  const raw = {
    recommended_actions: ['Direct string action', { action: 'Object action', priority: 'High' }],
    suggested_campaigns: ['Direct string campaign', { campaign_name: 'Object campaign' }]
  };
  const normalized = normalizeAiBrief(raw);
  assert.strictEqual(normalized.recommended_actions.length, 2);
  assert.strictEqual(normalized.recommended_actions[0].action, 'Direct string action');
  assert.strictEqual(normalized.recommended_actions[1].action, 'Object action');
  assert.strictEqual(normalized.suggested_campaigns[0].campaign_name, 'Direct string campaign');
  assert.strictEqual(normalized.suggested_campaigns[1].campaign_name, 'Object campaign');
  console.log('✓ Scenario 6: Mixed string/object actions and campaigns normalized cleanly');
}

console.log('\n🎉 ALL AI DATA RESILIENCE TESTS PASSED SUCCESSFULLY!\n');
