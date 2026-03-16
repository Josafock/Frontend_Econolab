"use server";

import { z } from "zod";
import { fetchApi } from "@/actions/_lib/api";

const roleSchema = z.enum(["admin", "recepcionista", "unassigned"]);
const authProviderSchema = z.enum(["local", "google"]);

const profileSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value)),
  nombre: z.string(),
  email: z.string().email(),
  rol: roleSchema,
  confirmed: z.boolean().optional().default(true),
  profileImageUrl: z.string().nullable().optional().default(null),
  authProvider: authProviderSchema.optional().default("local"),
});

const updateProfileImageResponseSchema = z.object({
  message: z.string(),
  user: profileSchema,
});

export type ProfileUser = z.infer<typeof profileSchema>;

export async function getProfileAction() {
  const response = await fetchApi<ProfileUser>("/users/me");

  if (!response.ok) {
    return response;
  }

  const parsed = profileSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false as const, errors: ["No se pudo leer la informacion del perfil."] };
  }

  return { ok: true as const, data: parsed.data };
}

export async function updateProfileImageAction(formData: FormData) {
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return { ok: false as const, errors: ["Selecciona una imagen antes de guardar."] };
  }

  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimes.includes(image.type)) {
    return {
      ok: false as const,
      errors: ["Usa una imagen JPG, PNG o WEBP."],
    };
  }

  if (image.size > 2 * 1024 * 1024) {
    return {
      ok: false as const,
      errors: ["La imagen no debe exceder 2 MB."],
    };
  }

  const payload = new FormData();
  payload.set("image", image, image.name);

  const response = await fetchApi<z.infer<typeof updateProfileImageResponseSchema>>(
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
    return { ok: false as const, errors: ["No se pudo actualizar la foto del perfil."] };
  }

  return { ok: true as const, data: parsed.data };
}
