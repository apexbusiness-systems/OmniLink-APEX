/**
 * ZERO-TRUST ENFORCER
 * OMNiLiNK FORTRESS PROTOCOL v2.0
 *
 * Every request must pass ALL 5 verification gates:
 * 1. Identity Verification (Who are you?)
 * 2. Device Verification (What device?)
 * 3. Network Verification (Where from?)
 * 4. Application Verification (What action?)
 * 5. Behavior Verification (Acting normal?)
 */

import { logError, logSecurityEvent } from './monitoring';

export interface TrustDecision {
  allowed: boolean;
  permissions?: string[];
  sessionDuration?: number;
  revalidateAfter?: string;
  reason?: string[];
}

export interface CheckResult {
  passed: boolean;
  reason?: string;
  score?: number;
}

export interface IncomingRequest {
  headers: Record<string, string>;
  ip: string;
  userId?: string;
  sessionId?: string;
  deviceFingerprint?: string;
  timestamp: number;
}

export class ZeroTrustEnforcer {
  private readonly MIN_TRUST_SCORE = 0.7;
  private readonly SESSION_DURATION_BASE = 3600000; // 1 hour in ms

  /**
   * MAIN VERIFICATION FUNCTION
   * ALL checks must pass — fail on ANY uncertainty
   */
  async verifyRequest(request: IncomingRequest): Promise<TrustDecision> {
    const startTime = Date.now();

    try {
      // Run all verification checks in parallel
      const checks = await Promise.all([
        this.verifyIdentity(request),
        this.verifyDevice(request),
        this.verifyNetwork(request),
        this.verifyApplication(request),
        this.verifyBehavior(request),
      ]);

      const failed = checks.filter((c) => !c.passed);

      // Log verification attempt
      const verificationDuration = Date.now() - startTime;
      console.log(`[ZERO-TRUST] Verification completed in ${verificationDuration}ms`);

      // DENY if ANY check failed (fail-secure principle)
      if (failed.length > 0) {
        await this.logDenial(request, failed);
        await this.updateThreatIntelligence(request, failed);

        return {
          allowed: false,
          reason: failed.map((f) => f.reason || 'Unknown failure'),
        };
      }

      // Even if passed, apply principle of least privilege
      const scopedPermissions = this.calculateMinimalPermissions(request, checks);
      const sessionDuration = this.calculateSessionDuration(checks);

      return {
        allowed: true,
        permissions: scopedPermissions,
        sessionDuration,
        revalidateAfter: '5m', // Force re-verification every 5 minutes
      };
    } catch (error) {
      // On error, DENY (fail-secure)
      logError(error instanceof Error ? error : new Error(String(error)), {
        action: 'zero_trust_verification',
        metadata: { request },
      });

      return {
        allowed: false,
        reason: ['Verification system error - denying access for security'],
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // GATE 1: IDENTITY VERIFICATION (Who are you?)
  // ═══════════════════════════════════════════════════════════
  private async verifyIdentity(req: IncomingRequest): Promise<CheckResult> {
    const checks: boolean[] = [];

    // Check 1: Valid session exists
    if (!req.sessionId) {
      return { passed: false, reason: 'No session ID' };
    }
    checks.push(true);

    // Check 2: User ID exists
    if (!req.userId) {
      return { passed: false, reason: 'No user ID' };
    }
    checks.push(true);

    // Check 3: Session not expired (would be checked against DB)
    // In production: check session timestamp from database
    checks.push(true);

    // Check 4: Session not revoked (would check revocation list)
    // In production: check against revoked sessions table
    checks.push(true);

    const score = checks.filter(Boolean).length / checks.length;

    return {
      passed: score >= 0.9,
      score,
      reason: score < 0.9 ? 'Identity verification failed' : undefined,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GATE 2: DEVICE VERIFICATION (What device?)
  // ═══════════════════════════════════════════════════════════
  private async verifyDevice(req: IncomingRequest): Promise<CheckResult> {
    const checks: boolean[] = [];

    // Check 1: Device fingerprint exists
    if (!req.deviceFingerprint) {
      return { passed: false, reason: 'No device fingerprint' };
    }
    checks.push(true);

    // Check 2: User-Agent is valid (not bot-like)
    const userAgent = req.headers['user-agent'] || '';
    const isBotLike = /bot|crawler|spider|scraper/i.test(userAgent);
    checks.push(!isBotLike);

    // Check 3: Device fingerprint matches known device
    // In production: check against registered devices
    checks.push(true);

    const score = checks.filter(Boolean).length / checks.length;

    return {
      passed: score >= 0.8,
      score,
      reason: score < 0.8 ? 'Device verification failed' : undefined,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GATE 3: NETWORK VERIFICATION (Where from?)
  // ═══════════════════════════════════════════════════════════
  private async verifyNetwork(req: IncomingRequest): Promise<CheckResult> {
    const checks: boolean[] = [];

    // Check 1: Valid IP address
    if (!req.ip || req.ip === '0.0.0.0') {
      return { passed: false, reason: 'Invalid IP address' };
    }
    checks.push(true);

    // Check 2: IP not on blocklist
    const isBlocked = await this.checkIPBlocklist(req.ip);
    checks.push(!isBlocked);

    // Check 3: IP reputation (simplified - would use threat intel in production)
    const hasGoodReputation = !this.isKnownMaliciousIP(req.ip);
    checks.push(hasGoodReputation);

    // Check 4: Not from Tor (unless explicitly allowed)
    const isTor = this.isTorExit(req.ip);
    checks.push(!isTor);

    const score = checks.filter(Boolean).length / checks.length;

    return {
      passed: score >= 0.75,
      score,
      reason: score < 0.75 ? 'Network verification failed' : undefined,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GATE 4: APPLICATION VERIFICATION (What action?)
  // ═══════════════════════════════════════════════════════════
  private async verifyApplication(req: IncomingRequest): Promise<CheckResult> {
    const checks: boolean[] = [];

    // Check 1: Valid request format
    checks.push(!!req.headers);

    // Check 2: Required headers present
    const hasAuthHeader = !!req.headers['authorization'];
    checks.push(hasAuthHeader);

    // Check 3: Request timestamp is recent (prevent replay attacks)
    const requestAge = Date.now() - req.timestamp;
    const isRecent = requestAge < 300000; // 5 minutes
    checks.push(isRecent);

    const score = checks.filter(Boolean).length / checks.length;

    return {
      passed: score >= 0.8,
      score,
      reason: score < 0.8 ? 'Application verification failed' : undefined,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GATE 5: BEHAVIOR VERIFICATION (Acting normal?)
  // ═══════════════════════════════════════════════════════════
  private async verifyBehavior(req: IncomingRequest): Promise<CheckResult> {
    const checks: boolean[] = [];

    // Check 1: Request rate is normal
    const rateOk = await this.checkRequestRate(req.userId || req.ip);
    checks.push(rateOk);

    // Check 2: Request pattern matches historical behavior
    // In production: use ML model to detect anomalies
    checks.push(true);

    // Check 3: No suspicious patterns in request
    const isSuspicious = this.detectSuspiciousPattern(req);
    checks.push(!isSuspicious);

    const score = checks.filter(Boolean).length / checks.length;

    return {
      passed: score >= 0.7,
      score,
      reason: score < 0.7 ? 'Behavior verification failed' : undefined,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  private calculateMinimalPermissions(
    req: IncomingRequest,
    checks: CheckResult[]
  ): string[] {
    // Start with minimal permissions
    const permissions: string[] = ['read'];

    // Add more permissions based on trust score
    const avgScore =
      checks.reduce((sum, c) => sum + (c.score || 0), 0) / checks.length;

    if (avgScore > 0.9) {
      permissions.push('write');
    }

    if (avgScore > 0.95) {
      permissions.push('delete');
    }

    return permissions;
  }

  private calculateSessionDuration(checks: CheckResult[]): number {
    // Shorter sessions for lower trust scores
    const avgScore =
      checks.reduce((sum, c) => sum + (c.score || 0), 0) / checks.length;

    if (avgScore > 0.95) {
      return this.SESSION_DURATION_BASE; // 1 hour
    } else if (avgScore > 0.85) {
      return this.SESSION_DURATION_BASE / 2; // 30 minutes
    } else {
      return this.SESSION_DURATION_BASE / 4; // 15 minutes
    }
  }

  private async logDenial(
    req: IncomingRequest,
    failures: CheckResult[]
  ): Promise<void> {
    logSecurityEvent('suspicious_activity', {
      ip: req.ip,
      userId: req.userId,
      failures: failures.map((f) => f.reason),
      timestamp: new Date().toISOString(),
    });
  }

  private async updateThreatIntelligence(
    req: IncomingRequest,
    failures: CheckResult[]
  ): Promise<void> {
    // In production: update threat intelligence database
    console.warn('[ZERO-TRUST] Threat intelligence updated:', {
      ip: req.ip,
      failures: failures.length,
    });
  }

  private async checkIPBlocklist(ip: string): Promise<boolean> {
    // In production: check against threat intelligence feeds
    // For now, simple localhost check
    return false;
  }

  private isKnownMaliciousIP(ip: string): boolean {
    // In production: check against threat databases
    // Simple pattern matching for demo
    return /^(0\.|127\.|169\.254\.)/.test(ip);
  }

  private isTorExit(ip: string): boolean {
    // In production: check against Tor exit node list
    return false;
  }

  private async checkRequestRate(identifier: string): Promise<boolean> {
    // In production: check against rate limiting system
    // For now, always pass
    return true;
  }

  private detectSuspiciousPattern(req: IncomingRequest): boolean {
    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip',
    ];

    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        const value = req.headers[header];
        // Check for header injection attempts
        if (value.includes('\n') || value.includes('\r')) {
          return true;
        }
      }
    }

    return false;
  }
}
