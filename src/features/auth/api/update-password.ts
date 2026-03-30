import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import { isPasswordStrong } from "@/helpers/passwordRules";

type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type UpdatePasswordResponse = {
  message: string;
};

export async function updateCurrentPassword(
  payload: UpdatePasswordPayload,
): Promise<ApiResult<UpdatePasswordResponse>> {
  const currentPassword = payload.currentPassword.trim();
  const newPassword = payload.newPassword.trim();
  const confirmPassword = payload.confirmPassword.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false, errors: ["Completa todos los campos."] };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, errors: ["Las contrasenas no coinciden."] };
  }

  if (!isPasswordStrong(newPassword)) {
    return {
      ok: false,
      errors: ["La nueva contrasena no cumple las reglas de seguridad."],
    };
  }

  const token = await authStore.getToken();
  if (!token) {
    return { ok: false, errors: ["No hay una sesión activa."] };
  }

  const runtime = getRuntimeConfig();
  return apiRequest<UpdatePasswordResponse>(
    {
      baseUrl: runtime.apiBaseUrl,
      token,
    },
    "/users/update-password",
    {
      method: "PATCH",
      body: JSON.stringify({
        current_password: currentPassword,
        password: newPassword,
      }),
    },
  );
}
