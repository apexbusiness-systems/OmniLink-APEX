import { describe, expect, it, beforeEach } from 'vitest';
import { getLoopStatuses, recordLoopHeartbeat, resetHeartbeats } from '../../src/guardian/heartbeat';

describe('guardian heartbeat', () => {
  beforeEach(() => {
    resetHeartbeats();
  });

  it('records and reports healthy heartbeat', () => {
    recordLoopHeartbeat('test-loop', Date.now());
    const [status] = getLoopStatuses();
    expect(status.loopName).toBe('test-loop');
    expect(status.status).toBe('healthy');
  });

  it('marks loop stale when lastSeen is old', () => {
    recordLoopHeartbeat('old-loop', Date.now() - 200000);
    const [status] = getLoopStatuses(100000);
    expect(status.status).toBe('stale');
  });
});

