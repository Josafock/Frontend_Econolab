import type { ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import type { FilePayload } from "@/lib/files/file-service";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";

function getFilenameFromDisposition(
  disposition: string | null,
  fallback: string,
): string {
  if (!disposition) {
    return fallback;
  }

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const basicMatch = disposition.match(/filename="?([^"]+)"?/i);
  if (basicMatch?.[1]) {
    return basicMatch[1];
  }

  return fallback;
}

async function readErrorMessage(response: Response, fallback: string) {
  const payload = await response.text().catch(() => "");
  if (!payload) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(payload) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) {
      return parsed.message[0] ?? fallback;
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    return payload;
  }

  return fallback;
}

export async function fetchProtectedFile(
  path: string,
  fallbackFilename: string,
  fallbackError: string,
): Promise<ApiResult<FilePayload>> {
  const token = await authStore.getToken();
  const runtime = getRuntimeConfig();

  if (!token) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const response = await fetch(`${runtime.apiBaseUrl}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      errors: [await readErrorMessage(response, fallbackError)],
    };
  }

  const blob = await response.blob();
  const contentType = response.headers.get("Content-Type") ?? "application/octet-stream";
  const filename = getFilenameFromDisposition(
    response.headers.get("Content-Disposition"),
    fallbackFilename,
  );

  return {
    ok: true,
    data: {
      blob,
      filename,
      contentType,
    },
  };
}
