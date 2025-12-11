/**
 * Connection pooling and resource management utilities
 */
import { recordLoopHeartbeat } from '@/guardian/heartbeat';

interface PooledConnection {
  id: string;
  inUse: boolean;
  lastUsed: number;
  cleanup?: () => void;
}

class ConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private maxConnections: number;
  private idleTimeout: number;

  constructor(maxConnections = 10, idleTimeout = 60000) {
    this.maxConnections = maxConnections;
    this.idleTimeout = idleTimeout;
    
    // Clean up idle connections periodically
    setInterval(() => {
      this.cleanupIdleConnections();
      recordLoopHeartbeat('connection-pool-cleanup');
    }, 30000);
  }

  acquire(id: string): boolean {
    let connection = this.connections.get(id);

    if (!connection) {
      if (this.connections.size >= this.maxConnections) {
        this.evictLeastRecentlyUsed();
      }

      connection = {
        id,
        inUse: true,
        lastUsed: Date.now(),
      };
      this.connections.set(id, connection);
      return true;
    }

    if (connection.inUse) {
      return false;
    }

    connection.inUse = true;
    connection.lastUsed = Date.now();
    return true;
  }

  release(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
    }
  }

  remove(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.cleanup?.();
      this.connections.delete(id);
    }
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    for (const [id, connection] of this.connections.entries()) {
      if (!connection.inUse && now - connection.lastUsed > this.idleTimeout) {
        this.remove(id);
      }
    }
  }

  private evictLeastRecentlyUsed(): void {
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [id, connection] of this.connections.entries()) {
      if (!connection.inUse && connection.lastUsed < oldestTime) {
        oldestTime = connection.lastUsed;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.remove(oldestId);
    }
  }

  getStats() {
    const inUse = Array.from(this.connections.values()).filter(c => c.inUse).length;
    return {
      total: this.connections.size,
      inUse,
      idle: this.connections.size - inUse,
      maxConnections: this.maxConnections,
    };
  }
}

export const connectionPool = new ConnectionPool();
