"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  FileText,
  Loader2,
  MapPin,
  PencilLine,
  Phone,
  ShieldX,
  Stethoscope,
  Ticket,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { getDoctors, type Doctor } from "@/features/doctors/api/doctors";
import {
  getOrCreateResultByServiceItem,
  type StudyResult,
} from "@/features/results/api/results";
import {
  getServiceById,
  type UpdateServicePayload,
  updateService,
  updateServiceStatus,
  type ServiceOrder,
  type ServiceStatus,
} from "@/features/services/api/services";
import {
  getStudies,
  getStudyDetails,
  type Study,
  type StudyDetail,
} from "@/features/studies/api/studies";
import { getPatients, type Patient } from "@/features/patients/api/patients";
import ResultsPdfOptionsModal from "@/components/servicios/ResultsPdfOptionsModal";
import ServiceResultEditor from "@/components/servicios/ServiceResultEditor";
import ConnectionStatusBanner from "@/components/ui/ConnectionStatusBanner";
import { DetailPageSkeleton } from "@/components/ui/PageSkeletons";
import { mapServiceToForm } from "@/components/servicios/serviceFormUtils";
import { getServiceReceiptFile } from "@/features/services/api/service-documents";
import { appFileService } from "@/lib/files/file-service";
import { formatDateTime } from "@/helpers/date";
import { useHashSectionScroll } from "@/hooks/useHashSectionScroll";
import { getStudyPriceByType } from "@/components/servicios/serviceFormUtils";
import { useOffline } from "@/lib/offline/network-state";
import {
  readOfflineSnapshot,
  writeOfflineSnapshot,
} from "@/lib/offline/offline-store";
import { enqueueSyncItem } from "@/lib/offline/sync-queue";
import {
  SYNC_QUEUE_EVENT,
  type SyncQueueEventDetail,
} from "@/lib/offline/sync-runner";
import {
  buildLocalServiceDetailSnapshotKey,
  isLocalServiceId,
  mergeLocalServiceCreatePayload,
} from "@/features/services/offline/local-service-sync";
import { buildServiceDetailHref } from "@/lib/routes/detail-routes";

const AddServiceModal = dynamic(
  () => import("@/components/servicios/AgregarServicioModal"),
);

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

const getStatusLabel = (status: ServiceStatus) => {
  const labels = {
    pending: "Pendiente",
    in_progress: "En curso",
    delayed: "Retrasado",
    completed: "Concluido",
    cancelled: "Cancelado",
  } as const;
  return labels[status] || status;
};

type CatalogsState = {
  patients: Patient[];
  doctors: Doctor[];
  studies: Study[];
};

type ResultState = Record<number, StudyResult>;
type DetailState = Record<number, StudyDetail[]>;

type ServiceDetailSnapshot = {
  service: ServiceOrder;
  resultDrafts: ResultState;
  studyDetailsMap: DetailState;
};

function buildLocalServiceItems(
  currentService: ServiceOrder,
  payload: UpdateServicePayload,
  catalogs: CatalogsState,
) {
  if (!payload.items?.length) {
    return currentService.items;
  }

  return payload.items.map((item, index) => {
    const study = catalogs.studies.find(
      (candidate) => candidate.id === item.studyId,
    );
    const unitPrice = study ? getStudyPriceByType(study, item.priceType) : 0;
    const discountPercent = Number(item.discountPercent ?? 0);
    const baseAmount = unitPrice * item.quantity;
    const subtotalAmount = baseAmount - baseAmount * (discountPercent / 100);

    return {
      id: currentService.items[index]?.id ?? -(Date.now() + index),
      studyId: item.studyId,
      studyNameSnapshot: study?.name ?? `Estudio ${item.studyId}`,
      sourcePackageId:
        study?.type === "package" ? study.id : currentService.items[index]?.sourcePackageId,
      sourcePackageNameSnapshot:
        study?.type === "package"
          ? study.name
          : currentService.items[index]?.sourcePackageNameSnapshot,
      priceType: item.priceType,
      unitPrice,
      quantity: item.quantity,
      discountPercent,
      subtotalAmount,
    };
  });
}

function applyLocalServiceUpdate(
  currentService: ServiceOrder,
  payload: UpdateServicePayload,
  catalogs: CatalogsState,
): ServiceOrder {
  const items = buildLocalServiceItems(currentService, payload, catalogs);
  const subtotalAmount = items.reduce((acc, item) => acc + item.subtotalAmount, 0);
  const courtesyPercent = Number(
    payload.courtesyPercent ?? currentService.courtesyPercent ?? 0,
  );
  const discountAmount = subtotalAmount * (courtesyPercent / 100);
  const totalAmount = Math.max(subtotalAmount - discountAmount, 0);

  const patientId = payload.patientId ?? currentService.patientId;
  const doctorId =
    payload.doctorId === undefined ? currentService.doctorId : payload.doctorId;
  const patient =
    catalogs.patients.find((candidate) => candidate.id === patientId) ??
    currentService.patient;
  const doctor =
    doctorId == null
      ? null
      : catalogs.doctors.find((candidate) => candidate.id === doctorId) ??
        currentService.doctor;

  return {
    ...currentService,
    folio: payload.folio?.trim().toUpperCase() || currentService.folio,
    patientId,
    doctorId: doctorId ?? null,
    branchName: payload.branchName?.trim() || currentService.branchName,
    sampleAt: payload.sampleAt ?? currentService.sampleAt,
    deliveryAt: payload.deliveryAt ?? currentService.deliveryAt,
    status: payload.status ?? currentService.status,
    courtesyPercent,
    notes:
      payload.notes === undefined ? currentService.notes : payload.notes ?? null,
    subtotalAmount,
    discountAmount,
    totalAmount,
    patient,
    doctor,
    items,
  };
}

function summarizeItems(service: ServiceOrder): string {
  const packageGroups = new Map<string, string[]>();
  const standalone: string[] = [];

  for (const item of service.items ?? []) {
    if (item.sourcePackageNameSnapshot) {
      const current = packageGroups.get(item.sourcePackageNameSnapshot) ?? [];
      current.push(item.studyNameSnapshot);
      packageGroups.set(item.sourcePackageNameSnapshot, current);
      continue;
    }

    standalone.push(item.studyNameSnapshot);
  }

  return [
    ...[...packageGroups.entries()].map(
      ([packageName, studies]) => `${packageName}: ${studies.join(", ")}`,
    ),
    ...standalone,
  ].join(" | ");
}

export default function ServiceDetailPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = Number(params?.id ?? searchParams.get("id") ?? "");
  const { isOnline, pendingCount } = useOffline();
  const snapshotKey = useMemo(() => buildLocalServiceDetailSnapshotKey(id), [id]);

  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [savingService, setSavingService] = useState(false);
  const [catalogsLoading, setCatalogsLoading] = useState(false);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const [service, setService] = useState<ServiceOrder | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogsState>({
    patients: [],
    doctors: [],
    studies: [],
  });
  const [resultDrafts, setResultDrafts] = useState<ResultState>({});
  const [studyDetailsMap, setStudyDetailsMap] = useState<DetailState>({});
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openResultsPdfModal, setOpenResultsPdfModal] = useState(false);
  const [dataSource, setDataSource] = useState<"live" | "snapshot">("live");
  const [snapshotUpdatedAt, setSnapshotUpdatedAt] = useState<number | null>(null);
  const isLocalOnlyService = isLocalServiceId(id) || isLocalServiceId(service?.id ?? 0);

  useHashSectionScroll({ enabled: !loading });

  const persistServiceSnapshot = useCallback(
    (
      nextService: ServiceOrder | null,
      nextResults: ResultState,
      nextStudyDetails: DetailState,
    ) => {
      if (!nextService || Number.isNaN(nextService.id)) {
        return null;
      }

      const storedSnapshot = writeOfflineSnapshot<ServiceDetailSnapshot>(
        snapshotKey,
        {
          service: nextService,
          resultDrafts: nextResults,
          studyDetailsMap: nextStudyDetails,
        },
      );
      setSnapshotUpdatedAt(storedSnapshot.updatedAt);
      return storedSnapshot;
    },
    [snapshotKey],
  );

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError("ID de servicio invalido.");
      setLoading(false);
      return;
    }

    const cachedSnapshot =
      readOfflineSnapshot<ServiceDetailSnapshot>(snapshotKey);

    if (isLocalServiceId(id) && cachedSnapshot) {
      setService(cachedSnapshot.value.service);
      setResultDrafts(cachedSnapshot.value.resultDrafts);
      setStudyDetailsMap(cachedSnapshot.value.studyDetailsMap);
      setDataSource("snapshot");
      setSnapshotUpdatedAt(cachedSnapshot.updatedAt);
      setLoading(false);
      setResultsLoading(false);
      return;
    }

    if (!isOnline) {
      if (cachedSnapshot) {
        setService(cachedSnapshot.value.service);
        setResultDrafts(cachedSnapshot.value.resultDrafts);
        setStudyDetailsMap(cachedSnapshot.value.studyDetailsMap);
        setDataSource("snapshot");
        setSnapshotUpdatedAt(cachedSnapshot.updatedAt);
        setLoading(false);
        setResultsLoading(false);
      } else {
        setError(
          "No hay conexión y tampoco existe una copia local de este servicio.",
        );
        setLoading(false);
      }
      return;
    }

    const load = async () => {
      const serviceResponse = await getServiceById(id);

      if (!serviceResponse.ok) {
        if (cachedSnapshot) {
          setService(cachedSnapshot.value.service);
          setResultDrafts(cachedSnapshot.value.resultDrafts);
          setStudyDetailsMap(cachedSnapshot.value.studyDetailsMap);
          setDataSource("snapshot");
          setSnapshotUpdatedAt(cachedSnapshot.updatedAt);
        } else {
          setError(serviceResponse.errors[0] ?? "No se pudo cargar el servicio.");
        }
        setLoading(false);
        return;
      }

      setService(serviceResponse.data);
      setDataSource("live");
      setError("");
      setLoading(false);
    };

    void load();
  }, [id, isOnline, snapshotKey]);

  useEffect(() => {
    if (!service) return;

    const cachedSnapshot =
      readOfflineSnapshot<ServiceDetailSnapshot>(snapshotKey);

    if (isLocalServiceId(service.id)) {
      if (cachedSnapshot) {
        setResultDrafts(cachedSnapshot.value.resultDrafts);
        setStudyDetailsMap(cachedSnapshot.value.studyDetailsMap);
        setDataSource("snapshot");
        setSnapshotUpdatedAt(cachedSnapshot.updatedAt);
      }
      setResultsLoading(false);
      return;
    }

    if (!isOnline) {
      if (cachedSnapshot) {
        setResultDrafts(cachedSnapshot.value.resultDrafts);
        setStudyDetailsMap(cachedSnapshot.value.studyDetailsMap);
        setDataSource("snapshot");
        setSnapshotUpdatedAt(cachedSnapshot.updatedAt);
      }
      setResultsLoading(false);
      return;
    }

    const loadOperationalData = async () => {
      setResultsLoading(true);

      const uniqueStudyIds = [
        ...new Set((service.items ?? []).map((item) => item.studyId)),
      ];
      const [detailsResponses, resultsResponses] = await Promise.all([
        Promise.all(uniqueStudyIds.map((studyId) => getStudyDetails(studyId))),
        Promise.all(
          (service.items ?? []).map((item) =>
            getOrCreateResultByServiceItem(item.id),
          ),
        ),
      ]);

      const nextDetailsMap: DetailState = {};
      uniqueStudyIds.forEach((studyId, index) => {
        const response = detailsResponses[index];
        nextDetailsMap[studyId] = response.ok ? response.data : [];
      });

      const nextResultMap: ResultState = {};
      for (let index = 0; index < (service.items ?? []).length; index += 1) {
        const item = service.items[index];
        const response = resultsResponses[index];
        if (!response.ok) {
          toast.error(
            response.errors[0] ??
              `No se pudo preparar el resultado para ${item.studyNameSnapshot}.`,
          );
          continue;
        }
        nextResultMap[item.id] = response.data;
      }

      setStudyDetailsMap(nextDetailsMap);
      setResultDrafts(nextResultMap);
      persistServiceSnapshot(service, nextResultMap, nextDetailsMap);
      setDataSource("live");
      setResultsLoading(false);
    };

    void loadOperationalData();
  }, [isOnline, persistServiceSnapshot, service, snapshotKey]);

  useEffect(() => {
    if (!openEditModal || catalogsLoaded) {
      return;
    }

    const cachedCatalogs = readOfflineSnapshot<CatalogsState>("services:catalogs");

    if (!isOnline && cachedCatalogs) {
      setCatalogs(cachedCatalogs.value);
      setCatalogsLoaded(true);
      setCatalogsLoading(false);
      return;
    }

    const loadCatalogs = async () => {
      setCatalogsLoading(true);

      const [patientsResponse, doctorsResponse, studiesResponse] =
        await Promise.all([
          getPatients({ limit: 400, status: "all" }),
          getDoctors({ limit: 400 }),
          getStudies({ limit: 400, status: "active" }),
        ]);
      const hasSuccessfulCatalogLoad =
        patientsResponse.ok || doctorsResponse.ok || studiesResponse.ok;

      setCatalogs({
        patients: patientsResponse.ok ? patientsResponse.data.data : [],
        doctors: doctorsResponse.ok ? doctorsResponse.data.data : [],
        studies: studiesResponse.ok ? studiesResponse.data.data : [],
      });
      setCatalogsLoaded(hasSuccessfulCatalogLoad);
      setCatalogsLoading(false);

      if (hasSuccessfulCatalogLoad) {
        writeOfflineSnapshot("services:catalogs", {
          patients: patientsResponse.ok ? patientsResponse.data.data : [],
          doctors: doctorsResponse.ok ? doctorsResponse.data.data : [],
          studies: studiesResponse.ok ? studiesResponse.data.data : [],
        });
      } else if (cachedCatalogs) {
        setCatalogs(cachedCatalogs.value);
        setCatalogsLoaded(true);
      }
    };

    void loadCatalogs();
  }, [catalogsLoaded, isOnline, openEditModal]);

  useEffect(() => {
    const handleSyncEvent = (event: Event) => {
      const detail = (event as CustomEvent<SyncQueueEventDetail>).detail;
      if (detail.status !== "completed" || !service) {
        return;
      }

      if (
        detail.item.scope === "services" &&
        detail.item.entityType === "service-order"
      ) {
        const syncedService = detail.result as ServiceOrder | undefined;
        if (!syncedService) {
          return;
        }

        if (detail.item.operation === "create" && detail.item.entityId === service.id) {
          router.replace(buildServiceDetailHref(syncedService.id));
          return;
        }

        if (syncedService.id === service.id) {
          setService(syncedService);
          persistServiceSnapshot(syncedService, resultDrafts, studyDetailsMap);
        }
      }

      if (
        detail.item.scope === "results" &&
        detail.item.entityType === "study-result"
      ) {
        const syncedResult = detail.result as StudyResult | undefined;
        if (!syncedResult) {
          return;
        }

        setResultDrafts((current) => {
          const nextDrafts = { ...current };
          const serviceItemId = syncedResult.serviceOrderItemId;
          if (serviceItemId in nextDrafts) {
            nextDrafts[serviceItemId] = syncedResult;
          }
          persistServiceSnapshot(service, nextDrafts, studyDetailsMap);
          return nextDrafts;
        });
      }
    };

    window.addEventListener(SYNC_QUEUE_EVENT, handleSyncEvent as EventListener);

    return () => {
      window.removeEventListener(
        SYNC_QUEUE_EVENT,
        handleSyncEvent as EventListener,
      );
    };
  }, [persistServiceSnapshot, resultDrafts, router, service, studyDetailsMap]);

  const totalStudies = service?.items?.length ?? 0;
  const closedResults = useMemo(
    () =>
      Object.values(resultDrafts).filter((result) => !result.isDraft).length,
    [resultDrafts],
  );

  const handleStatusChange = async (nextStatus: ServiceStatus) => {
    if (!service) return;

    if (isLocalServiceId(service.id)) {
      const merged = mergeLocalServiceCreatePayload(service.id, {
        status: nextStatus,
      });

      if (!merged) {
        toast.error(
          "No se encontro el alta local pendiente para actualizar este servicio.",
        );
        return;
      }

      const nextService = { ...service, status: nextStatus };
      setService(nextService);
      persistServiceSnapshot(nextService, resultDrafts, studyDetailsMap);
      toast.success(
        `Estatus local actualizado a ${getStatusLabel(nextStatus).toLowerCase()}. Se sincronizara junto con el alta.`,
      );
      return;
    }

    if (!isOnline) {
      enqueueSyncItem({
        scope: "services",
        entityType: "service-order",
        entityId: service.id,
        operation: "update",
        payload: { status: nextStatus },
      });

      const nextService = { ...service, status: nextStatus };
      setService(nextService);
      persistServiceSnapshot(nextService, resultDrafts, studyDetailsMap);
      toast.success(
        `Estatus guardado localmente como ${getStatusLabel(nextStatus).toLowerCase()}.`,
      );
      return;
    }

    setUpdatingStatus(true);
    const response = await updateServiceStatus(service.id, nextStatus);

    if (!response.ok) {
      toast.error(
        response.errors[0] ?? "No se pudo actualizar el estatus del servicio.",
      );
      setUpdatingStatus(false);
      return;
    }

    setService(response.data.data);
    persistServiceSnapshot(response.data.data, resultDrafts, studyDetailsMap);
    toast.success(
      `Servicio marcado como ${getStatusLabel(nextStatus).toLowerCase()}.`,
    );
    setUpdatingStatus(false);
  };

  const handleEditService = async (
    payload: Parameters<typeof updateService>[1],
  ) => {
    if (!service) return false;

    if (isLocalServiceId(service.id)) {
      const merged = mergeLocalServiceCreatePayload(service.id, payload);

      if (!merged) {
        toast.error(
          "No se encontro el alta local pendiente para actualizar este servicio.",
        );
        return false;
      }

      const nextService = applyLocalServiceUpdate(service, payload, catalogs);
      setService(nextService);
      persistServiceSnapshot(nextService, resultDrafts, studyDetailsMap);
      toast.success("Cambios del servicio local actualizados antes de sincronizar.");
      return true;
    }

    if (!isOnline) {
      enqueueSyncItem({
        scope: "services",
        entityType: "service-order",
        entityId: service.id,
        operation: "update",
        payload,
      });

      const nextService = applyLocalServiceUpdate(service, payload, catalogs);
      setService(nextService);
      persistServiceSnapshot(nextService, resultDrafts, studyDetailsMap);
      toast.success("Cambios del servicio guardados localmente.");
      return true;
    }

    setSavingService(true);
    const response = await updateService(service.id, payload);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo actualizar el servicio.");
      setSavingService(false);
      return false;
    }

    setService(response.data.data);
    persistServiceSnapshot(response.data.data, resultDrafts, studyDetailsMap);
    toast.success("Servicio actualizado con exito.");
    setSavingService(false);
    return true;
  };

  const handleOpenReceipt = async () => {
    if (!service) return;

    const response = await getServiceReceiptFile(service.id);
    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo generar el recibo.");
      return;
    }

    await appFileService.open(response.data);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <DetailPageSkeleton sections={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={16} /> Regresar a servicios
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Detalle de servicio
          </h1>
          <p className="mt-2 text-gray-600">
            Administra el servicio, revisa sus estudios y captura resultados por
            cada item asociado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusColor(service.status)}`}
          >
            {service.status === "completed" ? (
              <BadgeCheck className="h-4 w-4" />
            ) : service.status === "cancelled" ? (
              <ShieldX className="h-4 w-4" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            {getStatusLabel(service.status)}
          </span>

          <button
            type="button"
            onClick={() => setOpenEditModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <PencilLine className="h-4 w-4" />
            Editar servicio
          </button>

          <button
            type="button"
            onClick={() => void handleStatusChange("in_progress")}
            className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
            disabled={updatingStatus || service.status === "in_progress"}
          >
            En curso
          </button>

          <button
            type="button"
            onClick={() => void handleStatusChange("completed")}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            disabled={updatingStatus || service.status === "completed"}
          >
            Concluir
          </button>
        </div>
      </div>

      <ConnectionStatusBanner
        showSnapshot={dataSource === "snapshot"}
        snapshotMessage="Mostrando detalle guardado localmente."
        emptySnapshotMessage="No hay conexión con el backend y aún no existe una copia local de este servicio."
        snapshotUpdatedAt={snapshotUpdatedAt}
        pendingCount={pendingCount}
      />

      <div className="space-y-6">
        <div
          id="resumen-operativo"
          className="section-anchor-target grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Resumen operativo
                </h2>
                <p className="text-sm text-gray-500">
                  Vista general del servicio y de sus estudios capturados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Folio
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {service.folio}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Costo total
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  ${Number(service.totalAmount).toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Fecha de muestra
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {formatDateTime(service.sampleAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Fecha de entrega
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {formatDateTime(service.deliveryAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Estudios
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  {summarizeItems(service) || "Sin estudios"}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Notas
                </p>
                <p className="mt-2 text-base text-gray-900">
                  {service.notes ?? "Sin notas"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-200 bg-gradient-to-br from-red-600 via-red-500 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20">
            <p className="text-sm uppercase tracking-[0.2em] text-red-100">
              Servicio en marcha
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              {service.patient
                ? `${service.patient.firstName} ${service.patient.lastName}`
                : "Paciente"}
            </h2>
            <p className="mt-2 text-sm text-red-50">
              Creado el {formatDateTime(service.createdAt)}
            </p>

            <div className="mt-6 space-y-4 rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <UserRound className="h-4 w-4 text-red-100" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">
                    Paciente
                  </p>
                  <p className="text-sm font-medium text-white">
                    {service.patient
                      ? `${service.patient.firstName} ${service.patient.lastName} ${service.patient.middleName ?? ""}`.trim()
                      : "Sin paciente"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-red-100" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">
                    Teléfono
                  </p>
                  <p className="text-sm font-medium text-white">
                    {service.patient?.phone ?? "Sin teléfono"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-red-100" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">
                    Sucursal
                  </p>
                  <p className="text-sm font-medium text-white">
                    {service.branchName ?? "Sin sucursal"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CalendarClock className="h-4 w-4 text-red-100" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-100">
                    Avance de resultados
                  </p>
                  <p className="text-sm font-medium text-white">
                    {closedResults} de {totalStudies} cerrados
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void handleOpenReceipt()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-700 transition-all hover:bg-red-50 disabled:opacity-50"
            disabled={!isOnline || isLocalOnlyService}
          >
                <Ticket className="h-4 w-4" />
                Recibo
              </button>
              <button
                type="button"
                onClick={() => setOpenResultsPdfModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 disabled:opacity-50"
                disabled={!isOnline || isLocalOnlyService}
              >
                <Stethoscope className="h-4 w-4" />
                PDF de resultados
              </button>
            </div>
          </div>
        </div>

        <div
          id="desglose-servicio"
          className="section-anchor-target rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Desglose del servicio
              </h2>
              <p className="text-sm text-gray-500">
                Cada item del servicio queda disponible para resultados y PDFs.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(service.items ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {item.studyNameSnapshot}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.sourcePackageNameSnapshot
                    ? `Incluido en ${item.sourcePackageNameSnapshot}`
                    : "Estudio individual"}
                </p>
                <div className="mt-4 grid gap-2 text-xs text-gray-600">
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                    Precio: ${Number(item.unitPrice).toFixed(2)}
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                    Descuento: {Number(item.discountPercent).toFixed(2)}%
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                    Subtotal: ${Number(item.subtotalAmount).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          id="resultados"
          className="section-anchor-target rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Resultados por estudio
              </h2>
              <p className="text-sm text-gray-500">
                Captura los resultados uno por uno y deja listo el PDF
                consolidado del servicio.
              </p>
            </div>
          </div>

          {resultsLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparando borradores y plantillas de resultados...
            </div>
          ) : isLocalOnlyService && Object.keys(resultDrafts).length === 0 ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 text-sm text-sky-900">
              Este servicio aún existe solo en local. Ya puedes revisar su
              resumen y ajustar datos operativos, pero la captura de resultados
              se habilitara cuando el alta se sincronice y reciba identificadores
              definitivos.
            </div>
          ) : (
            <div className="space-y-5">
              {(service.items ?? []).map((item) => {
                const result = resultDrafts[item.id];
                if (!result) return null;

                return (
                  <ServiceResultEditor
                    key={item.id}
                    serviceId={service.id}
                    serviceItem={item}
                    initialResult={result}
                    studyDetails={studyDetailsMap[item.studyId] ?? []}
                    onOpenPdfOptions={() => setOpenResultsPdfModal(true)}
                    onSaved={(nextResult) => {
                      setResultDrafts((current) => {
                        const nextDrafts = {
                          ...current,
                          [item.id]: nextResult,
                        };
                        persistServiceSnapshot(service, nextDrafts, studyDetailsMap);
                        return nextDrafts;
                      });
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ResultsPdfOptionsModal
        open={openResultsPdfModal}
        onClose={() => setOpenResultsPdfModal(false)}
        serviceId={service.id}
        serviceLabel={`${service.folio} · ${service.patient ? `${service.patient.firstName} ${service.patient.lastName}` : "Servicio"}`}
      />

      {openEditModal ? (
        <AddServiceModal
          setOpen={setOpenEditModal}
          saveService={handleEditService}
          patients={catalogs.patients}
          doctors={catalogs.doctors}
          studies={catalogs.studies}
          isSaving={savingService}
          isCatalogsLoading={catalogsLoading}
          initialValues={mapServiceToForm(service)}
          title="Editar servicio"
          description="Actualiza paciente, estudios, tiempos y notas del servicio."
          submitLabel="Guardar cambios"
        />
      ) : null}
    </div>
  );
}
