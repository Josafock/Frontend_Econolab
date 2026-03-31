import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";

export type SyncRunnerStatus = {
  running: boolean;
  autoEnabled: boolean;
  remoteBaseUrlConfigured: boolean;
  autoIntervalSeconds: number;
  lastRunAt: string | null;
  lastRunResult: Record<string, unknown> | null;
};

export type SyncOutboxSummary = {
  outboxEnabled: boolean;
  counts: {
    pending: number;
    processing: number;
    failed: number;
    synced: number;
  };
  nextAvailableAt: string | null;
  resources?: Record<
    string,
    {
      total: number;
      pendingSync: number;
    }
  >;
};

export type RunSyncCycleResult = {
  status: string;
  reason?: string;
  remoteBaseUrl?: string;
  push?: {
    claimed: number;
    synced: number;
    failed: number;
    error?: string;
  };
  pull?: {
    claimed: number;
    synced: number;
    failed: number;
    error?: string;
  };
  message?: string;
};

async function createSyncRequestContext() {
  const token = await authStore.getToken();
  const runtime = getRuntimeConfig();

  if (!token) {
    return null;
  }

  return {
    baseUrl: runtime.apiBaseUrl,
    token,
  };
}

export async function getSyncStatus(): Promise<ApiResult<SyncRunnerStatus>> {
  const context = await createSyncRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<SyncRunnerStatus>(context, "/sync/status");
}

export async function getSyncOutboxSummary(): Promise<ApiResult<SyncOutboxSummary>> {
  const context = await createSyncRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<SyncOutboxSummary>(context, "/sync/outbox/summary");
}

export async function runSyncCycle(params?: {
  pushLimit?: number;
  pullLimit?: number;
}): Promise<ApiResult<RunSyncCycleResult>> {
  const context = await createSyncRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<RunSyncCycleResult>(context, "/sync/run", {
    method: "POST",
    body: JSON.stringify({
      pushLimit: params?.pushLimit,
      pullLimit: params?.pullLimit,
    }),
  });
}

export async function requeueAllFailedSyncEvents(): Promise<
  ApiResult<{ message: string; affected: number }>
> {
  const context = await createSyncRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<{ message: string; affected: number }>(
    context,
    "/sync/outbox/requeue-failed-all",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export async function discardAllFailedSyncEvents(): Promise<
  ApiResult<{ message: string; affected: number }>
> {
  const context = await createSyncRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<{ message: string; affected: number }>(
    context,
    "/sync/outbox/discard-failed-all",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}
