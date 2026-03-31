"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { probeBackendAvailability } from "@/lib/runtime/backend-availability";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import {
  getFailedSyncQueueItems,
  getPendingSyncQueueItems,
  getSyncQueue,
  subscribeToSyncQueue,
  type SyncQueueItem,
} from "@/lib/offline/sync-queue";
import { processSyncQueue } from "@/lib/offline/sync-runner";
import {
  getSyncOutboxSummary,
  getSyncStatus,
  runSyncCycle,
  type RunSyncCycleResult,
  type SyncOutboxSummary,
  type SyncRunnerStatus,
} from "@/features/sync/api/sync";

export type OfflineContextValue = {
  isOnline: boolean;
  isOfflineMode: boolean;
  lastChangedAt: number;
  hasInternetConnection: boolean;
  hasBackendConnection: boolean;
  isDesktop: boolean;
  isOfflineCapable: boolean;
  queuedItems: SyncQueueItem[];
  pendingItems: SyncQueueItem[];
  queuedCount: number;
  localPendingCount: number;
  localFailedCount: number;
  pendingCount: number;
  failedCount: number;
  backendSyncStatus: SyncRunnerStatus | null;
  backendOutboxSummary: SyncOutboxSummary | null;
  backendPendingCount: number;
  backendFailedCount: number;
  backendProcessingCount: number;
  refreshQueue: () => void;
  refreshSyncState: () => Promise<void>;
  runBackendSync: () => Promise<
    { ok: true; result: RunSyncCycleResult | null } | { ok: false; errors: string[] }
  >;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

function getBrowserOnlineState(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const runtime = useMemo(() => getRuntimeConfig(), []);
  const [hasInternetConnection, setHasInternetConnection] = useState(getBrowserOnlineState);
  const [isOnline, setIsOnline] = useState(
    () =>
      runtime.isDesktop
        ? Boolean(runtime.apiBaseUrl)
        : Boolean(runtime.apiBaseUrl) && getBrowserOnlineState(),
  );
  const [lastChangedAt, setLastChangedAt] = useState(Date.now());
  const [queuedItems, setQueuedItems] = useState<SyncQueueItem[]>(() => getSyncQueue());
  const [backendSyncStatus, setBackendSyncStatus] = useState<SyncRunnerStatus | null>(null);
  const [backendOutboxSummary, setBackendOutboxSummary] = useState<SyncOutboxSummary | null>(null);

  const refreshSyncState = useCallback(async () => {
    if (!runtime.apiBaseUrl) {
      setBackendSyncStatus(null);
      setBackendOutboxSummary(null);
      return;
    }

    const [statusResponse, outboxResponse] = await Promise.all([
      getSyncStatus(),
      getSyncOutboxSummary(),
    ]);

    setBackendSyncStatus(statusResponse.ok ? statusResponse.data : null);
    setBackendOutboxSummary(outboxResponse.ok ? outboxResponse.data : null);
  }, [runtime.apiBaseUrl]);

  useEffect(() => {
    let cancelled = false;

    const applyBackendState = (reachable: boolean) => {
      setIsOnline((current) => {
        if (current === reachable) {
          return current;
        }

        setLastChangedAt(Date.now());
        return reachable;
      });
    };

    const probeBackend = async () => {
      const reachable = await probeBackendAvailability(runtime.apiBaseUrl, {
        timeoutMs: runtime.isDesktop ? 1500 : 2500,
      });

      if (!cancelled) {
        applyBackendState(reachable);
        if (reachable) {
          await refreshSyncState();
        } else {
          setBackendSyncStatus(null);
          setBackendOutboxSummary(null);
        }
      }
    };

    const handleOnline = () => {
      setHasInternetConnection(true);
      setLastChangedAt(Date.now());
      void probeBackend();
    };

    const handleOffline = () => {
      setHasInternetConnection(false);
      setLastChangedAt(Date.now());
      void probeBackend();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    void probeBackend();
    const probeIntervalId = window.setInterval(() => {
      void probeBackend();
    }, runtime.isDesktop ? 4000 : 10000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.clearInterval(probeIntervalId);
    };
  }, [refreshSyncState, runtime.apiBaseUrl, runtime.isDesktop]);

  useEffect(() => {
    return subscribeToSyncQueue((items) => {
      setQueuedItems(items);
    });
  }, []);

  useEffect(() => {
    if (!isOnline || queuedItems.length === 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      await processSyncQueue();
      if (!cancelled) {
        setQueuedItems(getSyncQueue());
        await refreshSyncState();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOnline, queuedItems.length, refreshSyncState]);

  const value = useMemo<OfflineContextValue>(() => {
    const pendingItems = getPendingSyncQueueItems();
    const failedItems = getFailedSyncQueueItems();
    const localPendingCount = pendingItems.length;
    const localFailedCount = failedItems.length;
    const backendPendingCount = backendOutboxSummary?.counts.pending ?? 0;
    const backendFailedCount = backendOutboxSummary?.counts.failed ?? 0;
    const backendProcessingCount = backendOutboxSummary?.counts.processing ?? 0;

    return {
      isOnline,
      isOfflineMode: !isOnline,
      lastChangedAt,
      hasInternetConnection,
      hasBackendConnection: isOnline,
      isDesktop: runtime.isDesktop,
      isOfflineCapable: runtime.isOfflineCapable,
      queuedItems,
      pendingItems,
      queuedCount: queuedItems.length,
      localPendingCount,
      localFailedCount,
      pendingCount: localPendingCount + backendPendingCount,
      failedCount: localFailedCount + backendFailedCount,
      backendSyncStatus,
      backendOutboxSummary,
      backendPendingCount,
      backendFailedCount,
      backendProcessingCount,
      refreshQueue: () => {
        setQueuedItems(getSyncQueue());
        void refreshSyncState();
      },
      refreshSyncState,
      runBackendSync: async () => {
        const response = await runSyncCycle({ pushLimit: 100, pullLimit: 100 });
        await refreshSyncState();

        if (!response.ok) {
          return { ok: false, errors: response.errors };
        }

        const syncResult = response.data;
        if (syncResult.status !== "completed") {
          return {
            ok: false,
            errors: [
              syncResult.message ??
                syncResult.pull?.error ??
                syncResult.push?.error ??
                "No se pudo completar la sincronizacion con el servidor central.",
            ],
          };
        }

        return { ok: true, result: syncResult };
      },
    };
  }, [
    backendOutboxSummary,
    backendSyncStatus,
    hasInternetConnection,
    isOnline,
    lastChangedAt,
    queuedItems,
    refreshSyncState,
    runtime.isDesktop,
    runtime.isOfflineCapable,
  ]);

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const context = useContext(OfflineContext);

  if (!context) {
    throw new Error("useOffline debe usarse dentro de OfflineProvider.");
  }

  return context;
}
