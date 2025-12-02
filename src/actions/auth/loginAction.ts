"use server";

import normalizeErrors from "@/helpers/normalizeErrors";
import { loginSchema, successSchema, userSchema } from "@/schemas";
import { cookies } from "next/headers";

type LoginType = {
  errors: string[];
  success: string;
  rol: string;
  mfa: boolean;
  email: string;
};

export async function login(
  prevState: LoginType,
  formData: FormData
): Promise<LoginType> {
  const cookieStore = await cookies();

  const loginData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(loginData);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message);
    return {
      errors,
      success: "",
      rol: "",
      mfa: false,
      email: "",
    };
  }

  const url = `${process.env.API_URL}/auth/login`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: parsed.data.email,
      password: parsed.data.password,
    }),
  });

  const json = await res.json().catch(() => ({}));

  // 🔐 Caso: el backend pide MFA
  if (res.ok && json?.mfa) {
    return {
      errors: [],
      success: json.message ?? "Se requiere verificación MFA",
      rol: "",
      mfa: true,
      email: json.email ?? parsed.data.email,
    };
  }

  // ❌ Errores normales (401, 400, etc)
  if (!res.ok) {
    return {
      ...normalizeErrors(json),
      success: "",
      rol: "",
      mfa: false,
      email: "",
    };
  }

  // ✅ Login normal (sin MFA)
  const token: string | undefined = json.token ?? json.accessToken;

  if (!token) {
    return {
      errors: ["No se recibió el token de autenticación"],
      success: "",
      rol: "",
      mfa: false,
      email: "",
    };
  }

  cookieStore.set({
    name: "ECONOLAB_TOKEN",
    value: token,
    httpOnly: true,
    path: "/",
  });

  const { message } = successSchema.parse(json);

  let rol = "";
  if (json.usuario) {
    const usuario = userSchema.parse(json.usuario);
    rol = usuario.rol;
  }

  return {
    errors: [],
    success: message,
    rol,
    mfa: false,
    email: "",
  };
}
