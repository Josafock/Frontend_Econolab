"use client";

import { authStore } from "@/lib/auth/auth-store";
import {
  getPendingSyncQueueItems,
  markSyncQueueItemFailed,
  markSyncQueueItemProcessing,
  removeSyncQueueItem,
  type SyncQueueItem,
} from "@/lib/offline/sync-queue";
import {
  createService,
  updateService,
  updateServiceStatus,
  type CreateServicePayload,
  type UpdateServicePayload,
} from "@/features/services/api/services";
import {
  updateStudyResult,
  type UpdateStudyResultPayload,
} from "@/features/results/api/results";

let isSyncRunning = false;

export const SYNC_QUEUE_EVENT = "econolab:sync-event";

export type SyncQueueEventDetail = {
  status: "completed" | "failed";
  item: SyncQueueItem;
  result?: unknown;
  error?: string;
};

function dispatchSyncQueueEvent(detail: SyncQueueEventDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<SyncQueueEventDetail>(SYNC_QUEUE_EVENT, { detail }));
}

async function processQueueItem(item: SyncQueueItem): Promise<unknown> {
  if (item.scope === "services" && item.entityType === "service-order") {
    if (item.operation === "create") {
      const response = await createService(item.payload as CreateServicePayload);
      if (!response.ok) {
        throw new Error(response.errors[0] ?? "No se pudo sincronizar el servicio.");
      }
      return response.data.data;
    }

    if (item.operation === "update") {
      if (typeof item.entityId !== "number" || item.entityId <= 0) {
        throw new Error("El identificador del servicio pendiente no es valido.");
      }

      const payload = item.payload as UpdateServicePayload;
      const statusOnly =
        Object.keys(payload).length === 1 && typeof payload.status === "string";

      const response = statusOnly
        ? await updateServiceStatus(item.entityId, payload.status!)
        : await updateService(item.entityId, payload);

      if (!response.ok) {
        throw new Error(
          response.errors[0] ?? "No se pudo sincronizar la actualizacion del servicio.",
        );
      }
      return response.data.data;
    }
  }

  if (item.scope === "results" && item.entityType === "study-result") {
    if (item.operation !== "update") {
      throw new Error("Operacion de resultados no soportada para sincronizacion.");
    }

    if (typeof item.entityId !== "number" || item.entityId <= 0) {
      throw new Error("El identificador del resultado pendiente no es valido.");
    }

    const response = await updateStudyResult(
      item.entityId,
      item.payload as UpdateStudyResultPayload,
    );
    if (!response.ok) {
      throw new Error(
        response.errors[0] ?? "No se pudo sincronizar la actualizacion del resultado.",
      );
    }
    return response.data.data;
  }

  throw new Error("No existe un sincronizador para esta operacion.");
}

export async function processSyncQueue(): Promise<void> {
  if (isSyncRunning) {
    return;
  }

  const token = await authStore.getToken();
  if (!token) {
    return;
  }

  isSyncRunning = true;

  try {
    const pendingItems = getPendingSyncQueueItems();

    for (const item of pendingItems) {
      markSyncQueueItemProcessing(item.id);

      try {
        const result = await processQueueItem(item);
        removeSyncQueueItem(item.id);
        dispatchSyncQueueEvent({
          status: "completed",
          item,
          result,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo sincronizar el cambio.";
        markSyncQueueItemFailed(
          item.id,
          message,
        );
        dispatchSyncQueueEvent({
          status: "failed",
          item,
          error: message,
        });
      }
    }
  } finally {
    isSyncRunning = false;
  }
}
