'use client';

import { getDoctors, type Doctor } from '@/actions/doctors/doctorsActions';
import { getPatients, type Patient } from '@/actions/patients/patientsActions';
import {
  createService,
  getServices,
  updateService,
  updateServiceStatus,
  type CreateServicePayload,
  type ServiceOrder,
  type ServiceStatus,
  type UpdateServicePayload,
} from '@/actions/services/servicesActions';
import { getStudies, type Study } from '@/actions/studies/studiesActions';
import {
  clearQueryCacheByPrefix,
  getQueryCache,
  setQueryCache,
} from '@/hooks/_lib/clientQueryCache';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
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
  };
}

function getServicesCacheKey(search: string, filters: ServicesFilters): string {
  return `${SERVICES_CACHE_PREFIX}${JSON.stringify({ search, ...filters })}`;
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

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350);

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
        if (!options?.silent) {
          toast.error(response.errors[0] ?? 'No se pudieron cargar servicios.');
        }

        if (!options?.background) {
          setServices([]);
        }

        setLoading(false);
        setRefreshing(false);
        return;
      }

      const mapped = response.data.data.map(toUiService);
      setServices(mapped);
      setQueryCache(getServicesCacheKey(search, nextFilters), mapped);
      setLoading(false);
      setRefreshing(false);
    },
    [],
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
  }, [catalogsLoaded]);

  useEffect(() => {
    const cacheKey = getServicesCacheKey(debouncedSearch, filters);
    const cached = getQueryCache<UiService[]>(cacheKey);

    if (cached) {
      setServices(cached.data);
      setLoading(false);
      void fetchServices(debouncedSearch, filters, { background: true, silent: true });
      return;
    }

    void fetchServices(debouncedSearch, filters);
  }, [debouncedSearch, fetchServices, filters]);

  const saveService = useCallback(
    async (payload: CreateServicePayload) => {
      setSaving(true);
      const response = await createService(payload);

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo crear el servicio.');
        setSaving(false);
        return false;
      }

      toast.success(`Servicio ${payload.folio} guardado con exito.`);
      clearQueryCacheByPrefix(SERVICES_CACHE_PREFIX);
      await fetchServices(debouncedSearch, filters);
      setSaving(false);
      return true;
    },
    [debouncedSearch, fetchServices, filters],
  );

  const saveServiceChanges = useCallback(
    async (serviceId: number, payload: UpdateServicePayload) => {
      setSaving(true);
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
    [debouncedSearch, fetchServices, filters],
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
    [debouncedSearch, fetchServices, filters],
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
    loadFormCatalogs,
    saveService,
    saveServiceChanges,
    changeServiceStatus,
  };
}
