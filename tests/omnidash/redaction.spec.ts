import { describe, it, expect } from 'vitest';
import { redactPipeline, redactPipelineDisplay, redactNotes, redactAmount } from '@/omnidash/redaction';
import { PipelineItem } from '@/omnidash/types';

const baseItem: PipelineItem = {
  id: '1',
  user_id: 'u1',
  account_name: 'Acme Corp',
  product: 'TradeLine',
  owner: 'Alex',
  stage: 'lead',
  last_touch_at: null,
  next_touch_at: '2025-12-24',
  expected_mrr: 1200,
  probability: 50,
  notes: 'Contact jane@example.com or +1 (555) 123-4567 for billing. $1200 deal',
};

describe('OmniDash redaction', () => {
  it('redacts account names and PII in pipeline', () => {
    const [item] = redactPipeline([baseItem]);
    expect(item.account_name).toBe('Client A');
    expect(item.notes).not.toContain('jane@example.com');
    expect(item.notes).not.toContain('555');
  });

  it('buckets amounts when demo mode', () => {
    const [item] = redactPipelineDisplay([baseItem]);
    expect(item.expected_mrr_bucket).toBe('$1k+');
    expect(item.expected_mrr).toBeNull();
  });

  it('buckets explicit amounts and strips notes', () => {
    const amount = redactAmount(400);
    expect(amount).toBe('$250–$500');
    const notes = redactNotes('Email me at founder@demo.co about $900');
    expect(notes).not.toContain('demo.co');
    expect(notes).toContain('[bucketed]');
  });
});

