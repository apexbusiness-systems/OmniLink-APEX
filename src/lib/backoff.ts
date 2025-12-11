/**
 * Shared exponential backoff helpers used by audit/device queues and voice WS.
 */

const DEFAULT_JITTER_MS = 250;

export interface BackoffOptions {
  baseMs?: number;
  maxMs?: number;
  jitterMs?: number;
}

/**
 * Calculate exponential backoff with optional jitter.
 */
export function calculateBackoffDelay(
  attempt: number,
  { baseMs = 500, maxMs = 10_000, jitterMs = DEFAULT_JITTER_MS }: BackoffOptions = {}
): number {
  const jitter = Math.random() * jitterMs;
  const delay = baseMs * 2 ** Math.max(attempt - 1, 0);
  return Math.min(delay + jitter, maxMs);
}

/**
 * Convenience helper to pause using calculated backoff.
 */
export function waitWithBackoff(attempt: number, options?: BackoffOptions): Promise<void> {
  const delay = calculateBackoffDelay(attempt, options);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

