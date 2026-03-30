"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import {
  getPendingSyncQueueItems,
  getSyncQueue,
  subscribeToSyncQueue,
  type SyncQueueItem,
} from "@/lib/offline/sync-queue";
import { processSyncQueue } from "@/lib/offline/sync-runner";

export type OfflineContextValue = {
  isOnline: boolean;
  isOfflineMode: boolean;
  lastChangedAt: number;
  isDesktop: boolean;
  isOfflineCapable: boolean;
  queuedItems: SyncQueueItem[];
  pendingItems: SyncQueueItem[];
  queuedCount: number;
  pendingCount: number;
  refreshQueue: () => void;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

function getBrowserOnlineState(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const runtime = getRuntimeConfig();
  const [isOnline, setIsOnline] = useState(getBrowserOnlineState);
  const [lastChangedAt, setLastChangedAt] = useState(Date.now());
  const [queuedItems, setQueuedItems] = useState<SyncQueueItem[]>(() => getSyncQueue());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastChangedAt(Date.now());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastChangedAt(Date.now());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOnline, queuedItems.length]);

  const value = useMemo<OfflineContextValue>(() => {
    const pendingItems = getPendingSyncQueueItems();

    return {
      isOnline,
      isOfflineMode: !isOnline,
      lastChangedAt,
      isDesktop: runtime.isDesktop,
      isOfflineCapable: runtime.isOfflineCapable,
      queuedItems,
      pendingItems,
      queuedCount: queuedItems.length,
      pendingCount: pendingItems.length,
      refreshQueue: () => {
        setQueuedItems(getSyncQueue());
      },
    };
  }, [isOnline, lastChangedAt, queuedItems, runtime.isDesktop, runtime.isOfflineCapable]);

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const context = useContext(OfflineContext);

  if (!context) {
    throw new Error("useOffline debe usarse dentro de OfflineProvider.");
  }

  return context;
}
