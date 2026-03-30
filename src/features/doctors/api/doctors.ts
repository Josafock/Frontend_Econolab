import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import {
  createDoctorPayloadSchema,
  doctorMessageResponseSchema,
  doctorMutationResponseSchema,
  doctorSchema,
  doctorsSearchResponseSchema,
  updateDoctorPayloadSchema,
  updateDoctorStatusPayloadSchema,
  type CreateDoctorPayload as CreateDoctorPayloadInput,
  type Doctor as DoctorRecord,
  type DoctorMutationResponse,
  type DoctorsSearchResponse,
  type UpdateDoctorPayload as UpdateDoctorPayloadInput,
} from "@/schemas";

export type DoctorStatusFilter = "all" | "active" | "inactive";
export type Doctor = DoctorRecord;
export type CreateDoctorPayload = CreateDoctorPayloadInput;
export type UpdateDoctorPayload = UpdateDoctorPayloadInput;

async function createDoctorRequestContext() {
  const token = await authStore.getToken();
  const runtime = getRuntimeConfig();

  if (!token) {
    return null;
  }

  return {
    baseUrl: runtime.apiBaseUrl,
    token,
  };
}

export async function getDoctors(params?: {
  search?: string;
  page?: number;
  limit?: number;
  status?: DoctorStatusFilter;
}): Promise<ApiResult<DoctorsSearchResponse>> {
  const context = await createDoctorRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesión activa."] };
  }

  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiRequest<DoctorsSearchResponse>(context, `/doctors${suffix}`);
  if (!response.ok) return response;

  const parsed = doctorsSearchResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false, errors: ["La respuesta de medicos es invalida."] };
  }

  return { ok: true, data: parsed.data };
}

export async function createDoctor(
  payload: CreateDoctorPayload,
): Promise<ApiResult<DoctorMutationResponse>> {
  const context = await createDoctorRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesión activa."] };
  }

  const parsedPayload = createDoctorPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message ?? "Datos de medico invalidos.";
    return { ok: false, errors: [firstError] };
  }

  const response = await apiRequest<DoctorMutationResponse>(context, "/doctors", {
    method: "POST",
    body: JSON.stringify(parsedPayload.data),
  });
  if (!response.ok) return response;

  const parsed = doctorMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false, errors: ["La respuesta al crear medico es invalida."] };
  }

  return { ok: true, data: parsed.data };
}

export async function getDoctorById(id: number): Promise<ApiResult<Doctor>> {
  const context = await createDoctorRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesión activa."] };
  }

  const response = await apiRequest<Doctor>(context, `/doctors/${id}`);
  if (!response.ok) return response;

  const parsed = doctorSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta del detalle de medico es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function updateDoctor(
  id: number,
  payload: UpdateDoctorPayload,
): Promise<ApiResult<DoctorMutationResponse>> {
  const context = await createDoctorRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesión activa."] };
  }

  const parsedPayload = updateDoctorPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message ?? "Datos de medico invalidos.";
    return { ok: false, errors: [firstError] };
  }

  const response = await apiRequest<DoctorMutationResponse>(context, `/doctors/${id}`, {
    method: "PUT",
    body: JSON.stringify(parsedPayload.data),
  });
  if (!response.ok) return response;

  const parsed = doctorMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al actualizar medico es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function updateDoctorStatus(
  id: number,
  isActive: boolean,
): Promise<ApiResult<DoctorMutationResponse>> {
  const context = await createDoctorRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesión activa."] };
  }

  const parsedPayload = updateDoctorStatusPayloadSchema.safeParse({ isActive });
  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message ??
      "El estatus del medico es invalido.";
    return { ok: false, errors: [firstError] };
  }

  const response = await apiRequest<DoctorMutationResponse>(
    context,
    `/doctors/${id}/status`,
    {
      method: "PUT",
      body: JSON.stringify(parsedPayload.data),
    },
  );
  if (!response.ok) return response;

  const parsed = doctorMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al actualizar estatus es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function hardDeleteDoctor(
  id: number,
): Promise<ApiResult<{ message: string }>> {
  const context = await createDoctorRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesión activa."] };
  }

  const response = await apiRequest<{ message: string }>(context, `/doctors/${id}/hard`, {
    method: "DELETE",
  });
  if (!response.ok) return response;

  const parsed = doctorMessageResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al eliminar medico es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

