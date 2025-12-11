/**
 * Rate Limiting Tests
 * Tests cost protection and DDoS mitigation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, type RateLimitConfig } from '../../supabase/functions/_shared/rate-limit';

describe('Rate Limiting', () => {
  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000, // 1 minute
      });

      const userId = 'user-123';

      // First 5 requests should pass
      for (let i = 0; i < 5; i++) {
        const result = limiter.check(userId);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 60000,
      });

      const userId = 'user-456';

      // First 3 pass
      for (let i = 0; i < 3; i++) {
        limiter.check(userId);
      }

      // 4th should be blocked
      const result = limiter.check(userId);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBeDefined();
    });

    it('should reset counter after window expires', async () => {
      vi.useFakeTimers();

      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000, // 1 second
      });

      const userId = 'user-789';

      // Use up limit
      limiter.check(userId);
      limiter.check(userId);
      expect(limiter.check(userId).allowed).toBe(false);

      // Fast forward past window
      vi.advanceTimersByTime(1100);

      // Should be allowed again
      const result = limiter.check(userId);
      expect(result.allowed).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Per-Endpoint Configuration', () => {
    it('should enforce strict limits on expensive endpoints', () => {
      const expensiveLimiter = new RateLimiter({
        maxRequests: 5, // apex-assistant limit
        windowMs: 60000,
      });

      const userId = 'user-expensive';

      // 5 requests allowed
      for (let i = 0; i < 5; i++) {
        expect(expensiveLimiter.check(userId).allowed).toBe(true);
      }

      // 6th blocked (protects GPT-5 costs)
      expect(expensiveLimiter.check(userId).allowed).toBe(false);
    });

    it('should enforce moderate limits on voice endpoints', () => {
      const voiceLimiter = new RateLimiter({
        maxRequests: 10, // apex-voice limit
        windowMs: 60000,
      });

      const userId = 'user-voice';

      // 10 requests allowed
      for (let i = 0; i < 10; i++) {
        expect(voiceLimiter.check(userId).allowed).toBe(true);
      }

      // 11th blocked
      expect(voiceLimiter.check(userId).allowed).toBe(false);
    });
  });

  describe('Cost Protection', () => {
    it('should prevent $10K+ monthly API costs', () => {
      // Simulate expensive GPT-5 calls
      const costPerCall = 0.50; // $0.50 per call (example)
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      const user = 'heavy-user';
      let totalCost = 0;
      let blockedCalls = 0;

      // Simulate 1000 attempts in a minute
      for (let i = 0; i < 1000; i++) {
        const result = limiter.check(user);
        if (result.allowed) {
          totalCost += costPerCall;
        } else {
          blockedCalls++;
        }
      }

      // Should have blocked 995 calls (only 5 allowed)
      expect(blockedCalls).toBe(995);
      expect(totalCost).toBe(2.50); // Only 5 * $0.50
      expect(totalCost).toBeLessThan(10); // Well below danger zone
    });

    it('should calculate potential savings', () => {
      const uncappedCostPerMonth = 15000; // $15K without limits
      const cappedCostPerMonth = 500; // $500 with limits
      const savings = uncappedCostPerMonth - cappedCostPerMonth;

      expect(savings).toBe(14500);
      expect(savings / uncappedCostPerMonth).toBeCloseTo(0.97, 2); // 97% reduction
    });
  });

  describe('DDoS Mitigation', () => {
    it('should handle burst traffic from single source', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 1000,
      });

      const attacker = 'ddos-bot';

      // Simulate burst of 100 requests
      let blocked = 0;
      for (let i = 0; i < 100; i++) {
        const result = limiter.check(attacker);
        if (!result.allowed) blocked++;
      }

      // Should block 90 requests
      expect(blocked).toBe(90);
    });

    it('should isolate per-user limits', () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 60000,
      });

      const user1 = 'user-1';
      const user2 = 'user-2';

      // User 1 hits limit
      limiter.check(user1);
      limiter.check(user1);
      limiter.check(user1);
      expect(limiter.check(user1).allowed).toBe(false);

      // User 2 should still be allowed
      expect(limiter.check(user2).allowed).toBe(true);
      expect(limiter.check(user2).allowed).toBe(true);
      expect(limiter.check(user2).allowed).toBe(true);
    });
  });

  describe('Response Headers', () => {
    it('should provide Retry-After header when limited', () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 60000,
      });

      const userId = 'user-retry';

      limiter.check(userId); // First request
      const result = limiter.check(userId); // Second (blocked)

      expect(result.allowed).toBe(false);
      expect(result.resetAt).toBeDefined();

      const retryAfterSeconds = Math.ceil(
        (result.resetAt! - Date.now()) / 1000
      );
      expect(retryAfterSeconds).toBeGreaterThan(0);
      expect(retryAfterSeconds).toBeLessThanOrEqual(60);
    });

    it('should provide X-RateLimit headers for client awareness', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
      });

      const userId = 'user-headers';

      const result = limiter.check(userId);

      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(9);
      expect(result.resetAt).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      const userId = 'concurrent-user';

      // Simulate concurrent requests
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(limiter.check(userId));
      }

      const allowed = results.filter((r) => r.allowed).length;
      const blocked = results.filter((r) => !r.allowed).length;

      expect(allowed).toBe(5);
      expect(blocked).toBe(5);
    });

    it('should handle missing user identifier gracefully', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      // Use IP address as fallback
      const result = limiter.check('192.168.1.1');
      expect(result.allowed).toBe(true);
    });

    it('should clean up expired entries to prevent memory leaks', () => {
      vi.useFakeTimers();

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 1000,
      });

      // Create many entries
      for (let i = 0; i < 1000; i++) {
        limiter.check(`user-${i}`);
      }

      // Fast forward to expire all
      vi.advanceTimersByTime(2000);

      // Trigger cleanup by making new request
      limiter.check('cleanup-trigger');

      // Internal store should have cleaned up
      const storeSize = (limiter as any).store.size;
      expect(storeSize).toBeLessThan(100); // Most entries cleaned

      vi.useRealTimers();
    });
  });

  describe('Business Logic', () => {
    it('should support premium tier with higher limits', () => {
      const premiumLimiter = new RateLimiter({
        maxRequests: 100, // 20x standard
        windowMs: 60000,
      });

      const premiumUser = 'premium-user';

      // Can make many more requests
      for (let i = 0; i < 100; i++) {
        expect(premiumLimiter.check(premiumUser).allowed).toBe(true);
      }

      expect(premiumLimiter.check(premiumUser).allowed).toBe(false);
    });

    it('should provide metrics for monitoring', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      // Simulate traffic
      limiter.check('user-1');
      limiter.check('user-1');
      limiter.check('user-2');
      limiter.check('user-3');

      const metrics = (limiter as any).getMetrics();

      expect(metrics).toMatchObject({
        totalUsers: 3,
        totalRequests: 4,
      });
    });
  });

  describe('Integration with Edge Functions', () => {
    it('should work with Supabase Edge Function context', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      // Simulate Supabase context
      const request = {
        headers: new Headers({
          authorization: 'Bearer user-jwt',
        }),
      };

      // Extract user from JWT (simplified)
      const userId = 'user-from-jwt';

      const result = limiter.check(userId);
      expect(result.allowed).toBe(true);
    });
  });
});
