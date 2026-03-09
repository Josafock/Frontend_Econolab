'use client';

import { createStudy, getStudies, updateStudyStatus, type CreateStudyPayload, type Study } from '@/actions/studies/studiesActions';
import { clearQueryCacheByPrefix, getQueryCache, setQueryCache } from '@/hooks/_lib/clientQueryCache';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

const CACHE_KEY_PREFIX = 'studies:list:';

function getCacheKey(search: string): string {
  return `${CACHE_KEY_PREFIX}${search}`;
}

export function useStudiesData(searchTerm: string) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 350);

  const fetchStudies = useCallback(async (search: string, options?: { silent?: boolean; background?: boolean }) => {
    if (options?.background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const response = await getStudies({ search, limit: 100 });

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
  }, []);

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

  const activos = useMemo(() => studies.filter((s) => s.status === 'active').length, [studies]);
  const inactivos = useMemo(() => studies.filter((s) => s.status === 'suspended').length, [studies]);
  const precioPromedio = useMemo(() => {
    if (!studies.length) return 0;
    return Math.round(studies.reduce((acc, s) => acc + Number(s.normalPrice), 0) / studies.length);
  }, [studies]);

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

      toast.success(nextStatus === 'active' ? 'Estudio activado.' : 'Estudio desactivado.');
      clearQueryCacheByPrefix(CACHE_KEY_PREFIX);
      await fetchStudies(debouncedSearch, { silent: true, background: true });
      setUpdatingStatusId(null);
      return true;
    },
    [debouncedSearch, fetchStudies],
  );

  return {
    studies,
    loading,
    refreshing,
    saving,
    updatingStatusId,
    activos,
    inactivos,
    precioPromedio,
    addStudy,
    toggleStudyStatus,
  };
}
