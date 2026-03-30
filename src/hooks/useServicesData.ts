'use client';

import { getDoctors, type Doctor } from '@/features/doctors/api/doctors';
import { getPatients, type Patient } from '@/features/patients/api/patients';
import {
  createService,
  getServices,
  updateService,
  updateServiceStatus,
  type CreateServicePayload,
  type ServiceOrder,
  type ServiceStatus,
  type UpdateServicePayload,
} from '@/features/services/api/services';
import { getStudies, type Study } from '@/features/studies/api/studies';
import { getStudyPriceByType } from '@/components/servicios/serviceFormUtils';
import {
  clearQueryCacheByPrefix,
  getQueryCache,
  setQueryCache,
} from '@/hooks/_lib/clientQueryCache';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useOffline } from '@/lib/offline/network-state';
import {
  readOfflineSnapshot,
  writeOfflineSnapshot,
} from '@/lib/offline/offline-store';
import { enqueueSyncItem } from '@/lib/offline/sync-queue';
import {
  SYNC_QUEUE_EVENT,
  type SyncQueueEventDetail,
} from '@/lib/offline/sync-runner';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

export type UiService = {
  id: number;
  folio: string;
  estudio: string;
  paciente: string;
  telefono: string;
  sucursal: string;
  fechaCreacion: string;
  fechaEntrega: string;
  fechaMuestra: string;
  costo: string;
  status: ServiceStatus;
  createdAtIso?: string | null;
  deliveryAtIso?: string | null;
  syncState?: 'synced' | 'pending';
  localOnly?: boolean;
};

export type ServicesFilters = {
  status: ServiceStatus | 'all';
  branchName: string;
  fromDate: string;
  toDate: string;
};

type CatalogsState = {
  patients: Patient[];
  doctors: Doctor[];
  studies: Study[];
};

const SERVICES_CACHE_PREFIX = 'services:list:';
const CATALOGS_CACHE_KEY = 'services:catalogs';
const SERVICES_SNAPSHOT_PREFIX = 'services:list:';
const SERVICES_CATALOGS_SNAPSHOT_KEY = 'services:catalogs';

function formatDateTime(value?: string | null): string {
  if (!value) return 'N/D';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/D';
  return parsed.toLocaleString('es-MX');
}

function summarizeServiceStudies(service: ServiceOrder): string {
  const packageGroups = new Map<string, string[]>();
  const standaloneStudies: string[] = [];

  for (const item of service.items ?? []) {
    if (item.sourcePackageNameSnapshot) {
      const current = packageGroups.get(item.sourcePackageNameSnapshot) ?? [];
      current.push(item.studyNameSnapshot);
      packageGroups.set(item.sourcePackageNameSnapshot, current);
      continue;
    }

    standaloneStudies.push(item.studyNameSnapshot);
  }

  const groupedPackages = [...packageGroups.entries()].map(
    ([packageName, studies]) => `${packageName}: ${studies.join(', ')}`,
  );

  return [...groupedPackages, ...standaloneStudies].join(' | ');
}

function toUiService(service: ServiceOrder): UiService {
  const patientName = service.patient
    ? `${service.patient.firstName} ${service.patient.lastName} ${service.patient.middleName ?? ''}`.trim()
    : 'Sin paciente';

  return {
    id: service.id,
    folio: service.folio,
    estudio: summarizeServiceStudies(service) || 'Sin estudios',
    paciente: patientName,
    telefono: service.patient?.phone ?? '-',
    sucursal: service.branchName ?? 'Sin sucursal',
    fechaCreacion: formatDateTime(service.createdAt),
    fechaEntrega: formatDateTime(service.deliveryAt ?? service.completedAt),
    fechaMuestra: formatDateTime(service.sampleAt),
    costo: Number(service.totalAmount).toFixed(2),
    status: service.status,
    createdAtIso: service.createdAt,
    deliveryAtIso: service.deliveryAt ?? service.completedAt ?? null,
    syncState: 'synced',
    localOnly: false,
  };
}

function getServicesCacheKey(search: string, filters: ServicesFilters): string {
  return `${SERVICES_CACHE_PREFIX}${JSON.stringify({ search, ...filters })}`;
}

function getServicesSnapshotKey(search: string, filters: ServicesFilters): string {
  return `${SERVICES_SNAPSHOT_PREFIX}${JSON.stringify({ search, ...filters })}`;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function matchesServiceFilters(
  service: UiService,
  search: string,
  filters: ServicesFilters,
): boolean {
  if (filters.status !== 'all' && service.status !== filters.status) {
    return false;
  }

  if (
    filters.branchName &&
    filters.branchName !== 'all' &&
    service.sucursal !== filters.branchName
  ) {
    return false;
  }

  const createdDate = service.createdAtIso?.slice(0, 10) ?? null;
  if (filters.fromDate && createdDate && createdDate < filters.fromDate) {
    return false;
  }

  if (filters.toDate && createdDate && createdDate > filters.toDate) {
    return false;
  }

  const normalizedSearch = normalizeSearch(search);
  if (!normalizedSearch) {
    return true;
  }

  return [service.folio, service.estudio, service.paciente, service.telefono, service.sucursal]
    .join(' ')
    .toLowerCase()
    .includes(normalizedSearch);
}

function buildOfflineServiceTotal(
  payload: CreateServicePayload,
  studies: Study[],
): number {
  const subtotal = payload.items.reduce((acc, item) => {
    const study = studies.find((candidate) => candidate.id === item.studyId);
    if (!study) {
      return acc;
    }

    const unitPrice = getStudyPriceByType(study, item.priceType);
    const baseAmount = unitPrice * item.quantity;
    const discountAmount = baseAmount * ((item.discountPercent ?? 0) / 100);
    return acc + (baseAmount - discountAmount);
  }, 0);

  const courtesyPercent = Number(payload.courtesyPercent ?? 0);
  const courtesyAmount = subtotal * (courtesyPercent / 100);
  return Math.max(subtotal - courtesyAmount, 0);
}

function buildOfflineStudySummary(
  payload: CreateServicePayload,
  studies: Study[],
): string {
  return payload.items
    .map((item) => {
      const study = studies.find((candidate) => candidate.id === item.studyId);
      return study?.name ?? `Estudio ${item.studyId}`;
    })
    .join(' | ');
}

function createOfflineUiService(
  payload: CreateServicePayload,
  catalogs: CatalogsState,
): UiService {
  const nowIso = new Date().toISOString();
  const patient =
    catalogs.patients.find((candidate) => candidate.id === payload.patientId) ?? null;
  const totalAmount = buildOfflineServiceTotal(payload, catalogs.studies);
  const localId = -Date.now();
  const fallbackFolio = `LOCAL-${String(Math.abs(localId)).slice(-8)}`;

  return {
    id: localId,
    folio:
      payload.autoGenerateFolio || !payload.folio.trim()
        ? fallbackFolio
        : payload.folio.trim().toUpperCase(),
    estudio: buildOfflineStudySummary(payload, catalogs.studies) || 'Sin estudios',
    paciente: patient
      ? `${patient.firstName} ${patient.lastName} ${patient.middleName ?? ''}`.trim()
      : 'Paciente local',
    telefono: patient?.phone ?? '-',
    sucursal: payload.branchName?.trim() || 'Sin sucursal',
    fechaCreacion: formatDateTime(nowIso),
    fechaEntrega: formatDateTime(payload.deliveryAt ?? null),
    fechaMuestra: formatDateTime(payload.sampleAt ?? null),
    costo: totalAmount.toFixed(2),
    status: payload.status ?? 'pending',
    createdAtIso: nowIso,
    deliveryAtIso: payload.deliveryAt ?? null,
    syncState: 'pending',
    localOnly: true,
  };
}

function statusMessage(status: ServiceStatus): string {
  const labels: Record<ServiceStatus, string> = {
    pending: 'pendiente',
    in_progress: 'en curso',
    delayed: 'retrasado',
    completed: 'concluido',
    cancelled: 'cancelado',
  };
  return labels[status];
}

export function useServicesData(searchTerm: string, filters: ServicesFilters) {
  const { isOnline } = useOffline();
  const [services, setServices] = useState<UiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [catalogsLoading, setCatalogsLoading] = useState(false);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);
  const [catalogs, setCatalogs] = useState<CatalogsState>({
    patients: [],
    doctors: [],
    studies: [],
  });
  const [dataSource, setDataSource] = useState<'live' | 'snapshot'>('live');
  const [snapshotUpdatedAt, setSnapshotUpdatedAt] = useState<number | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350);
  const servicesCacheKey = useMemo(
    () => getServicesCacheKey(debouncedSearch, filters),
    [debouncedSearch, filters],
  );
  const servicesSnapshotKey = useMemo(
    () => getServicesSnapshotKey(debouncedSearch, filters),
    [debouncedSearch, filters],
  );

  const persistServicesLocally = useCallback(
    (nextServices: UiService[]) => {
      setQueryCache(servicesCacheKey, nextServices);
      const storedSnapshot = writeOfflineSnapshot(servicesSnapshotKey, nextServices);
      setSnapshotUpdatedAt(storedSnapshot.updatedAt);
      return storedSnapshot;
    },
    [servicesCacheKey, servicesSnapshotKey],
  );

  const fetchServices = useCallback(
    async (
      search: string,
      nextFilters: ServicesFilters,
      options?: { silent?: boolean; background?: boolean },
    ) => {
      if (options?.background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const snapshotKey = getServicesSnapshotKey(search, nextFilters);
      const cacheKey = getServicesCacheKey(search, nextFilters);
      const cachedSnapshot = readOfflineSnapshot<UiService[]>(snapshotKey);

      if (!isOnline) {
        if (cachedSnapshot) {
          setServices(cachedSnapshot.value);
          setDataSource('snapshot');
          setSnapshotUpdatedAt(cachedSnapshot.updatedAt);
        } else if (!options?.background) {
          setServices([]);
          toast.error(
            'No hay conexion y tampoco existe una lista local para este filtro.',
          );
        }

        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await getServices({
        search,
        status: nextFilters.status === 'all' ? undefined : nextFilters.status,
        branchName:
          nextFilters.branchName && nextFilters.branchName !== 'all'
            ? nextFilters.branchName
            : undefined,
        fromDate: nextFilters.fromDate || undefined,
        toDate: nextFilters.toDate || undefined,
        limit: 1000,
      });

      if (!response.ok) {
        if (cachedSnapshot) {
          setServices(cachedSnapshot.value);
          setDataSource('snapshot');
          setSnapshotUpdatedAt(cachedSnapshot.updatedAt);
        } else {
          if (!options?.silent) {
            toast.error(response.errors[0] ?? 'No se pudieron cargar servicios.');
          }

          if (!options?.background) {
            setServices([]);
          }
        }

        setLoading(false);
        setRefreshing(false);
        return;
      }

      const mapped = response.data.data.map(toUiService);
      setServices(mapped);
      setQueryCache(cacheKey, mapped);
      const storedSnapshot = writeOfflineSnapshot(snapshotKey, mapped);
      setDataSource('live');
      setSnapshotUpdatedAt(storedSnapshot.updatedAt);
      setLoading(false);
      setRefreshing(false);
    },
    [isOnline],
  );

  const loadFormCatalogs = useCallback(async () => {
    if (catalogsLoaded) {
      return;
    }

    const cached = getQueryCache<CatalogsState>(CATALOGS_CACHE_KEY);
    const cachedCatalogs = cached?.data ?? {
      patients: [],
      doctors: [],
      studies: [],
    };

    if (cached) {
      setCatalogs(cachedCatalogs);
      setCatalogsLoading(false);
      setCatalogsLoaded(true);
      return;
    }

    const cachedSnapshot = readOfflineSnapshot<CatalogsState>(
      SERVICES_CATALOGS_SNAPSHOT_KEY,
    );
    if (!isOnline && cachedSnapshot) {
      setCatalogs(cachedSnapshot.value);
      setCatalogsLoading(false);
      setCatalogsLoaded(true);
      setQueryCache(CATALOGS_CACHE_KEY, cachedSnapshot.value);
      return;
    }

    setCatalogsLoading(true);

    const [patientsResponse, doctorsResponse, studiesResponse] = await Promise.all([
      getPatients({ limit: 400, status: 'all' }),
      getDoctors({ limit: 400 }),
      getStudies({ limit: 400, status: 'active' }),
    ]);

    const nextCatalogs: CatalogsState = {
      patients: patientsResponse.ok ? patientsResponse.data.data : cachedCatalogs?.patients ?? [],
      doctors: doctorsResponse.ok ? doctorsResponse.data.data : cachedCatalogs?.doctors ?? [],
      studies: studiesResponse.ok ? studiesResponse.data.data : cachedCatalogs?.studies ?? [],
    };
    const hasSuccessfulCatalogLoad =
      patientsResponse.ok || doctorsResponse.ok || studiesResponse.ok;

    setCatalogs(nextCatalogs);
    setCatalogsLoading(false);
    setCatalogsLoaded(hasSuccessfulCatalogLoad);
    setQueryCache(CATALOGS_CACHE_KEY, nextCatalogs);
    if (hasSuccessfulCatalogLoad) {
      writeOfflineSnapshot(SERVICES_CATALOGS_SNAPSHOT_KEY, nextCatalogs);
    } else if (cachedSnapshot) {
      setCatalogs(cachedSnapshot.value);
      setCatalogsLoaded(true);
    }
  }, [catalogsLoaded, isOnline]);

  useEffect(() => {
    const cached = getQueryCache<UiService[]>(servicesCacheKey);

    if (cached) {
      setServices(cached.data);
      setLoading(false);
      setDataSource('live');
      void fetchServices(debouncedSearch, filters, { background: true, silent: true });
      return;
    }

    void fetchServices(debouncedSearch, filters);
  }, [debouncedSearch, fetchServices, filters, servicesCacheKey]);

  useEffect(() => {
    const handleSyncEvent = (event: Event) => {
      const detail = (event as CustomEvent<SyncQueueEventDetail>).detail;
      if (detail.status !== 'completed' || detail.item.scope !== 'services') {
        return;
      }

      const syncedService = detail.result as ServiceOrder | undefined;
      if (!syncedService) {
        return;
      }

      setServices((current) => {
        if (detail.item.operation === 'create') {
          const withoutLocal = current.filter(
            (service) => service.id !== detail.item.entityId,
          );
          const nextService = toUiService(syncedService);
          const nextServices = matchesServiceFilters(
            nextService,
            debouncedSearch,
            filters,
          )
            ? [nextService, ...withoutLocal]
            : withoutLocal;
          persistServicesLocally(nextServices);
          return nextServices;
        }

        const nextServices = current.map((service) =>
          service.id === syncedService.id ? toUiService(syncedService) : service,
        );
        persistServicesLocally(nextServices);
        return nextServices;
      });
    };

    window.addEventListener(SYNC_QUEUE_EVENT, handleSyncEvent as EventListener);

    return () => {
      window.removeEventListener(
        SYNC_QUEUE_EVENT,
        handleSyncEvent as EventListener,
      );
    };
  }, [debouncedSearch, filters, persistServicesLocally]);

  const saveService = useCallback(
    async (payload: CreateServicePayload) => {
      setSaving(true);

      if (!isOnline) {
        const offlineService = createOfflineUiService(payload, catalogs);
        const queuedItem = enqueueSyncItem({
          scope: 'services',
          entityType: 'service-order',
          entityId: offlineService.id,
          operation: 'create',
          payload,
        });
        const nextServices = matchesServiceFilters(
          offlineService,
          debouncedSearch,
          filters,
        )
          ? [offlineService, ...services]
          : services;

        setServices(nextServices);
        persistServicesLocally(nextServices);
        clearQueryCacheByPrefix(SERVICES_CACHE_PREFIX);
        setSaving(false);
        toast.success(
          `Servicio ${offlineService.folio} guardado localmente. Pendiente de sincronizacion.`,
        );
        return Boolean(queuedItem.id);
      }

      const response = await createService(payload);

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo crear el servicio.');
        setSaving(false);
        return false;
      }

      toast.success(`Servicio ${response.data.data.folio} guardado con exito.`);
      clearQueryCacheByPrefix(SERVICES_CACHE_PREFIX);
      await fetchServices(debouncedSearch, filters);
      setSaving(false);
      return true;
    },
    [
      catalogs,
      debouncedSearch,
      fetchServices,
      filters,
      isOnline,
      persistServicesLocally,
      services,
    ],
  );

  const saveServiceChanges = useCallback(
    async (serviceId: number, payload: UpdateServicePayload) => {
      setSaving(true);

      if (!isOnline) {
        enqueueSyncItem({
          scope: 'services',
          entityType: 'service-order',
          entityId: serviceId,
          operation: 'update',
          payload,
        });

        const nextServices = services.map((service) =>
          service.id === serviceId
            ? {
                ...service,
                folio: payload.folio?.trim().toUpperCase() || service.folio,
                sucursal: payload.branchName?.trim() || service.sucursal,
                status: payload.status ?? service.status,
                syncState: 'pending' as const,
              }
            : service,
        );

        setServices(nextServices);
        persistServicesLocally(nextServices);
        setSaving(false);
        toast.success('Cambios del servicio guardados localmente. Pendientes de sincronizacion.');
        return true;
      }

      const response = await updateService(serviceId, payload);

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo actualizar el servicio.');
        setSaving(false);
        return false;
      }

      toast.success('Servicio actualizado con exito.');
      clearQueryCacheByPrefix(SERVICES_CACHE_PREFIX);
      await fetchServices(debouncedSearch, filters, { silent: true, background: true });
      setSaving(false);
      return true;
    },
    [
      debouncedSearch,
      fetchServices,
      filters,
      isOnline,
      persistServicesLocally,
      services,
    ],
  );

  const stats = useMemo(() => {
    const completed = services.filter((service) => service.status === 'completed').length;
    const inProgress = services.filter((service) => service.status === 'in_progress').length;
    const income = services.reduce((acc, service) => acc + Number(service.costo), 0);

    return {
      total: services.length,
      completed,
      inProgress,
      income,
    };
  }, [services]);

  const changeServiceStatus = useCallback(
    async (serviceId: number, nextStatus: ServiceStatus) => {
      setUpdatingStatusId(serviceId);

      if (!isOnline) {
        const targetService = services.find((service) => service.id === serviceId);

        if (targetService?.localOnly) {
          toast.info(
            'Este servicio aun es local. Su estatus final se confirmara al sincronizarse.',
          );
          setUpdatingStatusId(null);
          return false;
        }

        enqueueSyncItem({
          scope: 'services',
          entityType: 'service-order',
          entityId: serviceId,
          operation: 'update',
          payload: { status: nextStatus },
        });

        const nextServices = services.map((service) =>
          service.id === serviceId
            ? { ...service, status: nextStatus, syncState: 'pending' as const }
            : service,
        );

        setServices(nextServices);
        persistServicesLocally(nextServices);
        toast.success(
          `Estatus actualizado localmente a ${statusMessage(nextStatus)}. Pendiente de sincronizacion.`,
        );
        setUpdatingStatusId(null);
        return true;
      }

      const response = await updateServiceStatus(serviceId, nextStatus);
      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo actualizar el estatus del servicio.');
        setUpdatingStatusId(null);
        return false;
      }

      toast.success(`Servicio actualizado a ${statusMessage(nextStatus)}.`);
      clearQueryCacheByPrefix(SERVICES_CACHE_PREFIX);
      await fetchServices(debouncedSearch, filters, { silent: true, background: true });
      setUpdatingStatusId(null);
      return true;
    },
    [
      debouncedSearch,
      fetchServices,
      filters,
      isOnline,
      persistServicesLocally,
      services,
    ],
  );

  return {
    services,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    stats,
    catalogs,
    catalogsLoading,
    dataSource,
    snapshotUpdatedAt,
    loadFormCatalogs,
    saveService,
    saveServiceChanges,
    changeServiceStatus,
  };
}
