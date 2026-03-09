'use client';

import { getDoctors, type Doctor } from '@/actions/doctors/doctorsActions';
import { getPatients, type Patient } from '@/actions/patients/patientsActions';
import { createService, getServices, updateServiceStatus, type ServiceOrder, type ServiceStatus } from '@/actions/services/servicesActions';
import { getStudies, type Study } from '@/actions/studies/studiesActions';
import { clearQueryCacheByPrefix, getQueryCache, setQueryCache } from '@/hooks/_lib/clientQueryCache';
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
  creador: string;
  fechaEntrega: string;
  costo: string;
  status: ServiceStatus;
};

const SERVICES_CACHE_PREFIX = 'services:list:';
const CATALOGS_CACHE_KEY = 'services:catalogs';

function formatDate(date?: string | null): string {
  if (!date) return 'N/D';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'N/D';
  return parsed.toLocaleString('es-MX');
}

function toUiService(service: ServiceOrder): UiService {
  const studyNames = (service.items ?? []).map((item) => item.studyNameSnapshot).join(', ');
  const patientName = service.patient
    ? `${service.patient.firstName} ${service.patient.lastName} ${service.patient.middleName ?? ''}`.trim()
    : 'Sin paciente';

  return {
    id: service.id,
    folio: service.folio,
    estudio: studyNames || 'Sin estudios',
    paciente: patientName,
    telefono: service.patient?.phone ?? '-',
    sucursal: service.branchName ?? 'Sin sucursal',
    creador: formatDate(service.createdAt),
    fechaEntrega: formatDate(service.deliveryAt),
    costo: Number(service.totalAmount).toFixed(2),
    status: service.status,
  };
}

function getServicesCacheKey(search: string): string {
  return `${SERVICES_CACHE_PREFIX}${search}`;
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

type AddServiceInput = {
  folio: string;
  patientId: number;
  doctorId?: number;
  studyId: number;
  branchName: string;
  deliveryAt: string;
};

type CatalogsState = {
  patients: Patient[];
  doctors: Doctor[];
  studies: Study[];
};

export function useServicesData(searchTerm: string) {
  const [services, setServices] = useState<UiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [catalogs, setCatalogs] = useState<CatalogsState>({ patients: [], doctors: [], studies: [] });

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350);

  const fetchServices = useCallback(async (search: string, options?: { silent?: boolean; background?: boolean }) => {
    if (options?.background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const response = await getServices({ search, limit: 100 });

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
    setQueryCache(getServicesCacheKey(search), mapped);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const loadFormCatalogs = useCallback(async () => {
    const cached = getQueryCache<CatalogsState>(CATALOGS_CACHE_KEY);

    if (cached) {
      setCatalogs(cached.data);
      setCatalogsLoading(false);
    }

    const [patientsResponse, doctorsResponse, studiesResponse] = await Promise.all([
      getPatients({ limit: 200 }),
      getDoctors({ limit: 200 }),
      getStudies({ limit: 200, status: 'active' }),
    ]);

    const nextCatalogs: CatalogsState = {
      patients: patientsResponse.ok ? patientsResponse.data.data : cached?.data.patients ?? [],
      doctors: doctorsResponse.ok ? doctorsResponse.data.data : cached?.data.doctors ?? [],
      studies: studiesResponse.ok ? studiesResponse.data.data : cached?.data.studies ?? [],
    };

    setCatalogs(nextCatalogs);
    setCatalogsLoading(false);
    setQueryCache(CATALOGS_CACHE_KEY, nextCatalogs);
  }, []);

  useEffect(() => {
    void loadFormCatalogs();
  }, [loadFormCatalogs]);

  useEffect(() => {
    const cacheKey = getServicesCacheKey(debouncedSearch);
    const cached = getQueryCache<UiService[]>(cacheKey);

    if (cached) {
      setServices(cached.data);
      setLoading(false);
      void fetchServices(debouncedSearch, { background: true, silent: true });
      return;
    }

    void fetchServices(debouncedSearch);
  }, [debouncedSearch, fetchServices]);

  const addService = useCallback(
    async (newService: AddServiceInput) => {
      setSaving(true);
      const response = await createService({
        folio: newService.folio,
        patientId: newService.patientId,
        doctorId: newService.doctorId,
        branchName: newService.branchName,
        deliveryAt: newService.deliveryAt,
        items: [
          {
            studyId: newService.studyId,
            priceType: 'normal',
            quantity: 1,
          },
        ],
      });

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo crear el servicio.');
        setSaving(false);
        return false;
      }

      toast.success(`Servicio ${newService.folio} agregado exitosamente.`);
      clearQueryCacheByPrefix(SERVICES_CACHE_PREFIX);
      await fetchServices(debouncedSearch);
      setSaving(false);
      return true;
    },
    [debouncedSearch, fetchServices],
  );

  const stats = useMemo(() => {
    const completed = services.filter((s) => s.status === 'completed').length;
    const inProgress = services.filter((s) => s.status === 'in_progress').length;
    const income = services.reduce((acc, s) => acc + Number(s.costo), 0);
    return { total: services.length, completed, inProgress, income };
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
      await fetchServices(debouncedSearch, { silent: true, background: true });
      setUpdatingStatusId(null);
      return true;
    },
    [debouncedSearch, fetchServices],
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
    addService,
    changeServiceStatus,
  };
}
