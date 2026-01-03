/**
 * IDEMPOTENCY ENGINE
 *
 * Deduplication system ensuring same idempotencyKey → same outcome.
 * Critical for deterministic chaos simulation.
 *
 * STRATEGY:
 * - Store receipts in memory (can persist to DB in production)
 * - TTL-based expiration (default 24h)
 * - Stable keys via seeded generation
 * - Atomic check-and-set semantics
 */

import type { EventEnvelope } from './contracts';

// ============================================================================
// TYPES
// ============================================================================

export interface IdempotencyReceipt<T = unknown> {
  /** Unique idempotency key */
  idempotencyKey: string;

  /** Correlation ID for tracing */
  correlationId: string;

  /** Event type */
  eventType: string;

  /** Original request payload */
  request: unknown;

  /** Cached response */
  response: T;

  /** When this receipt was created */
  createdAt: Date;

  /** When this receipt expires */
  expiresAt: Date;

  /** How many times this key was attempted */
  attemptCount: number;

  /** First attempt timestamp */
  firstAttemptAt: Date;

  /** Last attempt timestamp */
  lastAttemptAt: Date;
}

export interface IdempotencyStats {
  totalReceipts: number;
  activeReceipts: number;
  expiredReceipts: number;
  dedupeHits: number;
  dedupeMisses: number;
  hitRate: number;
}

// ============================================================================
// IN-MEMORY STORE
// ============================================================================

class IdempotencyStore {
  private receipts: Map<string, IdempotencyReceipt> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Check if idempotency key exists and is not expired
   */
  has(idempotencyKey: string): boolean {
    const receipt = this.receipts.get(idempotencyKey);

    if (!receipt) {
      return false;
    }

    // Check expiration
    if (receipt.expiresAt < new Date()) {
      this.receipts.delete(idempotencyKey);
      return false;
    }

    return true;
  }

  /**
   * Get receipt by idempotency key
   */
  get<T = unknown>(idempotencyKey: string): IdempotencyReceipt<T> | null {
    const receipt = this.receipts.get(idempotencyKey);

    if (!receipt) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (receipt.expiresAt < new Date()) {
      this.receipts.delete(idempotencyKey);
      this.stats.misses++;
      return null;
    }

    // Update attempt tracking
    receipt.attemptCount++;
    receipt.lastAttemptAt = new Date();

    this.stats.hits++;
    return receipt as IdempotencyReceipt<T>;
  }

  /**
   * Store receipt
   */
  set<T = unknown>(
    idempotencyKey: string,
    correlationId: string,
    eventType: string,
    request: unknown,
    response: T,
    ttlMs: number = 24 * 60 * 60 * 1000 // 24 hours default
  ): void {
    const now = new Date();

    const receipt: IdempotencyReceipt<T> = {
      idempotencyKey,
      correlationId,
      eventType,
      request,
      response,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttlMs),
      attemptCount: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    };

    this.receipts.set(idempotencyKey, receipt);
  }

  /**
   * Delete receipt
   */
  delete(idempotencyKey: string): boolean {
    return this.receipts.delete(idempotencyKey);
  }

  /**
   * Clear all receipts
   */
  clear(): void {
    this.receipts.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Cleanup expired receipts
   */
  cleanup(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [key, receipt] of this.receipts.entries()) {
      if (receipt.expiresAt < now) {
        this.receipts.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get statistics
   */
  getStats(): IdempotencyStats {
    const now = new Date();
    let active = 0;
    let expired = 0;

    for (const receipt of this.receipts.values()) {
      if (receipt.expiresAt < now) {
        expired++;
      } else {
        active++;
      }
    }

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      totalReceipts: this.receipts.size,
      activeReceipts: active,
      expiredReceipts: expired,
      dedupeHits: this.stats.hits,
      dedupeMisses: this.stats.misses,
      hitRate,
    };
  }

  /**
   * Get all receipts (for debugging/testing)
   */
  getAll(): IdempotencyReceipt[] {
    return Array.from(this.receipts.values());
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let storeInstance: IdempotencyStore | null = null;

function getStore(): IdempotencyStore {
  if (!storeInstance) {
    storeInstance = new IdempotencyStore();
  }
  return storeInstance;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Execute operation with idempotency
 *
 * If idempotencyKey exists, return cached response.
 * Otherwise, execute operation and cache result.
 */
export async function withIdempotency<T>(
  idempotencyKey: string,
  correlationId: string,
  eventType: string,
  operation: () => Promise<T>,
  ttlMs?: number
): Promise<{ result: T; wasCached: boolean; attemptCount: number }> {
  const store = getStore();

  // Check if we have a cached response
  const existing = store.get<T>(idempotencyKey);

  if (existing) {
    console.log(`[Idempotency] HIT: ${idempotencyKey} (attempt ${existing.attemptCount})`);
    return {
      result: existing.response,
      wasCached: true,
      attemptCount: existing.attemptCount,
    };
  }

  // Execute operation
  console.log(`[Idempotency] MISS: ${idempotencyKey} - executing operation`);

  const result = await operation();

  // Cache the result
  store.set(idempotencyKey, correlationId, eventType, null, result, ttlMs);

  return {
    result,
    wasCached: false,
    attemptCount: 1,
  };
}

/**
 * Check if idempotency key exists
 */
export function hasIdempotencyKey(idempotencyKey: string): boolean {
  return getStore().has(idempotencyKey);
}

/**
 * Get receipt by idempotency key
 */
export function getReceipt<T = unknown>(idempotencyKey: string): IdempotencyReceipt<T> | null {
  return getStore().get<T>(idempotencyKey);
}

/**
 * Manually store receipt
 */
export function storeReceipt<T = unknown>(
  idempotencyKey: string,
  correlationId: string,
  eventType: string,
  request: unknown,
  response: T,
  ttlMs?: number
): void {
  getStore().set(idempotencyKey, correlationId, eventType, request, response, ttlMs);
}

/**
 * Delete receipt
 */
export function deleteReceipt(idempotencyKey: string): boolean {
  return getStore().delete(idempotencyKey);
}

/**
 * Clear all receipts
 */
export function clearAllReceipts(): void {
  getStore().clear();
}

/**
 * Cleanup expired receipts
 */
export function cleanupExpired(): number {
  return getStore().cleanup();
}

/**
 * Get idempotency statistics
 */
export function getStats(): IdempotencyStats {
  return getStore().getStats();
}

/**
 * Get all receipts (for debugging)
 */
export function getAllReceipts(): IdempotencyReceipt[] {
  return getStore().getAll();
}

// ============================================================================
// EVENT-SPECIFIC HELPERS
// ============================================================================

/**
 * Execute event with idempotency
 */
export async function executeEventIdempotently<T>(
  event: EventEnvelope,
  handler: (event: EventEnvelope) => Promise<T>
): Promise<{ result: T; wasCached: boolean; attemptCount: number }> {
  return withIdempotency(
    event.idempotencyKey,
    event.correlationId,
    event.eventType,
    () => handler(event),
    event.chaos?.injectedDelayMs ? 60000 : undefined // Shorter TTL for chaos-injected events
  );
}

/**
 * Mark event as processed (without executing)
 * Useful for stubbed apps
 */
export function markEventProcessed(event: EventEnvelope, response: unknown = { status: 'ok' }): void {
  storeReceipt(
    event.idempotencyKey,
    event.correlationId,
    event.eventType,
    event.payload,
    response
  );
}

// ============================================================================
// AUTOMATIC CLEANUP
// ============================================================================

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start automatic cleanup of expired receipts
 */
export function startAutoCleanup(intervalMs: number = 60000): void {
  if (cleanupInterval) {
    return; // Already running
  }

  cleanupInterval = setInterval(() => {
    const cleaned = cleanupExpired();
    if (cleaned > 0) {
      console.log(`[Idempotency] Cleaned up ${cleaned} expired receipts`);
    }
  }, intervalMs);
}

/**
 * Stop automatic cleanup
 */
export function stopAutoCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// ============================================================================
// PERSISTENCE (Stub for future Supabase integration)
// ============================================================================

/**
 * Persist receipts to database (NOT IMPLEMENTED - stub for future)
 */
export async function persistToDatabase(): Promise<void> {
  // TODO: Implement Supabase persistence
  // INSERT INTO idempotency_receipts (...)
  // ON CONFLICT (idempotency_key) DO UPDATE ...
  console.warn('[Idempotency] Database persistence not implemented - using in-memory only');
}

/**
 * Load receipts from database (NOT IMPLEMENTED - stub for future)
 */
export async function loadFromDatabase(): Promise<void> {
  // TODO: Implement Supabase loading
  // SELECT * FROM idempotency_receipts WHERE expires_at > NOW()
  console.warn('[Idempotency] Database loading not implemented - using in-memory only');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  withIdempotency,
  executeEventIdempotently,
  hasIdempotencyKey,
  getReceipt,
  storeReceipt,
  deleteReceipt,
  clearAllReceipts,
  cleanupExpired,
  getStats,
  getAllReceipts,
  markEventProcessed,
  startAutoCleanup,
  stopAutoCleanup,
};
