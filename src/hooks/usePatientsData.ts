'use client';

import {
  createPatient,
  getPatients,
  updatePatientStatus,
  type CreatePatientPayload,
  type Patient,
  type PatientStatusFilter,
} from '@/actions/patients/patientsActions';
import {
  clearQueryCacheByPrefix,
  getQueryCache,
  setQueryCache,
} from '@/hooks/_lib/clientQueryCache';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

export type UiPatient = {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  genero: 'Femenino' | 'Masculino' | 'Otro';
  telefono: string;
  email: string;
  direccion: string;
  entreCalles: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  documento: string;
  fechaRegistro: string;
  estatus: 'Activo' | 'Inactivo';
  isActive: boolean;
};

const CACHE_KEY_PREFIX = 'patients:list:';

function toUiPatient(patient: Patient): UiPatient {
  const nombre = (patient.firstName ?? '').toUpperCase();
  const apellidoPaterno = (patient.lastName ?? '').toUpperCase();
  const apellidoMaterno = (patient.middleName ?? '').toUpperCase();
  const documentLabel =
    patient.documentType && patient.documentNumber
      ? `${patient.documentType}: ${patient.documentNumber}`
      : 'Sin documento';

  return {
    id: patient.id,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    nombreCompleto: [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' '),
    fechaNacimiento: patient.birthDate,
    genero:
      patient.gender === 'female'
        ? 'Femenino'
        : patient.gender === 'male'
          ? 'Masculino'
          : 'Otro',
    telefono: patient.phone ?? '-',
    email: patient.email ?? '-',
    direccion: patient.addressLine ?? '-',
    entreCalles: patient.addressBetween ?? '-',
    ciudad: patient.addressCity ?? '-',
    estado: patient.addressState ?? '-',
    codigoPostal: patient.addressZip ?? '-',
    documento: documentLabel,
    fechaRegistro: patient.createdAt ?? '',
    estatus: patient.isActive === false ? 'Inactivo' : 'Activo',
    isActive: patient.isActive !== false,
  };
}

function getCacheKey(search: string): string {
  return `${CACHE_KEY_PREFIX}${search}`;
}

export function calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }

  return Number.isNaN(edad) ? 0 : edad;
}

export function usePatientsData(
  searchTerm: string,
  statusFilter: PatientStatusFilter = 'all',
) {
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

      const response = await getPatients({ search, limit: 1000, status: 'all' });

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

  const togglePatientStatusById = useCallback(
    async (patient: UiPatient) => {
      setUpdatingStatusId(patient.id);

      const response = await updatePatientStatus(patient.id, !patient.isActive);
      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo actualizar el estatus del paciente.');
        setUpdatingStatusId(null);
        return false;
      }

      toast.success(patient.isActive ? 'Paciente suspendido.' : 'Paciente reactivado.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchPatients(debouncedSearch, { silent: true, background: true });
      setUpdatingStatusId(null);
      return true;
    },
    [debouncedSearch, fetchPatients],
  );

  const visiblePatients = useMemo(() => {
    if (statusFilter === 'all') {
      return patients;
    }

    return patients.filter((patient) =>
      statusFilter === 'active' ? patient.isActive : !patient.isActive,
    );
  }, [patients, statusFilter]);

  const promedioEdad = useMemo(() => {
    if (!visiblePatients.length) return 0;
    return Math.round(
      visiblePatients.reduce((acc, patient) => acc + calcularEdad(patient.fechaNacimiento), 0) /
        visiblePatients.length,
    );
  }, [visiblePatients]);

  const activos = useMemo(
    () => patients.filter((patient) => patient.isActive).length,
    [patients],
  );
  const inactivos = useMemo(
    () => patients.filter((patient) => !patient.isActive).length,
    [patients],
  );

  return {
    patients: visiblePatients,
    allPatients: patients,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    promedioEdad,
    activos,
    inactivos,
    addPatient,
    togglePatientStatusById,
  };
}
