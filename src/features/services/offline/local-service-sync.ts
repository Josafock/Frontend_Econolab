import type {
  CreateServicePayload,
  UpdateServicePayload,
} from "@/features/services/api/services";
import {
  getSyncQueue,
  updateSyncQueueItem,
  type SyncQueueItem,
} from "@/lib/offline/sync-queue";

export function isLocalServiceId(serviceId: number): boolean {
  return serviceId < 0;
}

export function buildLocalServiceDetailSnapshotKey(serviceId: number): string {
  return `services:detail:${serviceId}`;
}

function findPendingLocalServiceCreateItem(
  localServiceId: number,
): SyncQueueItem<CreateServicePayload> | null {
  return (
    (getSyncQueue().find(
      (item) =>
        item.scope === "services" &&
        item.entityType === "service-order" &&
        item.operation === "create" &&
        item.entityId === localServiceId,
    ) as SyncQueueItem<CreateServicePayload> | undefined) ?? null
  );
}

function mergeCreatePayload(
  current: CreateServicePayload,
  updates: UpdateServicePayload,
): CreateServicePayload {
  const nextPayload: CreateServicePayload = {
    ...current,
  };

  if ("folio" in updates && updates.folio !== undefined) {
    nextPayload.folio = updates.folio;
  }

  if ("autoGenerateFolio" in updates) {
    nextPayload.autoGenerateFolio = updates.autoGenerateFolio;
  }

  if ("patientId" in updates && updates.patientId !== undefined) {
    nextPayload.patientId = updates.patientId;
  }

  if ("doctorId" in updates) {
    if (updates.doctorId === undefined) {
      delete nextPayload.doctorId;
    } else {
      nextPayload.doctorId = updates.doctorId;
    }
  }

  if ("branchName" in updates) {
    if (updates.branchName === undefined) {
      delete nextPayload.branchName;
    } else {
      nextPayload.branchName = updates.branchName;
    }
  }

  if ("sampleAt" in updates) {
    if (updates.sampleAt === undefined) {
      delete nextPayload.sampleAt;
    } else {
      nextPayload.sampleAt = updates.sampleAt;
    }
  }

  if ("deliveryAt" in updates) {
    if (updates.deliveryAt === undefined) {
      delete nextPayload.deliveryAt;
    } else {
      nextPayload.deliveryAt = updates.deliveryAt;
    }
  }

  if ("status" in updates) {
    if (updates.status === undefined) {
      delete nextPayload.status;
    } else {
      nextPayload.status = updates.status;
    }
  }

  if ("courtesyPercent" in updates) {
    if (updates.courtesyPercent === undefined) {
      delete nextPayload.courtesyPercent;
    } else {
      nextPayload.courtesyPercent = updates.courtesyPercent;
    }
  }

  if ("notes" in updates) {
    if (updates.notes === undefined) {
      delete nextPayload.notes;
    } else {
      nextPayload.notes = updates.notes;
    }
  }

  if ("items" in updates && updates.items !== undefined) {
    nextPayload.items = updates.items;
  }

  return nextPayload;
}

export function mergeLocalServiceCreatePayload(
  localServiceId: number,
  updates: UpdateServicePayload,
): boolean {
  const existingItem = findPendingLocalServiceCreateItem(localServiceId);

  if (!existingItem) {
    return false;
  }

  const nextPayload = mergeCreatePayload(existingItem.payload, updates);
  updateSyncQueueItem(existingItem.id, {
    payload: nextPayload,
    status: "pending",
    lastError: null,
  });
  return true;
}
