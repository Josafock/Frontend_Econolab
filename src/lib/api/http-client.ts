import { normalizeApiErrors } from "@/lib/api/api-error";

export type ApiResult<T> =
  | { ok: true; data: T; meta?: { page: number; limit: number; total: number } }
  | { ok: false; errors: string[]; status?: number };

export type RequestContext = {
  baseUrl: string;
  token?: string | null;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 12000;

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

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort("request-timeout");
  }, DEFAULT_REQUEST_TIMEOUT_MS);
  const externalSignal = init?.signal;

  const handleExternalAbort = () => {
    controller.abort(
      typeof externalSignal?.reason === "string"
        ? externalSignal.reason
        : "request-aborted",
    );
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      handleExternalAbort();
    } else {
      externalSignal.addEventListener("abort", handleExternalAbort, {
        once: true,
      });
    }
  }

  try {
    const response = await fetch(buildUrl(context.baseUrl, path), {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
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
  } catch (error) {
    const isTimeout =
      error instanceof DOMException && error.name === "AbortError";

    return {
      ok: false,
      errors: [
        isTimeout
          ? "La solicitud tardó demasiado. Intenta de nuevo."
          : "No fue posible conectar con el sistema en este momento.",
      ],
    };
  } finally {
    window.clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", handleExternalAbort);
    }
  }
}

