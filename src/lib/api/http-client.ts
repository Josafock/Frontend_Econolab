import { normalizeApiErrors } from "@/lib/api/api-error";

export type ApiResult<T> =
  | { ok: true; data: T; meta?: { page: number; limit: number; total: number } }
  | { ok: false; errors: string[]; status?: number };

export type RequestContext = {
  baseUrl: string;
  token?: string | null;
};

function buildUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function apiRequest<T>(
  context: RequestContext,
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  if (!context.baseUrl) {
    return {
      ok: false,
      errors: ["No se ha configurado la URL de la API."],
    };
  }

  const headers = new Headers(init?.headers);
  const isFormDataBody = init?.body instanceof FormData;

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (context.token) {
    headers.set("Authorization", `Bearer ${context.token}`);
  }

  try {
    const response = await fetch(buildUrl(context.baseUrl, path), {
      ...init,
      headers,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as T;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        errors: normalizeApiErrors(payload).errors,
      };
    }

    return { ok: true, data: payload };
  } catch {
    return {
      ok: false,
      errors: ["No fue posible conectar con el sistema en este momento."],
    };
  }
}

