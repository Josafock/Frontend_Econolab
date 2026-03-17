export function normalizeSearchText(value?: string | null): string {
  if (!value) return '';

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function matchesNormalizedSearch(
  haystack: Array<string | number | null | undefined>,
  query: string,
): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return haystack.some((value) => normalizeSearchText(String(value ?? '')).includes(normalizedQuery));
}
