import { describe, expect, it } from 'vitest';
import { getAuditEvents, recordAuditEvent } from '../../src/security/auditLog';

describe('audit log helper', () => {
  it('records audit events with metadata', () => {
    const entry = recordAuditEvent({
      actorId: 'user-1',
      actionType: 'config_change',
      resourceType: 'config',
      resourceId: 'guardian',
      metadata: { value: 'enabled' },
    });

    const events = getAuditEvents();
    expect(events.find((e) => e.id === entry.id)).toBeTruthy();
  });
});

