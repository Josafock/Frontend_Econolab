"use server";

import { z } from "zod";
import { fetchApi } from "@/actions/_lib/api";
import { cookies } from "next/headers";

const roleSchema = z.enum(["admin", "recepcionista", "unassigned"]);
const authProviderSchema = z.enum(["local", "google"]);

const profileSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value)),
  nombre: z.string(),
  email: z.string().email(),
  rol: roleSchema,
  confirmed: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  profileImageUrl: z.string().nullable().optional().default(null),
  authProvider: authProviderSchema.optional().default("local"),
});

const updateProfileImageResponseSchema = z.object({
  message: z.string(),
  user: profileSchema,
});

const updateProfileResponseSchema = z.object({
  message: z.string(),
  token: z.string().min(1),
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

export async function updateProfileAction(payload: {
  nombre: string;
  email: string;
}) {
  const nombre = payload.nombre.trim();
  const email = payload.email.trim().toLowerCase();

  if (nombre.length < 2) {
    return { ok: false as const, errors: ["El nombre debe tener al menos 2 caracteres."] };
  }

  if (nombre.length > 100) {
    return { ok: false as const, errors: ["El nombre no puede superar 100 caracteres."] };
  }

  if (/[\<\>]/.test(nombre)) {
    return { ok: false as const, errors: ["El nombre contiene caracteres no permitidos."] };
  }

  const parsedEmail = z.string().email("El correo no es valido.").safeParse(email);
  if (!parsedEmail.success) {
    return { ok: false as const, errors: [parsedEmail.error.issues[0]?.message ?? "El correo no es valido."] };
  }

  const response = await fetchApi<z.infer<typeof updateProfileResponseSchema>>("/users/me", {
    method: "PATCH",
    body: JSON.stringify({
      nombre,
      email,
    }),
  });

  if (!response.ok) {
    return response;
  }

  const parsed = updateProfileResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false as const, errors: ["No se pudo actualizar la informacion del perfil."] };
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: "ECONOLAB_TOKEN",
    value: parsed.data.token,
    httpOnly: true,
    path: "/",
  });

  return { ok: true as const, data: parsed.data };
}
