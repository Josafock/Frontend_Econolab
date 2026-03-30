import { apiRequest } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";

export async function logoutCurrentSession(): Promise<void> {
  const token = await authStore.getToken();
  const runtime = getRuntimeConfig();

  if (token) {
    await apiRequest<{ message: string }>(
      {
        baseUrl: runtime.apiBaseUrl,
        token,
      },
      "/auth/logout",
      {
        method: "POST",
      },
    ).catch(() => undefined);
  }

  await authStore.clearSession();
}

