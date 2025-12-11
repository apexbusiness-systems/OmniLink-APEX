export interface GuardianLoopStatus {
  loopName: string;
  lastSeen: number;
  ageMs: number;
  status: 'healthy' | 'stale';
}

const heartbeats = new Map<string, number>();

export function recordLoopHeartbeat(loopName: string, timestamp: number = Date.now()): void {
  heartbeats.set(loopName, timestamp);
}

export function getLoopStatuses(staleAfterMs = 120000): GuardianLoopStatus[] {
  const now = Date.now();
  return Array.from(heartbeats.entries()).map(([loopName, lastSeen]) => {
    const ageMs = now - lastSeen;
    return {
      loopName,
      lastSeen,
      ageMs,
      status: ageMs > staleAfterMs ? 'stale' : 'healthy',
    };
  });
}

export function resetHeartbeats() {
  heartbeats.clear();
}

