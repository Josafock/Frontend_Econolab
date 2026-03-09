'use client';

import { createDoctor, deactivateDoctor, getDoctors, type CreateDoctorPayload, type Doctor } from '@/actions/doctors/doctorsActions';
import { clearQueryCacheByPrefix, getQueryCache, setQueryCache } from '@/hooks/_lib/clientQueryCache';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

export type UiDoctor = {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  especialidad: string;
  cedula: string;
  telefono: string;
  email: string;
  estatus: 'Activo';
};

const CACHE_KEY_PREFIX = 'doctors:list:';

function toUiDoctor(doctor: Doctor): UiDoctor {
  return {
    id: doctor.id,
    nombre: (doctor.firstName ?? '').toUpperCase(),
    apellidoPaterno: (doctor.lastName ?? '').toUpperCase(),
    apellidoMaterno: (doctor.middleName ?? '').toUpperCase(),
    especialidad: doctor.specialty ?? 'Sin especialidad',
    cedula: doctor.licenseNumber ?? '-',
    telefono: doctor.phone ?? '-',
    email: doctor.email ?? '-',
    estatus: 'Activo',
  };
}

function getCacheKey(search: string): string {
  return `${CACHE_KEY_PREFIX}${search}`;
}

export function useDoctorsData(searchTerm: string) {
  const [doctors, setDoctors] = useState<UiDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350);

  const fetchDoctors = useCallback(async (search: string, options?: { silent?: boolean; background?: boolean }) => {
    if (options?.background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const response = await getDoctors({ search, limit: 100 });

    if (!response.ok) {
      if (!options?.silent) {
        toast.error(response.errors[0] ?? 'No se pudieron cargar medicos.');
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
        toast.error(response.errors[0] ?? 'No se pudo crear el medico.');
        setSaving(false);
        return false;
      }

      toast.success('Medico registrado con exito.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchDoctors(debouncedSearch);
      setSaving(false);
      return true;
    },
    [debouncedSearch, fetchDoctors],
  );

  const especialidadesUnicas = useMemo(() => new Set(doctors.map((d) => d.especialidad)).size, [doctors]);
  const conCedula = useMemo(() => doctors.filter((d) => d.cedula !== '-').length, [doctors]);

  const deactivateDoctorById = useCallback(
    async (doctor: UiDoctor) => {
      setUpdatingStatusId(doctor.id);

      const response = await deactivateDoctor(doctor.id);
      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo desactivar el medico.');
        setUpdatingStatusId(null);
        return false;
      }

      toast.success('Medico desactivado.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchDoctors(debouncedSearch, { silent: true, background: true });
      setUpdatingStatusId(null);
      return true;
    },
    [debouncedSearch, fetchDoctors],
  );

  return {
    doctors,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    especialidadesUnicas,
    conCedula,
    addDoctor,
    deactivateDoctorById,
  };
}
