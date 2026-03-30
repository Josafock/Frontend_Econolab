import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import {
  forgotPasswordSchema,
  registerSchema,
  resetPassSchema,
  successSchema,
  TokenSchema,
} from "@/schemas";

type MessageResponse = {
  message: string;
};

type RegisterAccountInput = {
  nombre: string;
  email: string;
  password: string;
  password2: string;
};

type ForgotPasswordInput = {
  email: string;
};

type ResetPasswordInput = {
  password: string;
  confirmPassword: string;
};

function buildPublicAuthContext() {
  const runtime = getRuntimeConfig();
  return { baseUrl: runtime.apiBaseUrl };
}

function extractMessageResult(
  response: ApiResult<MessageResponse>,
  fallbackError: string,
): ApiResult<MessageResponse> {
  if (!response.ok) {
    return response;
  }

  const parsed = successSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: [fallbackError],
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
}

export async function registerAccount(
  input: RegisterAccountInput,
): Promise<ApiResult<MessageResponse>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const response = await apiRequest<MessageResponse>(
    buildPublicAuthContext(),
    "/users/register",
    {
      method: "POST",
      body: JSON.stringify({
        nombre: parsed.data.nombre,
        email: parsed.data.email,
        password: parsed.data.password,
      }),
    },
  );

  return extractMessageResult(
    response,
    "No se pudo validar la respuesta del registro.",
  );
}

export async function confirmAccountToken(
  token: string,
): Promise<ApiResult<MessageResponse>> {
  const parsed = TokenSchema.safeParse(token);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const response = await apiRequest<MessageResponse>(
    buildPublicAuthContext(),
    "/users/confirm-account",
    {
      method: "POST",
      body: JSON.stringify({ token: parsed.data }),
    },
  );

  return extractMessageResult(
    response,
    "No se pudo validar la respuesta de confirmacion.",
  );
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<ApiResult<MessageResponse>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const response = await apiRequest<MessageResponse>(
    buildPublicAuthContext(),
    "/users/forgot-password",
    {
      method: "POST",
      body: JSON.stringify(parsed.data),
    },
  );

  return extractMessageResult(
    response,
    "No se pudo validar la respuesta de recuperacion.",
  );
}

export async function validatePasswordResetToken(
  token: string,
): Promise<ApiResult<MessageResponse>> {
  const parsed = TokenSchema.safeParse(token);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const response = await apiRequest<MessageResponse>(
    buildPublicAuthContext(),
    "/users/validate-reset-token",
    {
      method: "POST",
      body: JSON.stringify({ token: parsed.data }),
    },
  );

  return extractMessageResult(
    response,
    "No se pudo validar la respuesta del token.",
  );
}

export async function resetPasswordWithToken(
  token: string,
  input: ResetPasswordInput,
): Promise<ApiResult<MessageResponse>> {
  const parsedToken = TokenSchema.safeParse(token);
  if (!parsedToken.success) {
    return {
      ok: false,
      errors: parsedToken.error.issues.map((issue) => issue.message),
    };
  }

  const parsedInput = resetPassSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      ok: false,
      errors: parsedInput.error.issues.map((issue) => issue.message),
    };
  }

  const response = await apiRequest<MessageResponse>(
    buildPublicAuthContext(),
    `/users/reset-password/${parsedToken.data}`,
    {
      method: "POST",
      body: JSON.stringify({
        password: parsedInput.data.password,
      }),
    },
  );

  return extractMessageResult(
    response,
    "No se pudo validar la respuesta del cambio de contrasena.",
  );
}
