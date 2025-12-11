import { recordLoopHeartbeat } from './heartbeat';

const intervals: NodeJS.Timer[] = [];

export function startGuardianLoops() {
  if (intervals.length > 0) return;

  // Lightweight session watchdog
  intervals.push(
    setInterval(() => {
      recordLoopHeartbeat('guardian-session-watchdog');
    }, 60000)
  );

  // Offline sync monitor placeholder
  intervals.push(
    setInterval(() => {
      recordLoopHeartbeat('guardian-offline-sync');
    }, 90000)
  );

  // Periodic health ping to backend
  intervals.push(
    setInterval(async () => {
      if (typeof window === 'undefined') {
        recordLoopHeartbeat('guardian-health-ping');
        return;
      }
      const { runHealthCheck } = await import('@/lib/healthcheck');
      const result = await runHealthCheck().catch(() => null);
      if (result?.status === 'OK') {
        recordLoopHeartbeat('guardian-health-ping');
      }
    }, 120000)
  );
}

export function stopGuardianLoops() {
  intervals.forEach((i) => clearInterval(i));
  intervals.length = 0;
}

