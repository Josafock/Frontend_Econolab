"use client";

import { AlertTriangle, Database, Unplug } from "lucide-react";
import { formatDateTime } from "@/helpers/date";
import { useOffline } from "@/lib/offline/network-state";

type ConnectionStatusBannerProps = {
  showSnapshot?: boolean;
  snapshotMessage: string;
  emptySnapshotMessage: string;
  snapshotUpdatedAt: number | null;
  pendingCount?: number;
};

export default function ConnectionStatusBanner({
  showSnapshot = false,
  snapshotMessage,
  emptySnapshotMessage,
  snapshotUpdatedAt,
  pendingCount = 0,
}: ConnectionStatusBannerProps) {
  const {
    hasBackendConnection,
    hasInternetConnection,
    isDesktop,
  } = useOffline();

  const isWorkingLocally =
    isDesktop && hasBackendConnection && !hasInternetConnection && !showSnapshot;
  const isBackendUnavailable = !hasBackendConnection;

  if (!showSnapshot && !isWorkingLocally && !isBackendUnavailable) {
    return null;
  }

  const toneClasses = isWorkingLocally
    ? {
        container: "border-sky-200 bg-sky-50 text-sky-900",
        badge: "bg-sky-100 text-sky-800",
        meta: "text-sky-800",
      }
    : {
        container: "border-amber-200 bg-amber-50 text-amber-900",
        badge: "bg-amber-100 text-amber-800",
        meta: "text-amber-800",
      };

  const header = showSnapshot
    ? snapshotMessage
    : isWorkingLocally
      ? "Backend local activo."
      : "Backend no disponible.";

  const description = showSnapshot
    ? hasBackendConnection
      ? "No se pudo refrescar esta vista desde el backend. Se muestra la ultima copia local disponible."
      : "Se muestra la ultima copia local porque el backend no esta disponible."
    : isWorkingLocally
      ? "Puedes seguir operando localmente aunque no haya internet. La sincronizacion con el servidor central se retomara cuando vuelva la conexion."
      : emptySnapshotMessage;

  const badgeLabel = showSnapshot
    ? "Copia local"
    : isWorkingLocally
      ? "Modo local"
      : "Sin backend";

  const metaLabel = isWorkingLocally
    ? "Trabajando contra el backend local de este equipo."
    : snapshotUpdatedAt
      ? `Ultima copia local: ${formatDateTime(
          new Date(snapshotUpdatedAt).toISOString(),
        )}`
      : "Aun no hay copia local disponible.";

  return (
    <div
      className={`mb-4 rounded-[1.5rem] border px-4 py-3 text-sm shadow-sm ${toneClasses.container}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          {showSnapshot ? (
            <Database className="mt-0.5 h-4 w-4 shrink-0" />
          ) : isWorkingLocally ? (
            <Unplug className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            <p className="font-semibold">{header}</p>
            <p className="mt-1 text-xs">{description}</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses.badge}`}
          >
            {badgeLabel}
          </span>
          <span className={`text-xs font-medium ${toneClasses.meta}`}>
            {metaLabel}
          </span>
        </div>
      </div>

      {pendingCount > 0 ? (
        <p className={`mt-2 text-xs ${toneClasses.meta}`}>
          Operaciones pendientes en cola: {pendingCount}
        </p>
      ) : null}
    </div>
  );
}
