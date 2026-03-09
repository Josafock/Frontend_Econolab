'use client';

import { createPatient, deactivatePatient, getPatients, type CreatePatientPayload, type Patient } from '@/actions/patients/patientsActions';
import { clearQueryCacheByPrefix, getQueryCache, setQueryCache } from '@/hooks/_lib/clientQueryCache';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

export type UiPatient = {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  genero: 'Femenino' | 'Masculino' | 'Otro';
  telefono: string;
  email: string;
  colonia: string;
  ciudad: string;
  fechaRegistro: string;
};

const CACHE_KEY_PREFIX = 'patients:list:';

function toUiPatient(patient: Patient): UiPatient {
  return {
    id: patient.id,
    nombre: (patient.firstName ?? '').toUpperCase(),
    apellidoPaterno: (patient.lastName ?? '').toUpperCase(),
    apellidoMaterno: (patient.middleName ?? '').toUpperCase(),
    fechaNacimiento: patient.birthDate,
    genero: patient.gender === 'female' ? 'Femenino' : patient.gender === 'male' ? 'Masculino' : 'Otro',
    telefono: patient.phone ?? '-',
    email: patient.email ?? '-',
    colonia: patient.addressLine ?? '-',
    ciudad: patient.addressCity ?? '-',
    fechaRegistro: patient.createdAt ?? '',
  };
}

function getCacheKey(search: string): string {
  return `${CACHE_KEY_PREFIX}${search}`;
}

export function calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }

  return Number.isNaN(edad) ? 0 : edad;
}

export function usePatientsData(searchTerm: string) {
  const [patients, setPatients] = useState<UiPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350);

  const fetchPatients = useCallback(
    async (search: string, options?: { silent?: boolean; background?: boolean }) => {
      if (options?.background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getPatients({ search, limit: 100 });

      if (!response.ok) {
        if (!options?.silent) {
          toast.error(response.errors[0] ?? 'No se pudieron cargar pacientes.');
        }

        if (!options?.background) {
          setPatients([]);
        }

        setLoading(false);
        setRefreshing(false);
        return;
      }

      const mapped = response.data.data.map(toUiPatient);
      setPatients(mapped);
      setQueryCache(getCacheKey(search), mapped);
      setLoading(false);
      setRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    const cacheKey = getCacheKey(debouncedSearch);
    const cached = getQueryCache<UiPatient[]>(cacheKey);

    if (cached) {
      setPatients(cached.data);
      setLoading(false);
      void fetchPatients(debouncedSearch, { background: true, silent: true });
      return;
    }

    void fetchPatients(debouncedSearch);
  }, [debouncedSearch, fetchPatients]);

  const addPatient = useCallback(
    async (newPatient: CreatePatientPayload) => {
      setSaving(true);
      const response = await createPatient(newPatient);

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo registrar el paciente.');
        setSaving(false);
        return false;
      }

      toast.success('Paciente registrado con exito.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchPatients(debouncedSearch);
      setSaving(false);
      return true;
    },
    [debouncedSearch, fetchPatients],
  );

  const promedioEdad = useMemo(() => {
    if (!patients.length) return 0;
    return Math.round(patients.reduce((acc, p) => acc + calcularEdad(p.fechaNacimiento), 0) / patients.length);
  }, [patients]);

  const deactivatePatientById = useCallback(
    async (patient: UiPatient) => {
      setUpdatingStatusId(patient.id);

      const response = await deactivatePatient(patient.id);
      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo desactivar el paciente.');
        setUpdatingStatusId(null);
        return false;
      }

      toast.success('Paciente desactivado.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchPatients(debouncedSearch, { silent: true, background: true });
      setUpdatingStatusId(null);
      return true;
    },
    [debouncedSearch, fetchPatients],
  );

  return {
    patients,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    promedioEdad,
    addPatient,
    deactivatePatientById,
  };
}
