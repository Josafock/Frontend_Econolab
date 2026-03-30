import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import { loginSchema, successSchema, userSchema } from "@/schemas";
import type {
  LoginCredentials,
  LoginResponsePayload,
} from "@/features/auth/model/auth-types";

export async function loginWithPassword(
  credentials: LoginCredentials,
): Promise<ApiResult<LoginResponsePayload>> {
  const parsed = loginSchema.safeParse(credentials);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const runtime = getRuntimeConfig();
  const response = await apiRequest<{
    message?: string;
    token?: string;
    accessToken?: string;
    usuario?: unknown;
  }>(
    { baseUrl: runtime.apiBaseUrl },
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(parsed.data),
    },
  );

  if (!response.ok) {
    return response;
  }

  const token = response.data.token ?? response.data.accessToken;
  if (!token) {
    return {
      ok: false,
      errors: ["No se recibió el token de autenticación."],
    };
  }

  const messageResult = successSchema.safeParse(response.data);
  if (!messageResult.success) {
    return {
      ok: false,
      errors: ["No se pudo validar la respuesta del inicio de sesión."],
    };
  }

  const userResult = userSchema.safeParse(response.data.usuario);
  if (!userResult.success) {
    return {
      ok: false,
      errors: ["No se pudo validar la información del usuario autenticado."],
    };
  }

  const session = {
    token,
    user: userResult.data,
  };

  await authStore.setSession(session);

  return {
    ok: true,
    data: {
      message: messageResult.data.message,
      token,
      user: userResult.data,
    },
  };
}

