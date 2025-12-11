import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/monitoring', () => ({
  logAnalyticsEvent: vi.fn(),
  logError: vi.fn(),
}));

const importAudit = async () => await import('../../src/security/auditLog');

describe('audit log queue', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('enqueues and flushes audit events', async () => {
    const { recordAuditEvent, getAuditQueueSnapshot, flushQueue } = await importAudit();
    (fetch as any).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ status: 'ok' }),
    });

    const entry = recordAuditEvent({
      actorId: 'user-1',
      actionType: 'config_change',
      resourceType: 'config',
      resourceId: 'guardian',
      metadata: { value: 'enabled' },
    });

    await flushQueue(true);
    const queue = await getAuditQueueSnapshot();

    expect(queue.length).toBe(0);
    expect(entry.id).toBeDefined();
  });

  it('keeps events queued when Lovable returns 500', async () => {
    const { recordAuditEvent, getAuditQueueSnapshot, flushQueue } = await importAudit();
    (fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'server error',
        headers: new Headers(),
      })
      .mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok' }),
      });

    recordAuditEvent({
      actorId: 'user-2',
      actionType: 'login',
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await flushQueue(true);
    let queue = await getAuditQueueSnapshot();
    expect(queue[0].attempts).toBe(1);
    expect(queue[0].status).toBe('pending');

    await flushQueue(true);
    queue = await getAuditQueueSnapshot();
    expect(queue.length).toBe(0);
  });
});

