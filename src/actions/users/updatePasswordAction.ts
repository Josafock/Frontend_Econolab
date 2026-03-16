"use server";

import { fetchApi } from "@/actions/_lib/api";
import { isPasswordStrong } from "@/helpers/passwordRules";

type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type UpdatePasswordResponse = {
  message: string;
};

export async function updatePasswordAction(payload: UpdatePasswordPayload) {
  const currentPassword = payload.currentPassword.trim();
  const newPassword = payload.newPassword.trim();
  const confirmPassword = payload.confirmPassword.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false as const, errors: ["Completa todos los campos."] };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false as const, errors: ["Las contrasenas no coinciden."] };
  }

  if (!isPasswordStrong(newPassword)) {
    return {
      ok: false as const,
      errors: ["La nueva contrasena no cumple las reglas de seguridad."],
    };
  }

  return fetchApi<UpdatePasswordResponse>("/users/update-password", {
    method: "PATCH",
    body: JSON.stringify({
      current_password: currentPassword,
      password: newPassword,
    }),
  });
}
