const DISPLAY_LOCALE = 'es-MX';

function getClientTimeZone(): string | undefined {
  if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) {
    return undefined;
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function parseBackendDate(value: string): Date | null {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsedDateOnly = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsedDateOnly.getTime()) ? null : parsedDateOnly;
  }

  const normalizedSpacing = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)
    ? value.replace(' ', 'T')
    : value;
  const parsed = new Date(normalizedSpacing);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toDateTimeLocalInput(value?: string | null): string {
  if (!value) return '';

  const parsed = parseBackendDate(value);
  if (!parsed) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function toApiDateTime(value?: string | null): string | undefined {
  if (!value) return undefined;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString();
}

export function formatDate(value?: string | null): string {
  if (!value) return 'N/D';

  const parsed = parseBackendDate(value);
  if (!parsed) return 'N/D';

  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    timeZone: getClientTimeZone(),
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return 'N/D';

  const parsed = parseBackendDate(value);
  if (!parsed) return 'N/D';

  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    timeZone: getClientTimeZone(),
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(parsed);
}
