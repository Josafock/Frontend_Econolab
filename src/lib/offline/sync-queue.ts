"use client";

import {
  readOfflineValue,
  writeOfflineRecord,
} from "@/lib/offline/offline-store";

export type SyncOperation = "create" | "update" | "delete" | "upsert" | "custom";
export type SyncQueueStatus = "pending" | "processing" | "failed";

export type SyncQueueItem<TPayload = unknown> = {
  id: string;
  scope: string;
  entityType: string;
  entityId?: string | number | null;
  operation: SyncOperation;
  payload: TPayload;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  status: SyncQueueStatus;
  lastError?: string | null;
};

export type EnqueueSyncItemInput<TPayload = unknown> = {
  scope: string;
  entityType: string;
  entityId?: string | number | null;
  operation: SyncOperation;
  payload: TPayload;
};

type SyncQueueListener = (items: SyncQueueItem[]) => void;

const SYNC_QUEUE_STORAGE_KEY = "sync:queue";

const listeners = new Set<SyncQueueListener>();

function generateQueueItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readQueue(): SyncQueueItem[] {
  return readOfflineValue<SyncQueueItem[]>(SYNC_QUEUE_STORAGE_KEY, []);
}

function writeQueue(items: SyncQueueItem[]): SyncQueueItem[] {
  writeOfflineRecord(SYNC_QUEUE_STORAGE_KEY, items);
  listeners.forEach((listener) => listener(items));
  return items;
}

export function getSyncQueue(): SyncQueueItem[] {
  return readQueue();
}

export function subscribeToSyncQueue(listener: SyncQueueListener): () => void {
  listeners.add(listener);
  listener(readQueue());

  return () => {
    listeners.delete(listener);
  };
}

export function enqueueSyncItem<TPayload = unknown>(
  input: EnqueueSyncItemInput<TPayload>,
): SyncQueueItem<TPayload> {
  const item: SyncQueueItem<TPayload> = {
    id: generateQueueItemId(),
    scope: input.scope,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    operation: input.operation,
    payload: input.payload,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attempts: 0,
    status: "pending",
    lastError: null,
  };

  writeQueue([...readQueue(), item]);
  return item;
}

export function updateSyncQueueItem(
  id: string,
  updates: Partial<Omit<SyncQueueItem, "id" | "createdAt">>,
): SyncQueueItem | null {
  let updatedItem: SyncQueueItem | null = null;

  const nextQueue = readQueue().map((item) => {
    if (item.id !== id) {
      return item;
    }

    updatedItem = {
      ...item,
      ...updates,
      updatedAt: Date.now(),
    };

    return updatedItem;
  });

  writeQueue(nextQueue);
  return updatedItem;
}

export function markSyncQueueItemProcessing(id: string): SyncQueueItem | null {
  return updateSyncQueueItem(id, {
    status: "processing",
    attempts: getSyncQueue().find((item) => item.id === id)?.attempts ?? 0,
    lastError: null,
  });
}

export function markSyncQueueItemFailed(
  id: string,
  errorMessage: string,
): SyncQueueItem | null {
  const currentAttempts = getSyncQueue().find((item) => item.id === id)?.attempts ?? 0;

  return updateSyncQueueItem(id, {
    status: "failed",
    attempts: currentAttempts + 1,
    lastError: errorMessage,
  });
}

export function markSyncQueueItemPending(id: string): SyncQueueItem | null {
  return updateSyncQueueItem(id, {
    status: "pending",
    lastError: null,
  });
}

export function removeSyncQueueItem(id: string): void {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function clearSyncQueue(): void {
  writeQueue([]);
}

export function getPendingSyncQueueItems(): SyncQueueItem[] {
  return readQueue().filter((item) => item.status === "pending" || item.status === "failed");
}
