import { PipelineItem, TodayItem, KpiDaily } from './types';

const CLIENT_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function redactAccountName(name: string, index: number): string {
  const label = CLIENT_LABELS[index % CLIENT_LABELS.length];
  return `Client ${label}`;
}

function bucketAmount(amount: number | null | undefined): string | null {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return null;
  if (amount < 250) return '<$250';
  if (amount < 500) return '$250–$500';
  if (amount < 1000) return '$500–$1k';
  return '$1k+';
}

function stripPii(text: string): string {
  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const phonePattern = /\+?\d[\d\s().-]{7,}\d/g;
  const dollarPattern = /\$?\s?\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?/g;
  return text.replace(emailPattern, '[redacted]').replace(phonePattern, '[redacted]').replace(dollarPattern, '[bucketed]');
}

export function redactPipeline(items: PipelineItem[]): PipelineItem[] {
  return items.map((item, idx) => ({
    ...item,
    account_name: redactAccountName(item.account_name, idx),
    notes: item.notes ? stripPii(item.notes) : item.notes,
  }));
}

export function redactPipelineDisplay(items: PipelineItem[]): Array<PipelineItem & { expected_mrr_bucket: string | null }> {
  return redactPipeline(items).map((item) => ({
    ...item,
    expected_mrr: null,
    expected_mrr_bucket: bucketAmount(item.expected_mrr ?? undefined),
  }));
}

export function redactTodayItems(items: TodayItem[]): TodayItem[] {
  return items.map((item, idx) => ({
    ...item,
    title: redactAccountName(item.title, idx),
    next_action: item.next_action ? stripPii(item.next_action) : item.next_action,
  }));
}

export function redactKpiDaily(rows: KpiDaily[]): KpiDaily[] {
  return rows.map((row) => ({
    ...row,
    tradeline_paid_starts: Math.max(0, row.tradeline_paid_starts),
    tradeline_active_pilots: Math.max(0, row.tradeline_active_pilots),
    tradeline_churn_risks: Math.max(0, row.tradeline_churn_risks),
    flowbills_demos: Math.max(0, row.flowbills_demos),
    flowbills_paid_accounts: Math.max(0, row.flowbills_paid_accounts),
    cash_days_to_cash: row.cash_days_to_cash ?? null,
  }));
}

export function anonymizeValue(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return bucketAmount(value);
}

export function redactNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  return stripPii(notes);
}

export function redactAmount(value: number | null | undefined): string | null {
  return bucketAmount(value);
}

