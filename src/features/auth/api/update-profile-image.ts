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

const updateProfileImageResponseSchema = z.object({
  message: z.string(),
  user: profileSchema,
});

export async function updateCurrentProfileImage(
  image: File,
): Promise<ApiResult<{ message: string; user: ProfileResponsePayload }>> {
  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, errors: ["Selecciona una imagen antes de guardar."] };
  }

  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimes.includes(image.type)) {
    return {
      ok: false,
      errors: ["Usa una imagen JPG, PNG o WEBP."],
    };
  }

  if (image.size > 2 * 1024 * 1024) {
    return {
      ok: false,
      errors: ["La imagen no debe exceder 2 MB."],
    };
  }

  const token = await authStore.getToken();
  if (!token) {
    return { ok: false, errors: ["No hay una sesión activa."] };
  }

  const payload = new FormData();
  payload.set("image", image, image.name);

  const runtime = getRuntimeConfig();
  const response = await apiRequest<z.infer<typeof updateProfileImageResponseSchema>>(
    {
      baseUrl: runtime.apiBaseUrl,
      token,
    },
    "/users/profile-image",
    {
      method: "PATCH",
      body: payload,
    },
  );

  if (!response.ok) {
    return response;
  }

  const parsed = updateProfileImageResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["No se pudo actualizar la foto del perfil."],
    };
  }

  return {
    ok: true,
    data: {
      message: parsed.data.message,
      user: parsed.data.user,
    },
  };
}

