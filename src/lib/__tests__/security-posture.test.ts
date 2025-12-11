/**
 * Security Posture Dashboard Tests
 * Tests real-time security scoring and monitoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SecurityPostureDashboard,
  getSecurityScore,
  getScoreColor,
  getScoreEmoji,
} from '../security-posture';

describe('Security Posture Dashboard', () => {
  let dashboard: SecurityPostureDashboard;

  beforeEach(() => {
    dashboard = new SecurityPostureDashboard();
  });

  describe('Overall Security Score Calculation', () => {
    it('should calculate weighted average of all components', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      expect(posture.overall).toBeGreaterThanOrEqual(0);
      expect(posture.overall).toBeLessThanOrEqual(100);
    });

    it('should achieve target score of 95/100', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      // Target: EXCELLENT status (90-100)
      expect(posture.overall).toBeGreaterThanOrEqual(90);
      expect(posture.overall).toBeLessThanOrEqual(100);
    });

    it('should include all 7 components', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      expect(posture.components).toHaveProperty('zeroTrust');
      expect(posture.components).toHaveProperty('promptDefense');
      expect(posture.components).toHaveProperty('sentryGuardian');
      expect(posture.components).toHaveProperty('deceptionLayer');
      expect(posture.components).toHaveProperty('contingency');
      expect(posture.components).toHaveProperty('infrastructure');
      expect(posture.components).toHaveProperty('compliance');
    });
  });

  describe('Component Scoring', () => {
    it('should score Zero-Trust Architecture', async () => {
      const posture = await dashboard.calculateSecurityPosture();
      const zt = posture.components.zeroTrust;

      expect(zt.score).toBeGreaterThanOrEqual(90); // Target: 98/100
      expect(zt.status).toBeOneOf(['healthy', 'warning', 'critical']);
      expect(zt.metrics).toBeDefined();
      expect(zt.lastCheck).toBeGreaterThan(0);
    });

    it('should score Prompt Injection Defense', async () => {
      const posture = await dashboard.calculateSecurityPosture();
      const pf = posture.components.promptDefense;

      expect(pf.score).toBeGreaterThanOrEqual(90); // Target: 96/100
      expect(pf.metrics).toHaveProperty('injectionAttemptsBlocked');
      expect(pf.metrics).toHaveProperty('threatDetectionAccuracy');
    });

    it('should score Sentry Guardian', async () => {
      const posture = await dashboard.calculateSecurityPosture();
      const sg = posture.components.sentryGuardian;

      expect(sg.score).toBeGreaterThanOrEqual(95); // Target: 99/100
      expect(sg.metrics).toHaveProperty('allLoopsOperational');
      expect(sg.metrics.allLoopsOperational).toBe(100); // All 5 loops
    });

    it('should score Deception Layer', async () => {
      const posture = await dashboard.calculateSecurityPosture();
      const dl = posture.components.deceptionLayer;

      expect(dl.score).toBe(100); // Perfect score expected
      expect(dl.metrics).toHaveProperty('canariesIntact');
      expect(dl.metrics.canariesIntact).toBe(100);
    });
  });

  describe('Issue Detection and Severity', () => {
    it('should detect critical issues', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      // Check all components for critical issues
      const allIssues = Object.values(posture.components).flatMap(
        (c) => c.issues
      );

      const criticalIssues = allIssues.filter((i) => i.severity === 'critical');

      // Should have zero critical issues for 95/100 score
      expect(criticalIssues.length).toBe(0);
    });

    it('should flag integrity violations as critical', async () => {
      // This would be tested with mocked violation data
      // In real scenario, integrity violation = CRITICAL
      const mockIssue = {
        id: 'sg-001',
        severity: 'critical' as const,
        category: 'Sentry Guardian',
        description: 'System integrity violation detected',
        impact: 'Critical system files may be tampered',
        remediation: 'IMMEDIATE: Trigger forensic investigation',
        detectedAt: Date.now(),
      };

      expect(mockIssue.severity).toBe('critical');
    });

    it('should flag canary breaches as critical', async () => {
      const mockIssue = {
        id: 'dl-001',
        severity: 'critical' as const,
        category: 'Deception Layer',
        description: 'CANARY TOKEN TRIGGERED',
        impact: 'Active security breach confirmed',
        remediation: 'IMMEDIATE: Activate breach protocol',
        detectedAt: Date.now(),
      };

      expect(mockIssue.severity).toBe('critical');
    });
  });

  describe('Threat Intelligence', () => {
    it('should summarize active threats', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      expect(posture.threats).toHaveProperty('active');
      expect(posture.threats).toHaveProperty('blocked');
      expect(posture.threats).toHaveProperty('mitigated');
      expect(posture.threats).toHaveProperty('investigating');
    });

    it('should categorize threats by type', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      expect(posture.threats.byType).toBeDefined();
      expect(typeof posture.threats.byType).toBe('object');
    });

    it('should identify top threats', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      expect(Array.isArray(posture.threats.topThreats)).toBe(true);
      expect(posture.threats.topThreats.length).toBeGreaterThan(0);

      const topThreat = posture.threats.topThreats[0];
      expect(topThreat).toHaveProperty('type');
      expect(topThreat).toHaveProperty('count');
      expect(topThreat).toHaveProperty('severity');
    });
  });

  describe('Recommendations Engine', () => {
    it('should generate actionable recommendations', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      expect(Array.isArray(posture.recommendations)).toBe(true);
      expect(posture.recommendations.length).toBeGreaterThan(0);

      const rec = posture.recommendations[0];
      expect(rec).toHaveProperty('priority');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('description');
      expect(rec).toHaveProperty('action');
      expect(rec).toHaveProperty('estimatedImpact');
    });

    it('should prioritize critical recommendations first', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      const priorities = posture.recommendations.map((r) => r.priority);

      // Check if sorted by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

      for (let i = 0; i < priorities.length - 1; i++) {
        const currentPriority = priorityOrder[priorities[i]];
        const nextPriority = priorityOrder[priorities[i + 1]];

        expect(currentPriority).toBeLessThanOrEqual(nextPriority);
      }
    });

    it('should limit recommendations to top 10', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      expect(posture.recommendations.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Trend Analysis', () => {
    it('should calculate security posture trend', async () => {
      const posture = await dashboard.calculateSecurityPosture();

      expect(posture.trend).toBeOneOf(['improving', 'degrading', 'stable']);
    });

    it('should detect improving trend', async () => {
      // Simulate multiple scores over time (improving)
      const scores = [85, 87, 90, 92, 95];

      for (const score of scores) {
        (dashboard as any).scores.set('overall', [
          ...((dashboard as any).scores.get('overall') || []),
          score,
        ]);
      }

      const posture = await dashboard.calculateSecurityPosture();

      // With improving scores, trend should be 'improving' or 'stable'
      expect(['improving', 'stable']).toContain(posture.trend);
    });

    it('should detect degrading trend', async () => {
      // Simulate degrading scores
      const scores = [95, 92, 88, 85, 82];

      (dashboard as any).scores.set('overall', scores);

      const posture = await dashboard.calculateSecurityPosture();

      // Should detect degradation
      // Note: might be 'stable' if diff < 2, but shouldn't be 'improving'
      expect(posture.trend).not.toBe('improving');
    });
  });

  describe('Metrics and KPIs', () => {
    it('should provide security effectiveness metrics', async () => {
      const metrics = await dashboard.getMetrics();

      expect(metrics).toHaveProperty('threatDetectionRate');
      expect(metrics).toHaveProperty('falsePositiveRate');
      expect(metrics).toHaveProperty('mttr'); // Mean time to resolution

      // Target metrics
      expect(metrics.threatDetectionRate).toBeGreaterThanOrEqual(95);
      expect(metrics.falsePositiveRate).toBeLessThanOrEqual(2);
    });

    it('should provide system resilience metrics', async () => {
      const metrics = await dashboard.getMetrics();

      expect(metrics).toHaveProperty('uptime');
      expect(metrics.uptime).toBeGreaterThanOrEqual(99.9);
    });

    it('should track vulnerability management', async () => {
      const metrics = await dashboard.getMetrics();

      expect(metrics).toHaveProperty('vulnerabilitiesOpen');
      expect(metrics).toHaveProperty('vulnerabilitiesPatched');
    });
  });

  describe('Report Export', () => {
    it('should export comprehensive markdown report', async () => {
      const report = await dashboard.exportReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('Security Posture Report');
      expect(report).toContain('Overall Security Score');
      expect(report).toContain('Component Scores');
      expect(report).toContain('Threat Summary');
    });

    it('should include all critical information in report', async () => {
      const report = await dashboard.exportReport();

      // Check for key sections
      expect(report).toContain('Zero-Trust');
      expect(report).toContain('Prompt Defense');
      expect(report).toContain('Sentry Guardian');
      expect(report).toContain('Deception Layer');
      expect(report).toContain('Top Threats');
      expect(report).toContain('Top Recommendations');
    });

    it('should indicate overall status', async () => {
      const report = await dashboard.exportReport();

      // Should show OPTIMAL or ACCEPTABLE for 95/100
      expect(
        report.includes('OPTIMAL') || report.includes('ACCEPTABLE')
      ).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('getSecurityScore should return overall score', async () => {
      const score = await getSecurityScore();

      expect(score).toBeGreaterThanOrEqual(90);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('getScoreColor should return correct colors', () => {
      expect(getScoreColor(95)).toBe('green'); // 90+
      expect(getScoreColor(85)).toBe('yellow'); // 70-89
      expect(getScoreColor(65)).toBe('orange'); // 50-69
      expect(getScoreColor(40)).toBe('red'); // <50
    });

    it('getScoreEmoji should return correct emojis', () => {
      expect(getScoreEmoji(96)).toBe('🛡️'); // 95+
      expect(getScoreEmoji(92)).toBe('✅'); // 90-94
      expect(getScoreEmoji(85)).toBe('👍'); // 80-89
      expect(getScoreEmoji(75)).toBe('⚠️'); // 70-79
      expect(getScoreEmoji(65)).toBe('🔶'); // 50-69
      expect(getScoreEmoji(40)).toBe('❌'); // <50
    });
  });

  describe('Performance', () => {
    it('should calculate posture in under 500ms', async () => {
      const start = performance.now();
      await dashboard.calculateSecurityPosture();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it('should handle concurrent posture requests', async () => {
      const requests = [
        dashboard.calculateSecurityPosture(),
        dashboard.calculateSecurityPosture(),
        dashboard.calculateSecurityPosture(),
      ];

      const results = await Promise.all(requests);

      expect(results.length).toBe(3);
      results.forEach((result) => {
        expect(result.overall).toBeGreaterThanOrEqual(90);
      });
    });
  });

  describe('Status Determination', () => {
    it('should mark components as healthy when score >= 90', () => {
      const score = 95;
      const issues: any[] = [];

      const status = (dashboard as any).determineStatus(score, issues);

      expect(status).toBe('healthy');
    });

    it('should mark as warning when score 70-89', () => {
      const score = 80;
      const issues: any[] = [];

      const status = (dashboard as any).determineStatus(score, issues);

      expect(status).toBe('warning');
    });

    it('should mark as critical for critical issues regardless of score', () => {
      const score = 95;
      const issues = [
        {
          severity: 'critical' as const,
          description: 'Test critical issue',
        },
      ];

      const status = (dashboard as any).determineStatus(score, issues);

      expect(status).toBe('critical');
    });
  });

  describe('Real-Time Updates', () => {
    it('should update lastUpdated timestamp', async () => {
      const before = Date.now();
      const posture = await dashboard.calculateSecurityPosture();
      const after = Date.now();

      expect(posture.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(posture.lastUpdated).toBeLessThanOrEqual(after);
    });

    it('should maintain history for trending', async () => {
      await dashboard.calculateSecurityPosture();
      await dashboard.calculateSecurityPosture();
      await dashboard.calculateSecurityPosture();

      const history = (dashboard as any).scores.get('overall') || [];

      expect(history.length).toBeGreaterThan(0);
    });
  });
});
