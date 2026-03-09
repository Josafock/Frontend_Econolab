type CacheEntry<T> = {
  data: T;
  updatedAt: number;
};

const queryCache = new Map<string, CacheEntry<unknown>>();

export function getQueryCache<T>(key: string): CacheEntry<T> | null {
  const value = queryCache.get(key);
  if (!value) return null;
  return value as CacheEntry<T>;
}

export function setQueryCache<T>(key: string, data: T): void {
  queryCache.set(key, {
    data,
    updatedAt: Date.now(),
  });
}

export function clearQueryCacheByPrefix(prefix: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key);
    }
  }
}
