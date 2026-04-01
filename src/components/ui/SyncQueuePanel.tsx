"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  RefreshCw,
  RotateCcw,
  Trash2,
  Unplug,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useOffline } from "@/lib/offline/network-state";
import { discardAllFailedSyncEvents } from "@/features/sync/api/sync";
import {
  clearFailedSyncQueueItems,
  markSyncQueueItemPending,
  removeSyncQueueItem,
} from "@/lib/offline/sync-queue";
import { processSyncQueue } from "@/lib/offline/sync-runner";

function formatQueueDate(value: number) {
  return new Date(value).toLocaleString("es-MX");
}

function summarizeQueueItem(
  scope: string,
  entityType: string,
  operation: string,
) {
  return `${scope} · ${entityType} · ${operation}`;
}

function extractLastSyncError(lastRunResult: Record<string, unknown> | null) {
  if (!lastRunResult || lastRunResult.status !== "failed") {
    return null;
  }

  return (
    (typeof lastRunResult.message === "string" && lastRunResult.message) ||
    (typeof (lastRunResult.push as { error?: unknown } | undefined)?.error ===
      "string" &&
      (lastRunResult.push as { error?: string }).error) ||
    (typeof (lastRunResult.pull as { error?: unknown } | undefined)?.error ===
      "string" &&
      (lastRunResult.pull as { error?: string }).error) ||
    null
  );
}

export default function SyncQueuePanel() {
  const {
    hasBackendConnection,
    hasInternetConnection,
    isDesktop,
    queuedItems,
    pendingCount,
    localPendingCount,
    localFailedCount,
    failedCount,
    backendSyncStatus,
    backendOutboxSummary,
    backendPendingCount,
    backendFailedCount,
    backendProcessingCount,
    refreshQueue,
    runBackendSync,
  } = useOffline();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const statusConfig = hasBackendConnection
    ? hasInternetConnection
      ? {
          icon: <Wifi className="h-4 w-4" />,
          label: "Backend e internet activos",
          detail:
            "La cola se puede procesar en cuanto haya operaciones pendientes.",
        }
      : {
          icon: <Unplug className="h-4 w-4" />,
          label: isDesktop ? "Backend local activo" : "Internet inestable",
          detail: isDesktop
            ? "Puedes seguir trabajando en local. La sincronización con el servidor central puede quedar pendiente."
            : "La API sigue respondiendo, pero el equipo reporta conexión general sin internet.",
        }
    : {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: "Backend no disponible",
        detail:
          "La cola permanecerá en espera hasta que la API vuelva a responder.",
      };

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

  const lastSyncError = extractLastSyncError(
    backendSyncStatus?.lastRunResult ?? null,
  );
  const lastRunAtLabel = backendSyncStatus?.lastRunAt
    ? new Date(backendSyncStatus.lastRunAt).toLocaleString("es-MX")
    : null;

  if (!isDesktop) {
    return null;
  }

  const handleRetryAll = async () => {
    setIsProcessing(true);
    await processSyncQueue();
    const backendResult = await runBackendSync();

    if (!backendResult.ok) {
      toast.error(
        backendResult.errors[0] ?? "No se pudo sincronizar con el backend.",
      );
    } else {
      toast.success("Sincronización ejecutada.");
    }

    refreshQueue();
    setIsProcessing(false);
  };

  const handleClearFailed = () => {
    void (async () => {
      setIsProcessing(true);

      let clearedLocal = false;
      if (localFailedCount > 0) {
        clearFailedSyncQueueItems();
        clearedLocal = true;
      }

      let discardedBackend = 0;
      if (backendFailedCount > 0) {
        const confirmed =
          typeof window === "undefined"
            ? true
            : window.confirm(
                "Esto borrará los eventos fallidos del backend local. Si contenían cambios no sincronizados, se perderán. ¿Quieres continuar?",
              );

        if (!confirmed) {
          setIsProcessing(false);
          refreshQueue();
          return;
        }

        const response = await discardAllFailedSyncEvents();
        if (!response.ok) {
          setIsProcessing(false);
          refreshQueue();
          toast.error(
            response.errors[0] ??
              "No se pudieron borrar los fallidos del backend local.",
          );
          return;
        }

        discardedBackend = response.data.affected;
      }

      refreshQueue();
      setIsProcessing(false);

      if (!clearedLocal && discardedBackend === 0) {
        toast.info("No había fallidos por borrar.");
        return;
      }

      toast.info(
        `Fallidos limpiados. Frontend: ${clearedLocal ? "si" : "no"} · Backend descartado: ${discardedBackend}.`,
      );
    })();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-[80] inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-sky-700 shadow-lg shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:bg-sky-50"
      >
        {statusConfig.icon}
        Cola sync
        {pendingCount > 0 ? (
          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
            {pendingCount}
          </span>
        ) : failedCount > 0 ? (
          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
            {failedCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed bottom-24 right-5 z-[80] w-[min(27rem,calc(100vw-2.5rem))] overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-2xl shadow-slate-300/40">
          <div className="border-b border-gray-200 bg-gradient-to-r from-white via-sky-50 to-white px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Cola de sincronización
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Pendientes: {pendingCount} · Local: {localPendingCount} ·
                  Backend: {backendPendingCount}
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  Fallidos por revisar: {failedCount} · Local:{" "}
                  {localFailedCount} · Backend: {backendFailedCount}
                </p>
                <p className="mt-2 text-xs font-medium text-sky-700">
                  {statusConfig.label}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {statusConfig.detail}
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
                disabled={!hasBackendConnection || isProcessing}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`}
                />
                {isProcessing ? "Sincronizando..." : "Sincronizar ahora"}
              </button>

              <button
                type="button"
                onClick={handleClearFailed}
                disabled={failedCount === 0 || isProcessing}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Borrar fallidos
              </button>
            </div>
          </div>

          <div className="max-h-[24rem] space-y-3 overflow-y-auto p-4">
            {lastSyncError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
                <p className="font-semibold">Último intento de sync fallido</p>
                <p className="mt-1">{lastSyncError}</p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-4 w-4 text-sky-700" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    Outbox del backend local
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-4">
                    <span>Pendientes: {backendPendingCount}</span>
                    <span>Procesando: {backendProcessingCount}</span>
                    <span>Fallidos: {backendFailedCount}</span>
                    <span>
                      Sincronizados: {backendOutboxSummary?.counts.synced ?? 0}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Runner:{" "}
                    {backendSyncStatus?.running
                      ? "sincronizando"
                      : backendSyncStatus?.autoEnabled
                        ? `automático cada ${backendSyncStatus.autoIntervalSeconds}s`
                        : "manual"}{" "}
                    · Remoto:{" "}
                    {backendSyncStatus?.remoteBaseUrlConfigured
                      ? "configurado"
                      : "sin configurar"}
                  </div>
                  {lastRunAtLabel ? (
                    <div className="mt-1 text-xs text-gray-500">
                      Último intento: {lastRunAtLabel}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {sortedItems.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                No hay operaciones pendientes en la cola local del frontend.
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
