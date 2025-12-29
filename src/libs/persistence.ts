/**
 * Small persistence adapter with IndexedDB first, then localStorage, then in-memory.
 * All APIs are Promise-based for consistency.
 */

const DB_NAME = 'omnilink-cache';
const STORE_NAME = 'kv';

const inMemoryStore = new Map<string, unknown>();
let dbPromise: Promise<IDBDatabase> | null = null;

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

async function getDb(): Promise<IDBDatabase | null> {
  if (!hasIndexedDB()) return null;
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  }).catch(() => null);

  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await getDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => resolve(null);
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await getDb();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export async function persistentGet<T>(key: string): Promise<T | null> {
  const idbValue = await idbGet<T>(key);
  if (idbValue !== null && idbValue !== undefined) return idbValue;

  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // ignore
    }
  }

  return (inMemoryStore.get(key) as T) ?? null;
}

export async function persistentSet<T>(key: string, value: T): Promise<void> {
  await idbSet(key, value);
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  } else {
    inMemoryStore.set(key, value);
  }
}

export async function persistentDelete(key: string): Promise<void> {
  await idbDelete(key);
  if (hasLocalStorage()) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  inMemoryStore.delete(key);
}

