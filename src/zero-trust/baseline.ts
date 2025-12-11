export interface ActivityLog {
  userId: string;
  deviceId: string;
  timestamp: number;
  action: string;
  durationMs?: number;
}

export interface BaselineMetrics {
  userId: string;
  deviceId: string;
  totalSessions: number;
  avgSessionDuration: number;
  uniqueActions: number;
  lastSeen: number;
  risk: 'normal' | 'elevated';
}

export function computeBaseline(logs: ActivityLog[]): BaselineMetrics[] {
  const buckets = new Map<string, ActivityLog[]>();

  logs.forEach((log) => {
    const key = `${log.userId}:${log.deviceId}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(log);
  });

  return Array.from(buckets.entries()).map(([key, entries]) => {
    const [userId, deviceId] = key.split(':');
    const totalSessions = entries.length;
    const avgSessionDuration =
      entries.reduce((sum, e) => sum + (e.durationMs ?? 0), 0) / Math.max(totalSessions, 1);
    const uniqueActions = new Set(entries.map((e) => e.action)).size;
    const lastSeen = Math.max(...entries.map((e) => e.timestamp));
    const risk = avgSessionDuration < 1000 || uniqueActions > 10 ? 'elevated' : 'normal';

    return {
      userId,
      deviceId,
      totalSessions,
      avgSessionDuration,
      uniqueActions,
      lastSeen,
      risk,
    };
  });
}

export function formatBaseline(metrics: BaselineMetrics[]): string {
  return metrics
    .map(
      (m) =>
        `${m.userId}/${m.deviceId}: sessions=${m.totalSessions} avgMs=${Math.round(
          m.avgSessionDuration
        )} actions=${m.uniqueActions} risk=${m.risk}`
    )
    .join('\n');
}

