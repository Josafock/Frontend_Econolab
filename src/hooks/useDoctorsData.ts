'use client';

import {
  createDoctor,
  getDoctors,
  hardDeleteDoctor,
  updateDoctorStatus,
  type CreateDoctorPayload,
  type Doctor,
  type DoctorStatusFilter,
} from '@/actions/doctors/doctorsActions';
import { clearQueryCacheByPrefix, getQueryCache, setQueryCache } from '@/hooks/_lib/clientQueryCache';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

export type UiDoctor = {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  especialidad: string;
  cedula: string;
  telefono: string;
  email: string;
  notas: string;
  fechaRegistro: string;
  estatus: 'Activo' | 'Inactivo';
  isActive: boolean;
};

const CACHE_KEY_PREFIX = 'doctors:list:';

function toUiDoctor(doctor: Doctor): UiDoctor {
  const nombre = (doctor.firstName ?? '').toUpperCase();
  const apellidoPaterno = (doctor.lastName ?? '').toUpperCase();
  const apellidoMaterno = (doctor.middleName ?? '').toUpperCase();

  return {
    id: doctor.id,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    nombreCompleto: [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' '),
    especialidad: doctor.specialty ?? 'Sin especialidad',
    cedula: doctor.licenseNumber ?? '-',
    telefono: doctor.phone ?? '-',
    email: doctor.email ?? '-',
    notas: doctor.notes ?? '',
    fechaRegistro: doctor.createdAt ?? '',
    estatus: doctor.isActive === false ? 'Inactivo' : 'Activo',
    isActive: doctor.isActive !== false,
  };
}

function getCacheKey(search: string): string {
  return `${CACHE_KEY_PREFIX}${search}`;
}

export function useDoctorsData(
  searchTerm: string,
  statusFilter: DoctorStatusFilter = 'all',
) {
  const [doctors, setDoctors] = useState<UiDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350);

  const fetchDoctors = useCallback(async (search: string, options?: { silent?: boolean; background?: boolean }) => {
    if (options?.background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const response = await getDoctors({ search, limit: 1000, status: 'all' });

    if (!response.ok) {
      if (!options?.silent) {
        toast.error(response.errors[0] ?? 'No se pudieron cargar médicos.');
      }

      if (!options?.background) {
        setDoctors([]);
      }

      setLoading(false);
      setRefreshing(false);
      return;
    }

    const mapped = response.data.data.map(toUiDoctor);
    setDoctors(mapped);
    setQueryCache(getCacheKey(search), mapped);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const cacheKey = getCacheKey(debouncedSearch);
    const cached = getQueryCache<UiDoctor[]>(cacheKey);

    if (cached) {
      setDoctors(cached.data);
      setLoading(false);
      void fetchDoctors(debouncedSearch, { background: true, silent: true });
      return;
    }

    void fetchDoctors(debouncedSearch);
  }, [debouncedSearch, fetchDoctors]);

  const addDoctor = useCallback(
    async (payload: CreateDoctorPayload) => {
      setSaving(true);
      const response = await createDoctor(payload);

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo registrar el médico.');
        setSaving(false);
        return false;
      }

      toast.success('Médico registrado con éxito.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchDoctors(debouncedSearch);
      setSaving(false);
      return true;
    },
    [debouncedSearch, fetchDoctors],
  );

  const toggleDoctorStatusById = useCallback(
    async (doctor: UiDoctor) => {
      setUpdatingStatusId(doctor.id);

      const response = await updateDoctorStatus(doctor.id, !doctor.isActive);
      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo actualizar el estatus del médico.');
        setUpdatingStatusId(null);
        return false;
      }

      toast.success(doctor.isActive ? 'Médico suspendido.' : 'Médico reactivado.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchDoctors(debouncedSearch, { silent: true, background: true });
      setUpdatingStatusId(null);
      return true;
    },
    [debouncedSearch, fetchDoctors],
  );

  const deleteDoctorById = useCallback(
    async (doctor: UiDoctor) => {
      setDeletingId(doctor.id);

      const response = await hardDeleteDoctor(doctor.id);
      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo eliminar el médico.');
        setDeletingId(null);
        return false;
      }

      toast.success('Médico eliminado definitivamente.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchDoctors(debouncedSearch, { silent: true, background: true });
      setDeletingId(null);
      return true;
    },
    [debouncedSearch, fetchDoctors],
  );

  const visibleDoctors = useMemo(() => {
    if (statusFilter === 'all') {
      return doctors;
    }

    return doctors.filter((doctor) =>
      statusFilter === 'active' ? doctor.isActive : !doctor.isActive,
    );
  }, [doctors, statusFilter]);

  const especialidadesUnicas = useMemo(
    () => new Set(doctors.map((doctor) => doctor.especialidad)).size,
    [doctors],
  );
  const activos = useMemo(
    () => doctors.filter((doctor) => doctor.isActive).length,
    [doctors],
  );
  const inactivos = useMemo(
    () => doctors.filter((doctor) => !doctor.isActive).length,
    [doctors],
  );

  return {
    doctors: visibleDoctors,
    allDoctors: doctors,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    deletingId,
    especialidadesUnicas,
    activos,
    inactivos,
    addDoctor,
    toggleDoctorStatusById,
    deleteDoctorById,
    reloadDoctors: () => fetchDoctors(debouncedSearch, { silent: true, background: true }),
  };
}
