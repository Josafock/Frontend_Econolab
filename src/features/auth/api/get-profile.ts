import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import type { ProfileResponsePayload } from "@/features/auth/model/auth-types";

export async function getCurrentProfile(): Promise<ApiResult<ProfileResponsePayload>> {
  const token = await authStore.getToken();

  if (!token) {
    return {
      ok: false,
      errors: ["No hay una sesión activa."],
    };
  }

  const runtime = getRuntimeConfig();
  return apiRequest<ProfileResponsePayload>(
    {
      baseUrl: runtime.apiBaseUrl,
      token,
    },
    "/users/me",
  );
}

