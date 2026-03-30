import { z } from "zod";
import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import type { ProfileResponsePayload } from "@/features/auth/model/auth-types";

const profileSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value)),
  nombre: z.string(),
  email: z.string().email(),
  rol: z.enum(["admin", "recepcionista", "unassigned"]),
  confirmed: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  profileImageUrl: z.string().nullable().optional().default(null),
  authProvider: z.enum(["local", "google"]).optional().default("local"),
});

const updateProfileResponseSchema = z.object({
  message: z.string(),
  token: z.string().min(1),
  user: profileSchema,
});

type UpdateProfilePayload = {
  nombre: string;
  email: string;
};

export async function updateCurrentProfile(
  payload: UpdateProfilePayload,
): Promise<ApiResult<{ message: string; user: ProfileResponsePayload }>> {
  const nombre = payload.nombre.trim();
  const email = payload.email.trim().toLowerCase();

  if (nombre.length < 2) {
    return { ok: false, errors: ["El nombre debe tener al menos 2 caracteres."] };
  }

  if (nombre.length > 100) {
    return { ok: false, errors: ["El nombre no puede superar 100 caracteres."] };
  }

  if (/[\<\>]/.test(nombre)) {
    return { ok: false, errors: ["El nombre contiene caracteres no permitidos."] };
  }

  const parsedEmail = z.string().email("El correo no es valido.").safeParse(email);
  if (!parsedEmail.success) {
    return {
      ok: false,
      errors: [parsedEmail.error.issues[0]?.message ?? "El correo no es valido."],
    };
  }

  const token = await authStore.getToken();
  if (!token) {
    return { ok: false, errors: ["No hay una sesión activa."] };
  }

  const runtime = getRuntimeConfig();
  const response = await apiRequest<z.infer<typeof updateProfileResponseSchema>>(
    {
      baseUrl: runtime.apiBaseUrl,
      token,
    },
    "/users/me",
    {
      method: "PATCH",
      body: JSON.stringify({ nombre, email }),
    },
  );

  if (!response.ok) {
    return response;
  }

  const parsed = updateProfileResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["No se pudo actualizar la informacion del perfil."],
    };
  }

  const currentSession = await authStore.getSession();
  await authStore.setSession({
    token: parsed.data.token,
    user: currentSession.user
      ? {
          ...currentSession.user,
          id: parsed.data.user.id,
          sub: parsed.data.user.id,
          nombre: parsed.data.user.nombre,
          email: parsed.data.user.email,
          rol: parsed.data.user.rol,
        }
      : null,
  });

  return {
    ok: true,
    data: {
      message: parsed.data.message,
      user: parsed.data.user,
    },
  };
}

