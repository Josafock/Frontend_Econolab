"use client";

export type OfflineRecord<T> = {
  value: T;
  updatedAt: number;
};

const OFFLINE_STORAGE_PREFIX = "econolab.offline";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function buildStorageKey(key: string): string {
  return `${OFFLINE_STORAGE_PREFIX}:${key}`;
}

function safeRead<T>(key: string): T | null {
  if (!hasWindow()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readOfflineRecord<T>(key: string): OfflineRecord<T> | null {
  return safeRead<OfflineRecord<T>>(buildStorageKey(key));
}

export function writeOfflineRecord<T>(
  key: string,
  value: T,
): OfflineRecord<T> {
  const record: OfflineRecord<T> = {
    value,
    updatedAt: Date.now(),
  };

  safeWrite(buildStorageKey(key), record);
  return record;
}

export function removeOfflineRecord(key: string): void {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(buildStorageKey(key));
}

export function readOfflineValue<T>(key: string, fallback: T): T {
  return readOfflineRecord<T>(key)?.value ?? fallback;
}

export function listOfflineKeys(prefix?: string): string[] {
  if (!hasWindow()) {
    return [];
  }

  const normalizedPrefix = prefix ? buildStorageKey(prefix) : OFFLINE_STORAGE_PREFIX;
  const keys: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(normalizedPrefix)) {
      continue;
    }

    keys.push(key.replace(`${OFFLINE_STORAGE_PREFIX}:`, ""));
  }

  return keys.sort();
}

export function clearOfflineKeys(prefix?: string): void {
  if (!hasWindow()) {
    return;
  }

  for (const key of listOfflineKeys(prefix)) {
    removeOfflineRecord(key);
  }
}

export function writeOfflineSnapshot<T>(key: string, value: T): OfflineRecord<T> {
  return writeOfflineRecord(`snapshots:${key}`, value);
}

export function readOfflineSnapshot<T>(key: string): OfflineRecord<T> | null {
  return readOfflineRecord<T>(`snapshots:${key}`);
}
