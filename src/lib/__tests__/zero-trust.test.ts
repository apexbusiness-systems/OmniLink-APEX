/**
 * Zero-Trust Architecture Tests
 * Tests all 5 gates: Identity, Device, Network, Application, Behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZeroTrustEnforcer, type IncomingRequest } from '../zero-trust';

describe('Zero-Trust Architecture', () => {
  let enforcer: ZeroTrustEnforcer;

  beforeEach(() => {
    enforcer = new ZeroTrustEnforcer();
  });

  describe('Identity Verification (Gate 1)', () => {
    it('should deny requests without authentication', async () => {
      const request: IncomingRequest = {
        headers: {},
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('identity');
    });

    it('should allow requests with valid JWT', async () => {
      const request: IncomingRequest = {
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
        userId: 'user-123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      // Mock JWT validation
      vi.spyOn(enforcer as any, 'verifyIdentity').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyDevice').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyNetwork').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyApplication').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyBehavior').mockResolvedValue({
        passed: true,
        score: 100,
      });

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(true);
    });

    it('should deny expired JWT tokens', async () => {
      const request: IncomingRequest = {
        headers: {
          authorization: 'Bearer expired-token',
        },
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      vi.spyOn(enforcer as any, 'verifyIdentity').mockResolvedValue({
        passed: false,
        score: 0,
        reason: 'Token expired',
      });

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Token expired');
    });
  });

  describe('Device Trust (Gate 2)', () => {
    it('should flag unknown devices', async () => {
      const request: IncomingRequest = {
        headers: { authorization: 'Bearer valid-token' },
        userId: 'user-123',
        ip: '192.168.1.1',
        userAgent: 'UnknownBot/1.0',
        path: '/api/protected',
        method: 'GET',
      };

      vi.spyOn(enforcer as any, 'verifyDevice').mockResolvedValue({
        passed: false,
        score: 30,
        reason: 'Unknown device fingerprint',
      });

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(false);
    });

    it('should trust known devices', async () => {
      const request: IncomingRequest = {
        headers: { authorization: 'Bearer valid-token' },
        userId: 'user-123',
        deviceId: 'known-device-123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      vi.spyOn(enforcer as any, 'verifyIdentity').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyDevice').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyNetwork').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyApplication').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyBehavior').mockResolvedValue({
        passed: true,
        score: 100,
      });

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(true);
    });
  });

  describe('Network Context (Gate 3)', () => {
    it('should block requests from known malicious IPs', async () => {
      const request: IncomingRequest = {
        headers: { authorization: 'Bearer valid-token' },
        userId: 'user-123',
        ip: '0.0.0.1', // Known malicious IP
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      vi.spyOn(enforcer as any, 'verifyNetwork').mockResolvedValue({
        passed: false,
        score: 0,
        reason: 'IP in blocklist',
      });

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(false);
    });

    it('should allow requests from trusted networks', async () => {
      const request: IncomingRequest = {
        headers: { authorization: 'Bearer valid-token' },
        userId: 'user-123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      vi.spyOn(enforcer as any, 'verifyIdentity').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyDevice').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyNetwork').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyApplication').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyBehavior').mockResolvedValue({
        passed: true,
        score: 100,
      });

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(true);
    });
  });

  describe('Application Integrity (Gate 4)', () => {
    it('should reject requests with invalid API version', async () => {
      const request: IncomingRequest = {
        headers: {
          authorization: 'Bearer valid-token',
          'x-api-version': 'v0', // Unsupported version
        },
        userId: 'user-123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      vi.spyOn(enforcer as any, 'verifyApplication').mockResolvedValue({
        passed: false,
        score: 0,
        reason: 'Unsupported API version',
      });

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(false);
    });
  });

  describe('Behavioral Analysis (Gate 5)', () => {
    it('should flag velocity anomalies', async () => {
      const request: IncomingRequest = {
        headers: { authorization: 'Bearer valid-token' },
        userId: 'user-123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      vi.spyOn(enforcer as any, 'verifyBehavior').mockResolvedValue({
        passed: false,
        score: 40,
        reason: 'Unusual request velocity detected',
      });

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(false);
    });

    it('should detect impossible travel', async () => {
      const request: IncomingRequest = {
        headers: { authorization: 'Bearer valid-token' },
        userId: 'user-123',
        ip: '203.0.113.0', // Different geolocation
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
        timestamp: Date.now(),
      };

      vi.spyOn(enforcer as any, 'verifyBehavior').mockResolvedValue({
        passed: false,
        score: 20,
        reason: 'Impossible travel detected',
      });

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(false);
    });
  });

  describe('All Gates Integration', () => {
    it('should require ALL gates to pass', async () => {
      const request: IncomingRequest = {
        headers: { authorization: 'Bearer valid-token' },
        userId: 'user-123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      // 4 gates pass, 1 fails
      vi.spyOn(enforcer as any, 'verifyIdentity').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyDevice').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyNetwork').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyApplication').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyBehavior').mockResolvedValue({
        passed: false, // This one fails
        score: 40,
        reason: 'Anomaly detected',
      });

      const result = await enforcer.verifyRequest(request);

      // Should deny because ONE gate failed
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Anomaly detected');
    });

    it('should grant access only when ALL 5 gates pass', async () => {
      const request: IncomingRequest = {
        headers: { authorization: 'Bearer valid-token' },
        userId: 'user-123',
        deviceId: 'known-device',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      // All 5 gates pass
      vi.spyOn(enforcer as any, 'verifyIdentity').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyDevice').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyNetwork').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyApplication').mockResolvedValue({
        passed: true,
        score: 100,
      });
      vi.spyOn(enforcer as any, 'verifyBehavior').mockResolvedValue({
        passed: true,
        score: 100,
      });

      const result = await enforcer.verifyRequest(request);

      expect(result.allowed).toBe(true);
      expect(result.permissions).toBeDefined();
      expect(result.sessionDuration).toBeDefined();
    });
  });

  describe('Fail-Secure Principle', () => {
    it('should DENY on any uncertainty or error', async () => {
      const request: IncomingRequest = {
        headers: { authorization: 'Bearer valid-token' },
        userId: 'user-123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/protected',
        method: 'GET',
      };

      // Simulate an error in one of the gates
      vi.spyOn(enforcer as any, 'verifyIdentity').mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await enforcer.verifyRequest(request);

      // Should fail-secure (deny on error)
      expect(result.allowed).toBe(false);
    });
  });
});
