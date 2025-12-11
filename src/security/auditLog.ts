export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId?: string;
  actionType: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

const auditEvents: AuditEvent[] = [];

export function recordAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  const entry: AuditEvent = {
    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    ...event,
  };
  auditEvents.push(entry);
  if (auditEvents.length > 200) {
    auditEvents.shift();
  }
  return entry;
}

export function getAuditEvents(limit = 50): AuditEvent[] {
  return auditEvents.slice(-limit).reverse();
}

