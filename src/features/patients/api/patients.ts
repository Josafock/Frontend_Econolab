import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import {
  createPatientPayloadSchema,
  patientMessageResponseSchema,
  patientMutationResponseSchema,
  patientSchema,
  patientsSearchResponseSchema,
  updatePatientPayloadSchema,
  updatePatientStatusPayloadSchema,
  type CreatePatientPayload as CreatePatientPayloadInput,
  type Patient as PatientRecord,
  type PatientMutationResponse,
  type PatientsSearchResponse,
  type UpdatePatientPayload as UpdatePatientPayloadInput,
} from "@/schemas";

export type PatientGender = "male" | "female" | "other";
export type PatientStatusFilter = "all" | "active" | "inactive";

export type Patient = PatientRecord;
export type CreatePatientPayload = CreatePatientPayloadInput;
export type UpdatePatientPayload = UpdatePatientPayloadInput;

async function createPatientRequestContext() {
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

export async function getPatients(params?: {
  search?: string;
  page?: number;
  limit?: number;
  status?: PatientStatusFilter;
}): Promise<ApiResult<PatientsSearchResponse>> {
  const context = await createPatientRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiRequest<PatientsSearchResponse>(
    context,
    `/patients${suffix}`,
  );
  if (!response.ok) return response;

  const parsed = patientsSearchResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false, errors: ["La respuesta de pacientes es invalida."] };
  }

  return { ok: true, data: parsed.data };
}

export async function createPatient(
  payload: CreatePatientPayload,
): Promise<ApiResult<PatientMutationResponse>> {
  const context = await createPatientRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const parsedPayload = createPatientPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message ?? "Datos de paciente invalidos.";
    return { ok: false, errors: [firstError] };
  }

  const response = await apiRequest<PatientMutationResponse>(context, "/patients", {
    method: "POST",
    body: JSON.stringify(parsedPayload.data),
  });
  if (!response.ok) return response;

  const parsed = patientMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al crear paciente es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function getPatientById(id: number): Promise<ApiResult<Patient>> {
  const context = await createPatientRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const response = await apiRequest<Patient>(context, `/patients/${id}`);
  if (!response.ok) return response;

  const parsed = patientSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta del detalle de paciente es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function updatePatient(
  id: number,
  payload: UpdatePatientPayload,
): Promise<ApiResult<PatientMutationResponse>> {
  const context = await createPatientRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const parsedPayload = updatePatientPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message ?? "Datos de paciente invalidos.";
    return { ok: false, errors: [firstError] };
  }

  const response = await apiRequest<PatientMutationResponse>(
    context,
    `/patients/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(parsedPayload.data),
    },
  );
  if (!response.ok) return response;

  const parsed = patientMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al actualizar paciente es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function updatePatientStatus(
  id: number,
  isActive: boolean,
): Promise<ApiResult<PatientMutationResponse>> {
  const context = await createPatientRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const parsedPayload = updatePatientStatusPayloadSchema.safeParse({ isActive });
  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message ??
      "El estatus del paciente es invalido.";
    return { ok: false, errors: [firstError] };
  }

  const response = await apiRequest<PatientMutationResponse>(
    context,
    `/patients/${id}/status`,
    {
      method: "PUT",
      body: JSON.stringify(parsedPayload.data),
    },
  );
  if (!response.ok) return response;

  const parsed = patientMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al actualizar estatus es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function deactivatePatient(
  id: number,
): Promise<ApiResult<{ message: string }>> {
  const context = await createPatientRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const response = await apiRequest<{ message: string }>(context, `/patients/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) return response;

  const parsed = patientMessageResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al desactivar paciente es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}
