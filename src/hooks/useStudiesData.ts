'use client';

import {
  createStudy,
  getStudies,
  removeStudy,
  updateStudyStatus,
  type CreateStudyPayload,
  type Study,
  type StudyStatusFilter,
  type StudyTypeFilter,
} from '@/actions/studies/studiesActions';
import {
  clearQueryCacheByPrefix,
  getQueryCache,
  setQueryCache,
} from '@/hooks/_lib/clientQueryCache';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

const CACHE_KEY_PREFIX = 'studies:list:';

function getCacheKey(search: string): string {
  return `${CACHE_KEY_PREFIX}${search}`;
}

export function useStudiesData(
  searchTerm: string,
  statusFilter: StudyStatusFilter = 'all',
  typeFilter: StudyTypeFilter = 'all',
) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350);

  const fetchStudies = useCallback(
    async (search: string, options?: { silent?: boolean; background?: boolean }) => {
      if (options?.background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getStudies({ search, limit: 1000 });

      if (!response.ok) {
        if (!options?.silent) {
          toast.error(response.errors[0] ?? 'No se pudieron cargar estudios.');
        }

        if (!options?.background) {
          setStudies([]);
        }

        setLoading(false);
        setRefreshing(false);
        return;
      }

      setStudies(response.data.data);
      setQueryCache(getCacheKey(search), response.data.data);
      setLoading(false);
      setRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    const cacheKey = getCacheKey(debouncedSearch);
    const cached = getQueryCache<Study[]>(cacheKey);

    if (cached) {
      setStudies(cached.data);
      setLoading(false);
      void fetchStudies(debouncedSearch, { background: true, silent: true });
      return;
    }

    void fetchStudies(debouncedSearch);
  }, [debouncedSearch, fetchStudies]);

  const addStudy = useCallback(
    async (payload: CreateStudyPayload) => {
      setSaving(true);
      const response = await createStudy(payload);

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo crear el estudio.');
        setSaving(false);
        return false;
      }

      toast.success('Estudio registrado con exito.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchStudies(debouncedSearch);
      setSaving(false);
      return true;
    },
    [debouncedSearch, fetchStudies],
  );

  const toggleStudyStatus = useCallback(
    async (study: Study) => {
      const nextStatus = study.status === 'active' ? 'suspended' : 'active';
      setUpdatingStatusId(study.id);

      const response = await updateStudyStatus(study.id, nextStatus);
      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo actualizar el estatus del estudio.');
        setUpdatingStatusId(null);
        return false;
      }

      toast.success(nextStatus === 'active' ? 'Estudio activado.' : 'Estudio suspendido.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchStudies(debouncedSearch, { silent: true, background: true });
      setUpdatingStatusId(null);
      return true;
    },
    [debouncedSearch, fetchStudies],
  );

  const deleteStudyById = useCallback(
    async (study: Study) => {
      setRemovingId(study.id);
      const response = await removeStudy(study.id);

      if (!response.ok) {
        toast.error(response.errors[0] ?? 'No se pudo eliminar el estudio.');
        setRemovingId(null);
        return false;
      }

      toast.success('Estudio eliminado del catalogo.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchStudies(debouncedSearch, { silent: true, background: true });
      setRemovingId(null);
      return true;
    },
    [debouncedSearch, fetchStudies],
  );

  const visibleStudies = useMemo(() => {
    return studies.filter((study) => {
      const matchesStatus =
        statusFilter === 'all' ? true : study.status === statusFilter;
      const matchesType = typeFilter === 'all' ? true : study.type === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [studies, statusFilter, typeFilter]);

  const activos = useMemo(
    () => studies.filter((study) => study.status === 'active').length,
    [studies],
  );
  const suspendidos = useMemo(
    () => studies.filter((study) => study.status === 'suspended').length,
    [studies],
  );
  const precioPromedio = useMemo(() => {
    if (!visibleStudies.length) return 0;
    return Math.round(
      visibleStudies.reduce((acc, study) => acc + Number(study.normalPrice), 0) /
        visibleStudies.length,
    );
  }, [visibleStudies]);

  return {
    studies: visibleStudies,
    allStudies: studies,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    removingId,
    activos,
    suspendidos,
    precioPromedio,
    addStudy,
    toggleStudyStatus,
    deleteStudyById,
    reloadStudies: () => fetchStudies(debouncedSearch, { silent: true, background: true }),
  };
}
