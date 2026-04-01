"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Clock3,
  Eye,
  Filter,
  Loader2,
  Plus,
  Search,
  Ticket,
  TimerReset,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { CollectionContentSkeleton } from "@/components/ui/PageSkeletons";
import ResultsPdfOptionsModal from "@/components/servicios/ResultsPdfOptionsModal";
import ConnectionStatusBanner from "@/components/ui/ConnectionStatusBanner";
import EntityActionsMenu from "@/components/ui/EntityActionsMenu";
import {
  TableColumnFilterInput,
  TableColumnFilterSelect,
} from "@/components/ui/TableColumnFilters";
import TablePagination from "@/components/ui/TablePagination";
import { SERVICE_BRANCH_OPTIONS } from "@/components/servicios/serviceFormUtils";
import { useServicesData, type ServicesFilters } from "@/hooks/useServicesData";
import type { ServiceStatus } from "@/features/services/api/services";
import {
  getServiceLabelsFile,
  getServiceReceiptFile,
  getServiceTicketFile,
} from "@/features/services/api/service-documents";
import { appFileService } from "@/lib/files/file-service";
import { useOffline } from "@/lib/offline/network-state";
import { buildServiceDetailHref } from "@/lib/routes/detail-routes";
import { toast } from "react-toastify";

const AddServiceModal = dynamic(
  () => import("@/components/servicios/AgregarServicioModal"),
);

const statusOptions: Array<{
  value: ServicesFilters["status"];
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "in_progress", label: "En curso" },
  { value: "delayed", label: "Retrasados" },
  { value: "completed", label: "Concluidos" },
  { value: "cancelled", label: "Cancelados" },
];

const getStatusColor = (status: ServiceStatus): string => {
  const colors = {
    pending: "border-blue-200 bg-blue-50 text-blue-700",
    in_progress: "border-orange-200 bg-orange-50 text-orange-700",
    delayed: "border-amber-200 bg-amber-50 text-amber-700",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cancelled: "border-red-200 bg-red-50 text-red-700",
  } as const;
  return colors[status] || "border-gray-200 bg-gray-50 text-gray-700";
};

const statusLabel = (status: ServiceStatus) => {
  const labels = {
    pending: "Pendiente",
    in_progress: "En curso",
    delayed: "Retrasado",
    completed: "Concluido",
    cancelled: "Cancelado",
  } as const;
  return labels[status] || status;
};

function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase();
}

function matchesTextColumn(values: string[], filterValue: string) {
  const normalizedFilter = normalizeFilterValue(filterValue);
  if (!normalizedFilter) return true;

  return values.some((value) =>
    value.toLowerCase().includes(normalizedFilter),
  );
}

function matchesDateColumn(value: string, filterValue: string) {
  if (!filterValue) return true;

  const normalizedValue = value.length >= 10 ? value.slice(0, 10) : value;
  return normalizedValue === filterValue;
}

export default function ServiciosPage() {
  const { isOnline, pendingCount } = useOffline();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState({
    folio: "",
    studies: "",
    patient: "",
    branch: "all",
    createdAt: "",
    deliveryAt: "",
    total: "",
    status: "all",
  });
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [resultsPdfTarget, setResultsPdfTarget] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const [filters, setFilters] = useState<ServicesFilters>({
    status: "all",
    branchName: "all",
    fromDate: "",
    toDate: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    services,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    catalogs,
    catalogsLoading,
    dataSource,
    snapshotUpdatedAt,
    loadFormCatalogs,
    saveService,
    changeServiceStatus,
  } = useServicesData(searchTerm, filters);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters, columnFilters]);

  const filteredServices = useMemo(
    () =>
      services.filter(
        (service) =>
          matchesTextColumn([service.folio], columnFilters.folio) &&
          matchesTextColumn([service.estudio], columnFilters.studies) &&
          matchesTextColumn([service.paciente, service.telefono], columnFilters.patient) &&
          (columnFilters.branch === "all"
            ? true
            : service.sucursal === columnFilters.branch) &&
          matchesDateColumn(service.createdAtIso ?? "", columnFilters.createdAt) &&
          matchesDateColumn(service.deliveryAtIso ?? "", columnFilters.deliveryAt) &&
          matchesTextColumn([service.costo], columnFilters.total) &&
          (columnFilters.status === "all"
            ? true
            : service.status === columnFilters.status),
      ),
    [columnFilters, services],
  );

  const visibleStats = useMemo(() => {
    const completed = filteredServices.filter(
      (service) => service.status === "completed",
    ).length;
    const inProgress = filteredServices.filter(
      (service) => service.status === "in_progress",
    ).length;
    const income = filteredServices.reduce(
      (acc, service) => acc + Number(service.costo),
      0,
    );

    return {
      total: filteredServices.length,
      completed,
      inProgress,
      income,
    };
  }, [filteredServices]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!openServiceModal) {
      return;
    }

    void loadFormCatalogs();
  }, [loadFormCatalogs, openServiceModal]);

  const paginatedServices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, page, pageSize]);

  const openServicePdf = async (
    loader: (serviceId: number) => Promise<
      Awaited<ReturnType<typeof getServiceReceiptFile>>
    >,
    serviceId: number,
    fallbackError: string,
  ) => {
    const response = await loader(serviceId);
    if (!response.ok) {
      toast.error(response.errors[0] ?? fallbackError);
      return;
    }

    await appFileService.open(response.data);
  };

  const buildServiceActions = (service: {
    id: number;
    status: ServiceStatus;
    folio: string;
    estudio: string;
    localOnly?: boolean;
    syncState?: "synced" | "pending";
  }) => [
    {
      label: "Ver detalle",
        href: buildServiceDetailHref(service.id, { hash: "resumen-operativo" }),
      disabled: false,
      hint: service.localOnly ? "Detalle local" : "Disponible",
      icon: <Eye size={16} />,
    },
    {
      label: "Capturar resultados",
        href: buildServiceDetailHref(service.id, { hash: "resultados" }),
      disabled: service.localOnly,
      hint: service.localOnly ? "Pendiente de sincronizar" : "Disponible",
      icon: <Activity size={16} />,
    },
    {
      label: "Marcar en curso",
      onClick: () => void changeServiceStatus(service.id, "in_progress"),
      disabled:
        service.status === "in_progress" ||
        updatingStatusId === service.id,
      hint: service.localOnly
        ? "Se aplicara al sincronizar"
        : updatingStatusId === service.id
          ? "Actualizando..."
          : isOnline
            ? "Disponible"
            : "Se guardara en cola",
      icon: <Clock3 size={16} />,
    },
    {
      label: "Marcar concluido",
      onClick: () => void changeServiceStatus(service.id, "completed"),
      disabled:
        service.status === "completed" ||
        updatingStatusId === service.id,
      hint: service.localOnly
        ? "Se aplicara al sincronizar"
        : updatingStatusId === service.id
          ? "Actualizando..."
          : isOnline
            ? "Disponible"
            : "Se guardara en cola",
      icon: <BadgeCheck size={16} />,
    },
    {
      label: "Marcar retrasado",
      onClick: () => void changeServiceStatus(service.id, "delayed"),
      disabled:
        service.status === "delayed" ||
        updatingStatusId === service.id,
      hint: service.localOnly
        ? "Se aplicara al sincronizar"
        : updatingStatusId === service.id
          ? "Actualizando..."
          : isOnline
            ? "Disponible"
            : "Se guardara en cola",
      icon: <TriangleAlert size={16} />,
    },
    {
      label: "Cancelar servicio",
      onClick: () => void changeServiceStatus(service.id, "cancelled"),
      disabled:
        service.status === "cancelled" ||
        updatingStatusId === service.id,
      destructive: true,
      hint: service.localOnly
        ? "Se aplicara al sincronizar"
        : updatingStatusId === service.id
          ? "Actualizando..."
          : isOnline
            ? "Disponible"
            : "Se guardara en cola",
      icon: <XCircle size={16} />,
    },
    {
      label: "Etiquetas",
      onClick: () =>
        void openServicePdf(
          getServiceLabelsFile,
          service.id,
          "No se pudieron generar las etiquetas.",
        ),
      disabled: !isOnline || service.localOnly,
      hint: !isOnline
        ? "Backend no disponible"
        : service.localOnly
          ? "Pendiente de sincronizar"
          : "PDF",
      icon: <Ticket size={16} />,
    },
    {
      label: "Recibo",
      onClick: () =>
        void openServicePdf(
          getServiceReceiptFile,
          service.id,
          "No se pudo generar el recibo.",
        ),
      disabled: !isOnline || service.localOnly,
      hint: !isOnline
        ? "Backend no disponible"
        : service.localOnly
          ? "Pendiente de sincronizar"
          : "PDF",
      icon: <Ticket size={16} />,
    },
    {
      label: "Ticket",
      onClick: () =>
        void openServicePdf(
          getServiceTicketFile,
          service.id,
          "No se pudo generar el ticket.",
        ),
      disabled: !isOnline || service.localOnly,
      hint: !isOnline
        ? "Backend no disponible"
        : service.localOnly
          ? "Pendiente de sincronizar"
          : "PDF",
      icon: <Ticket size={16} />,
    },
    {
      label: "Resultados PDF",
      onClick: () =>
        setResultsPdfTarget({
          id: service.id,
          label: `${service.folio} · ${service.estudio}`,
        }),
      disabled: !isOnline || service.localOnly,
      hint: !isOnline
        ? "Backend no disponible"
        : service.localOnly
          ? "Pendiente de sincronizar"
          : "PDF",
      icon: <Activity size={16} />,
    },
  ];

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Gestion de servicios
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Registra servicios, da seguimiento a su estatus y consulta sus
            resultados.
          </p>
        </div>

        <button
          className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
          onClick={() => setOpenServiceModal(true)}
        >
          <Plus size={20} />
          Nuevo servicio
        </button>
      </div>

      <ConnectionStatusBanner
        showSnapshot={dataSource === "snapshot"}
        snapshotMessage="Mostrando servicios guardados localmente."
        emptySnapshotMessage="No hay conexion con el backend y aun no existe una copia local para este filtro."
        snapshotUpdatedAt={snapshotUpdatedAt}
        pendingCount={pendingCount}
      />

      <div className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-red-50/60 to-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por folio, paciente o estudio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-12 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Filter size={18} />
              Filtros
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="space-y-4 px-6 py-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Estatus
              </p>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        status: option.value,
                      }))
                    }
                    className={`app-chip-button rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      filters.status === option.value
                        ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Sucursal
                </label>
                <select
                  value={filters.branchName}
                  onChange={(e) =>
                    setFilters((current) => ({
                      ...current,
                      branchName: e.target.value,
                    }))
                  }
                  className="modal-select w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="all">Todas</option>
                  {SERVICE_BRANCH_OPTIONS.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Desde
                </label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) =>
                    setFilters((current) => ({
                      ...current,
                      fromDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Hasta
                </label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) =>
                    setFilters((current) => ({
                      ...current,
                      toDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Servicios</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {visibleStats.total}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3">
              <Ticket className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluidos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {visibleStats.completed}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En curso</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {visibleStats.inProgress}
              </p>
            </div>
            <div className="rounded-2xl bg-orange-100 p-3">
              <TimerReset className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Ingreso estimado
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                ${visibleStats.income.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl bg-rose-100 p-3">
              <Activity className="h-5 w-5 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            dataSource === "snapshot"
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          Fuente: {dataSource === "snapshot" ? "copia local" : "backend activo"}
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          Cola offline: {pendingCount}
        </span>
      </div>

      {refreshing && !loading ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando servicios...
        </div>
      ) : null}

      {loading ? (
        <CollectionContentSkeleton statCards={4} rows={5} />
      ) : filteredServices.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
          No hay servicios para el filtro seleccionado.
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:block">
            <div className="grid grid-cols-[1.45fr_2.2fr_2fr_1fr_1.7fr_1fr_0.8fr_1fr_1fr] gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div>Folio</div>
              <div>Estudios</div>
              <div>Paciente</div>
              <div>Sucursal</div>
              <div>Creacion</div>
              <div>Entrega</div>
              <div>Total</div>
              <div>Estatus</div>
              <div className="text-right">Acciones</div>
            </div>

            <div className="grid grid-cols-[1.45fr_2.2fr_2fr_1fr_1.7fr_1fr_0.8fr_1fr_1fr] gap-4 border-b border-gray-200 bg-white px-6 py-4">
              <TableColumnFilterInput
                value={columnFilters.folio}
                onChange={(value) =>
                  setColumnFilters((current) => ({ ...current, folio: value }))
                }
                placeholder="Folio..."
                ariaLabel="Filtrar columna folio"
              />
              <TableColumnFilterInput
                value={columnFilters.studies}
                onChange={(value) =>
                  setColumnFilters((current) => ({ ...current, studies: value }))
                }
                placeholder="Estudios..."
                ariaLabel="Filtrar columna estudios"
              />
              <TableColumnFilterInput
                value={columnFilters.patient}
                onChange={(value) =>
                  setColumnFilters((current) => ({ ...current, patient: value }))
                }
                placeholder="Paciente..."
                ariaLabel="Filtrar columna paciente"
              />
              <TableColumnFilterSelect
                value={columnFilters.branch}
                onChange={(value) =>
                  setColumnFilters((current) => ({ ...current, branch: value }))
                }
                options={SERVICE_BRANCH_OPTIONS.map((branch) => ({
                  value: branch,
                  label: branch,
                }))}
                ariaLabel="Filtrar columna sucursal"
              />
              <TableColumnFilterInput
                type="date"
                value={columnFilters.createdAt}
                onChange={(value) =>
                  setColumnFilters((current) => ({ ...current, createdAt: value }))
                }
                ariaLabel="Filtrar columna creacion"
              />
              <TableColumnFilterInput
                type="date"
                value={columnFilters.deliveryAt}
                onChange={(value) =>
                  setColumnFilters((current) => ({ ...current, deliveryAt: value }))
                }
                ariaLabel="Filtrar columna entrega"
              />
              <TableColumnFilterInput
                value={columnFilters.total}
                onChange={(value) =>
                  setColumnFilters((current) => ({ ...current, total: value }))
                }
                placeholder="Total..."
                ariaLabel="Filtrar columna total"
              />
              <TableColumnFilterSelect
                value={columnFilters.status}
                onChange={(value) =>
                  setColumnFilters((current) => ({ ...current, status: value }))
                }
                options={statusOptions
                  .filter((option) => option.value !== "all")
                  .map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                ariaLabel="Filtrar columna estatus"
              />
              <div />
            </div>

            <div className="divide-y divide-gray-200">
              {paginatedServices.map((service) => (
                <div
                  key={service.id}
                  className="grid grid-cols-[1.45fr_2.2fr_2fr_1fr_1.7fr_1fr_0.8fr_1fr_1fr] items-start gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <span className="inline-flex max-w-full items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {service.folio}
                    </span>
                    {service.syncState === "pending" ? (
                      <span className="ml-2 inline-flex max-w-full items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Pendiente sync
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-gray-900">
                      {service.estudio}
                    </h3>
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-gray-900">
                      {service.paciente}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Tel. {service.telefono}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <span className="inline-flex max-w-full rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {service.sucursal}
                    </span>
                  </div>

                  <div className="min-w-0 text-sm text-gray-700">
                    {service.fechaCreacion}
                  </div>

                  <div className="min-w-0 text-sm text-gray-700">
                    {service.fechaEntrega}
                  </div>

                  <div className="min-w-0">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      ${service.costo}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(service.status)}`}
                    >
                      {statusLabel(service.status)}
                    </span>
                    {service.syncState === "pending" ? (
                      <p className="mt-2 text-[11px] font-medium text-amber-700">
                        Cambio local pendiente
                      </p>
                    ) : null}
                  </div>

                  <div className="flex justify-end">
                    <EntityActionsMenu
                      buttonLabel="Acciones"
                      items={buildServiceActions(service)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={filteredServices.length}
              itemLabel="registros"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2 2xl:hidden">
            {paginatedServices.map((service) => (
              <div
                key={service.id}
                className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {service.estudio}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {service.folio}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(service.status)}`}
                  >
                    {statusLabel(service.status)}
                  </span>
                </div>

                {service.syncState === "pending" ? (
                  <div className="mb-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    Cambio local pendiente de sincronizacion
                  </div>
                ) : null}

                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Paciente</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {service.paciente}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Sucursal</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {service.sucursal}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Creacion</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {service.fechaCreacion}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      ${service.costo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-xs text-gray-500">
                    Entrega: {service.fechaEntrega}
                  </div>
                  <EntityActionsMenu
                    buttonLabel="Acciones"
                    items={buildServiceActions(service)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:hidden">
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={filteredServices.length}
              itemLabel="registros"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}

      {openServiceModal ? (
        <AddServiceModal
          setOpen={setOpenServiceModal}
          saveService={saveService}
          patients={catalogs.patients}
          doctors={catalogs.doctors}
          studies={catalogs.studies}
          isSaving={saving}
          isCatalogsLoading={catalogsLoading}
        />
      ) : null}

      <ResultsPdfOptionsModal
        open={resultsPdfTarget !== null}
        onClose={() => setResultsPdfTarget(null)}
        serviceId={resultsPdfTarget?.id ?? null}
        serviceLabel={resultsPdfTarget?.label}
      />
    </div>
  );
}
