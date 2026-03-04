import "server-only";

import { cookies } from "next/headers";

export type ApiResult<T> =
  | { ok: true; data: T; meta?: { page: number; limit: number; total: number } }
  | { ok: false; errors: string[] };

function getErrorMessages(json: unknown): string[] {
  if (!json || typeof json !== "object") {
    return ["Error desconocido"];
  }

  const candidate = json as { errors?: unknown; message?: unknown };

  if (Array.isArray(candidate.errors)) {
    return candidate.errors.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "message" in item) {
        const msg = (item as { message?: unknown }).message;
        if (typeof msg === "string") return msg;
      }
      return "Error inesperado";
    });
  }

  if (typeof candidate.message === "string") {
    return [candidate.message];
  }

  return ["Error desconocido"];
}

export async function fetchApi<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const token = (await cookies()).get("ECONOLAB_TOKEN")?.value;

  if (!token) {
    return { ok: false, errors: ["Tu sesion expiro. Inicia sesion nuevamente."] };
  }

  const url = `${process.env.API_URL}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });

    const json = (await res.json().catch(() => ({}))) as T;

    if (!res.ok) {
      return { ok: false, errors: getErrorMessages(json) };
    }

    return { ok: true, data: json };
  } catch {
    return {
      ok: false,
      errors: ["No fue posible conectar con el backend."],
    };
  }
}
