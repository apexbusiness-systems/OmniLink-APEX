import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateBackoffDelay } from '@/lib/backoff';

describe('calculateBackoffDelay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('caps delay at maxMs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const delay = calculateBackoffDelay(5, { baseMs: 500, maxMs: 1000, jitterMs: 0 });
    expect(delay).toBeLessThanOrEqual(1000);
  });

  it('adds jitter within bounds', () => {
    const delay = calculateBackoffDelay(2, { baseMs: 500, maxMs: 2000, jitterMs: 250 });
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThanOrEqual(2000);
  });
});

