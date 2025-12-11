export interface AuditEventPayload {
  id: string;
  timestamp: string;
  actorId?: string;
  actionType: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export interface AuditEventEnvelope {
  event: AuditEventPayload;
}

export interface DeviceInfo {
  device_info: Record<string, any>;
  last_seen: string;
  device_id: string;
  user_id: string;
}

export interface DeviceRegistryResponse {
  devices: DeviceInfo[];
}

export interface LovableClientConfig {
  baseUrl: string;
  apiKey: string;
  serviceRoleKey?: string;
}

export interface LovableRequestOptions {
  path: string;
  method?: 'GET' | 'POST';
  body?: any;
  signal?: AbortSignal;
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export interface LovableErrorBody {
  error: string;
  message?: string;
  status?: number;
}

