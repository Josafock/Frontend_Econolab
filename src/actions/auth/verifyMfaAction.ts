"use server";

import normalizeErrors from "@/helpers/normalizeErrors";
import { TokenSchema, successSchema } from "@/schemas";
import { cookies } from "next/headers";

export type MfaState = {
  errors: string[];
  success: string;
  rol: string;
};

export async function verifyMfaAction(
  email: string,
  prevState: MfaState,
  formData: FormData
): Promise<MfaState> {
  const cookieStore = await cookies();

  const token = formData.get("token");

  const parsed = TokenSchema.safeParse(token);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => i.message);
    return {
      errors,
      success: "",
      rol: "",
    };
  }

  const url = `${process.env.API_URL}/auth/mfa/verify`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      code: parsed.data, // 👈 ya corregido antes
    }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ...normalizeErrors(json),
      success: "",
      rol: "",
    };
  }

  const tokenJwt: string | undefined = json.token ?? json.accessToken;
  if (!tokenJwt) {
    return {
      errors: ["No se recibió el token de autenticación"],
      success: "",
      rol: "",
    };
  }

  cookieStore.set({
    name: "ECONOLAB_TOKEN",
    value: tokenJwt,
    httpOnly: true,
    path: "/",
  });

  const { message } = successSchema.parse(json);

  // 👇 Aquí ya NO usamos userSchema, tomamos el rol directo si viene
  const rol =
    typeof json.usuario?.rol === "string"
      ? (json.usuario.rol as string)
      : typeof json.usuario?.role === "string"
      ? (json.usuario.role as string)
      : "";

  return {
    errors: [],
    success: message,
    rol,
  };
}
