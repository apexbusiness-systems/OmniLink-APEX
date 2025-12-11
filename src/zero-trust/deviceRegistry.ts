export type DeviceStatus = 'trusted' | 'suspect' | 'blocked';

export interface DeviceRecord {
  deviceId: string;
  userId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  deviceFingerprint: string;
  status: DeviceStatus;
}

const registry = new Map<string, DeviceRecord>();

export function registerDevice(userId: string, deviceId: string, deviceFingerprint: string): DeviceRecord {
  const existing = registry.get(deviceId);
  const now = Date.now();
  if (existing) {
    existing.lastSeenAt = now;
    return existing;
  }
  const record: DeviceRecord = {
    deviceId,
    userId,
    firstSeenAt: now,
    lastSeenAt: now,
    deviceFingerprint,
    status: 'suspect',
  };
  registry.set(deviceId, record);
  return record;
}

export function markDeviceTrusted(deviceId: string): DeviceRecord | undefined {
  const record = registry.get(deviceId);
  if (record) {
    record.status = 'trusted';
    record.lastSeenAt = Date.now();
  }
  return record;
}

export function markDeviceBlocked(deviceId: string): DeviceRecord | undefined {
  const record = registry.get(deviceId);
  if (record) {
    record.status = 'blocked';
    record.lastSeenAt = Date.now();
  }
  return record;
}

export function getDevice(deviceId: string): DeviceRecord | undefined {
  return registry.get(deviceId);
}

export function listDevices(): DeviceRecord[] {
  return Array.from(registry.values());
}

