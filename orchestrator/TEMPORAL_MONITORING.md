# Temporal Worker Health Monitor

**Purpose:** Monitor the health and availability of the Temporal.io worker that powers the AI Agent Orchestrator.

## Critical Monitoring

### 1. Worker Heartbeat Check

**Script:** `scripts/monitor/temporal-health.ts`

```typescript
import { Connection, WorkflowClient } from '@temporalio/client';

async function checkWorkerHealth(): Promise<boolean> {
  try {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    const client = new WorkflowClient({ connection });

    // Attempt to start a test workflow
    const handle = await client.start('healthCheckWorkflow', {
      taskQueue: 'agent-orchestrator',
      workflowId: `health-check-${Date.now()}`,
      args: [],
    });

    // Wait for completion (should be instant)
    const result = await handle.result();

    console.log('✅ Temporal worker is healthy');
    return true;
  } catch (error) {
    console.error('❌ Temporal worker is DOWN:', error);
    return false;
  }
}

// Run every 60 seconds
setInterval(async () => {
  const isHealthy = await checkWorkerHealth();
  if (!isHealthy) {
    // Send alert (Sentry, PagerDuty, Slack, etc.)
    await sendAlert({
      severity: 'critical',
      service: 'temporal-worker',
      message: 'Temporal worker is not responding',
    });
  }
}, 60000);
```

### 2. Workflow Queue Depth Monitoring

**Alert:** If queue depth > 100, worker is falling behind

```python
# orchestrator/monitoring/queue_metrics.py
from temporalio.client import Client

async def check_queue_depth():
    client = await Client.connect("localhost:7233")

    # Get task queue description
    desc = await client.describe_task_queue("agent-orchestrator")

    pending_tasks = desc.tasks_by_type.get("workflow", 0)

    if pending_tasks > 100:
        print(f"⚠️ WARNING: {pending_tasks} pending workflows")
        # Send alert
    else:
        print(f"✅ Queue healthy: {pending_tasks} pending")
```

### 3. Auto-Restart on Failure

**Systemd Service** (for production deployment):

```ini
# /etc/systemd/system/temporal-worker.service
[Unit]
Description=APEX OmniHub Temporal Worker
After=network.target

[Service]
Type=simple
User=apex
WorkingDirectory=/opt/apex-omnihub/orchestrator
ExecStart=/usr/bin/python -m main
Restart=always
RestartSec=10
Environment="TEMPORAL_ADDRESS=cloud.temporal.io:7233"
Environment="TEMPORAL_NAMESPACE=apex-production"

[Install]
WantedBy=multi-user.target
```

**Docker Compose** (for local/staging):

```yaml
version: '3.8'
services:
  temporal-worker:
    build: ./orchestrator
    restart: unless-stopped
    environment:
      - TEMPORAL_ADDRESS=${TEMPORAL_ADDRESS}
      - REDIS_URL=${REDIS_URL}
    healthcheck:
      test: ["CMD", "python", "-c", "import sys; sys.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - redis
```

## Metrics to Track

### Worker Metrics
- **Workflow Start Rate:** workflows/sec
- **Workflow Completion Rate:** completions/sec
- **Average Workflow Duration:** milliseconds
- **Failed Workflow Rate:** failures/sec
- **Worker Uptime:** seconds

### Queue Metrics
- **Pending Workflows:** count
- **Backlog Age:** oldest pending workflow timestamp
- **Task Processing Time:** p50, p95, p99

### Cache Metrics (Redis)
- **Cache Hit Rate:** percentage
- **Cache Lookup Time:** p50, p95, p99
- **Redis Connection Errors:** count

## Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Worker Downtime | > 30s | > 60s |
| Queue Depth | > 50 | > 100 |
| Workflow Failure Rate | > 5% | > 10% |
| Cache Hit Rate | < 50% | < 30% |
| Redis Errors | > 10/min | > 50/min |

## Integration with Observability

### Sentry
```typescript
import * as Sentry from '@sentry/node';

Sentry.captureMessage('Temporal worker down', {
  level: 'fatal',
  tags: {
    service: 'orchestrator',
    component: 'temporal-worker',
  },
});
```

### Datadog
```python
from datadog import statsd

statsd.gauge('temporal.queue.depth', pending_tasks)
statsd.increment('temporal.workflow.failed')
statsd.histogram('temporal.workflow.duration', duration_ms)
```

## Runbook: Worker Recovery

### If Worker Stops Responding

1. **Check Process Status**
   ```bash
   systemctl status temporal-worker
   # or
   docker ps | grep temporal-worker
   ```

2. **Check Logs**
   ```bash
   journalctl -u temporal-worker -n 100
   # or
   docker logs temporal-worker --tail 100
   ```

3. **Common Issues:**
   - **Redis Connection Lost:** Restart Redis, worker will reconnect
   - **Out of Memory:** Increase memory limit in systemd/docker
   - **Network Timeout:** Check Temporal Cloud connectivity
   - **Code Error:** Check workflow logs for exceptions

4. **Manual Restart**
   ```bash
   systemctl restart temporal-worker
   # or
   docker-compose restart temporal-worker
   ```

5. **Verify Recovery**
   ```bash
   # Run health check
   python -c "from monitoring.queue_metrics import check_queue_depth; import asyncio; asyncio.run(check_queue_depth())"
   ```

## Production Deployment Checklist

- [ ] Temporal worker deployed with systemd/docker auto-restart
- [ ] Health check endpoint exposed
- [ ] Metrics exported to Datadog/Prometheus
- [ ] Alerts configured in PagerDuty/Opsgenie
- [ ] Runbook documented and tested
- [ ] On-call rotation established
- [ ] Backup worker in standby mode (optional)

---

**Last Updated:** 2026-01-04
**Maintained By:** APEX DevOps Team
