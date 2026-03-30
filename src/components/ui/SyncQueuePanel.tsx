"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Unplug,
  Wifi,
  X,
} from "lucide-react";
import { useOffline } from "@/lib/offline/network-state";
import {
  markSyncQueueItemPending,
  removeSyncQueueItem,
} from "@/lib/offline/sync-queue";
import { processSyncQueue } from "@/lib/offline/sync-runner";

function formatQueueDate(value: number) {
  return new Date(value).toLocaleString("es-MX");
}

function summarizeQueueItem(scope: string, entityType: string, operation: string) {
  return `${scope} · ${entityType} · ${operation}`;
}

export default function SyncQueuePanel() {
  const { isOnline, queuedItems, pendingCount, refreshQueue } = useOffline();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const sortedItems = useMemo(
    () =>
      [...queuedItems].sort((a, b) => {
        if (a.status === b.status) {
          return b.updatedAt - a.updatedAt;
        }

        if (a.status === "failed") return -1;
        if (b.status === "failed") return 1;
        if (a.status === "processing") return -1;
        if (b.status === "processing") return 1;
        return b.updatedAt - a.updatedAt;
      }),
    [queuedItems],
  );

  const handleRetryAll = async () => {
    setIsProcessing(true);
    await processSyncQueue();
    refreshQueue();
    setIsProcessing(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-[80] inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-sky-700 shadow-lg shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:bg-sky-50"
      >
        {isOnline ? <Wifi className="h-4 w-4" /> : <Unplug className="h-4 w-4" />}
        Cola sync
        {queuedItems.length > 0 ? (
          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
            {queuedItems.length}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed bottom-24 right-5 z-[80] w-[min(26rem,calc(100vw-2.5rem))] overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-2xl shadow-slate-300/40">
          <div className="border-b border-gray-200 bg-gradient-to-r from-white via-sky-50 to-white px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Cola de sincronizacion
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Pendientes: {pendingCount} · Total: {queuedItems.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleRetryAll()}
                disabled={!isOnline || isProcessing || queuedItems.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
                {isProcessing ? "Sincronizando..." : "Sincronizar ahora"}
              </button>
            </div>
          </div>

          <div className="max-h-[24rem] space-y-3 overflow-y-auto p-4">
            {sortedItems.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                No hay operaciones pendientes.
              </div>
            ) : (
              sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {summarizeQueueItem(
                          item.scope,
                          item.entityType,
                          item.operation,
                        )}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Actualizado: {formatQueueDate(item.updatedAt)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.status === "failed"
                          ? "bg-rose-100 text-rose-700"
                          : item.status === "processing"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status === "failed" ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : item.status === "processing" ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      {item.status}
                    </span>
                  </div>

                  {item.lastError ? (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                      {item.lastError}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.status === "failed" ? (
                      <button
                        type="button"
                        onClick={() => {
                          markSyncQueueItemPending(item.id);
                          refreshQueue();
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reintentar
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        removeSyncQueueItem(item.id);
                        refreshQueue();
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Quitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
