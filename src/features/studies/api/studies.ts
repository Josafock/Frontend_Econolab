import { z } from "zod";
import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";

export type StudyType = "study" | "package" | "other";
export type StudyStatus = "active" | "suspended";
export type StudyStatusFilter = StudyStatus | "all";
export type StudyTypeFilter = StudyType | "all";
export type StudyDetailDataType = "category" | "parameter";

const numericIntFieldSchema = z.coerce.number().int();
const nonNegativeNumericFieldSchema = z.coerce.number().min(0);

const studyTypeSchema = z.enum(["study", "package", "other"]);
const studyStatusSchema = z.enum(["active", "suspended"]);
const studyDetailDataTypeSchema = z.enum(["category", "parameter"]);

const studySchema = z.object({
  id: numericIntFieldSchema,
  name: z.string(),
  code: z.string(),
  description: z.string().nullable().optional(),
  durationMinutes: numericIntFieldSchema,
  type: studyTypeSchema,
  normalPrice: nonNegativeNumericFieldSchema,
  difPrice: nonNegativeNumericFieldSchema,
  specialPrice: nonNegativeNumericFieldSchema,
  hospitalPrice: nonNegativeNumericFieldSchema,
  otherPrice: nonNegativeNumericFieldSchema,
  defaultDiscountPercent: nonNegativeNumericFieldSchema,
  method: z.string().nullable().optional(),
  indicator: z.string().nullable().optional(),
  packageStudyIds: z.array(numericIntFieldSchema).optional().default([]),
  status: studyStatusSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const studyDetailSchema = z.object({
  id: numericIntFieldSchema,
  studyId: numericIntFieldSchema,
  parentId: numericIntFieldSchema.nullish(),
  dataType: studyDetailDataTypeSchema,
  name: z.string(),
  sortOrder: numericIntFieldSchema,
  unit: z.string().nullable().optional(),
  referenceValue: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const studiesSearchResponseSchema = z.object({
  data: z.array(studySchema),
  meta: z.object({
    page: numericIntFieldSchema,
    limit: numericIntFieldSchema,
    total: numericIntFieldSchema,
  }),
});

const createStudyPayloadSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50).optional(),
  autoGenerateCode: z.boolean().optional(),
  description: z.string().optional(),
  durationMinutes: numericIntFieldSchema.min(1),
  type: studyTypeSchema,
  normalPrice: nonNegativeNumericFieldSchema,
  difPrice: nonNegativeNumericFieldSchema,
  specialPrice: nonNegativeNumericFieldSchema,
  hospitalPrice: nonNegativeNumericFieldSchema,
  otherPrice: nonNegativeNumericFieldSchema,
  defaultDiscountPercent: nonNegativeNumericFieldSchema,
  method: z.string().optional(),
  indicator: z.string().optional(),
  packageStudyIds: z.array(numericIntFieldSchema).optional(),
  status: studyStatusSchema.optional(),
});

const updateStudyPayloadSchema = createStudyPayloadSchema.partial();

const createStudyDetailPayloadSchema = z.object({
  dataType: studyDetailDataTypeSchema,
  name: z.string().min(1).max(150),
  sortOrder: numericIntFieldSchema.min(1),
  unit: z.string().optional(),
  referenceValue: z.string().optional(),
  parentId: numericIntFieldSchema.min(1).optional(),
});

const updateStudyDetailPayloadSchema = z.object({
  dataType: studyDetailDataTypeSchema.optional(),
  name: z.string().min(1).max(150).optional(),
  sortOrder: numericIntFieldSchema.min(1).optional(),
  unit: z.string().optional(),
  referenceValue: z.string().optional(),
  parentId: z.union([numericIntFieldSchema.min(1), z.null()]).optional(),
});

const studyMutationResponseSchema = z.object({
  message: z.string(),
  data: studySchema,
});

const studyDetailMutationResponseSchema = z.object({
  message: z.string(),
  data: studyDetailSchema,
});

const messageResponseSchema = z.object({
  message: z.string(),
});

export type Study = z.infer<typeof studySchema>;
export type StudyDetail = z.infer<typeof studyDetailSchema>;
export type CreateStudyPayload = z.infer<typeof createStudyPayloadSchema>;
export type UpdateStudyPayload = z.infer<typeof updateStudyPayloadSchema>;
export type CreateStudyDetailPayload = z.infer<
  typeof createStudyDetailPayloadSchema
>;
export type UpdateStudyDetailPayload = z.infer<
  typeof updateStudyDetailPayloadSchema
>;

type StudiesSearchResponse = z.infer<typeof studiesSearchResponseSchema>;
type StudyMutationResponse = z.infer<typeof studyMutationResponseSchema>;
type StudyDetailMutationResponse = z.infer<
  typeof studyDetailMutationResponseSchema
>;
type MessageResponse = z.infer<typeof messageResponseSchema>;

async function createStudyRequestContext() {
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

export async function getStudies(params?: {
  search?: string;
  page?: number;
  limit?: number;
  type?: StudyType;
  status?: StudyStatus;
}): Promise<ApiResult<StudiesSearchResponse>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiRequest<StudiesSearchResponse>(
    context,
    `/studies${suffix}`,
  );
  if (!response.ok) return response;

  const parsed = studiesSearchResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false, errors: ["La respuesta de estudios es invalida."] };
  }

  return { ok: true, data: parsed.data };
}

export async function createStudy(
  payload: CreateStudyPayload,
): Promise<ApiResult<StudyMutationResponse>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const parsedPayload = createStudyPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message ?? "Datos de estudio invalidos.";
    return { ok: false, errors: [firstError] };
  }

  const response = await apiRequest<StudyMutationResponse>(context, "/studies", {
    method: "POST",
    body: JSON.stringify(parsedPayload.data),
  });

  if (!response.ok) return response;

  const parsed = studyMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false, errors: ["La respuesta al crear estudio es invalida."] };
  }

  return { ok: true, data: parsed.data };
}

export async function getSuggestedStudyCode(
  type: StudyType = "study",
): Promise<ApiResult<{ code: string }>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const response = await apiRequest<{ code: string }>(
    context,
    `/studies/next-code?type=${encodeURIComponent(type)}`,
  );
  if (!response.ok) return response;

  const parsed = z.object({ code: z.string().min(1) }).safeParse(response.data);
  if (!parsed.success) {
    return { ok: false, errors: ["La sugerencia de clave es invalida."] };
  }

  return { ok: true, data: parsed.data };
}

export async function getStudyById(id: number): Promise<ApiResult<Study>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const response = await apiRequest<Study>(context, `/studies/${id}`);
  if (!response.ok) return response;

  const parsed = studySchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta de detalle de estudio es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function updateStudy(
  id: number,
  payload: UpdateStudyPayload,
): Promise<ApiResult<StudyMutationResponse>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const parsedPayload = updateStudyPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message ?? "Datos de estudio invalidos.";
    return { ok: false, errors: [firstError] };
  }

  const response = await apiRequest<StudyMutationResponse>(
    context,
    `/studies/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(parsedPayload.data),
    },
  );

  if (!response.ok) return response;

  const parsed = studyMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al actualizar estudio es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function updateStudyStatus(
  id: number,
  status: StudyStatus,
): Promise<ApiResult<StudyMutationResponse>> {
  return updateStudy(id, { status });
}

export async function removeStudy(
  id: number,
): Promise<ApiResult<MessageResponse>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const response = await apiRequest<MessageResponse>(context, `/studies/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) return response;

  const parsed = messageResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al eliminar estudio es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function getStudyDetails(
  id: number,
): Promise<ApiResult<StudyDetail[]>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const response = await apiRequest<StudyDetail[]>(context, `/studies/${id}/details`);
  if (!response.ok) return response;

  const parsed = z.array(studyDetailSchema).safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta de detalle configurado es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function createStudyDetail(
  studyId: number,
  payload: CreateStudyDetailPayload,
): Promise<ApiResult<StudyDetailMutationResponse>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const parsedPayload = createStudyDetailPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message ?? "Datos de detalle invalidos.";
    return { ok: false, errors: [firstError] };
  }

  const response = await apiRequest<StudyDetailMutationResponse>(
    context,
    `/studies/${studyId}/details`,
    {
      method: "POST",
      body: JSON.stringify(parsedPayload.data),
    },
  );

  if (!response.ok) return response;

  const parsed = studyDetailMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false, errors: ["La respuesta al crear detalle es invalida."] };
  }

  return { ok: true, data: parsed.data };
}

export async function updateStudyDetail(
  detailId: number,
  payload: UpdateStudyDetailPayload,
): Promise<ApiResult<StudyDetailMutationResponse>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const parsedPayload = updateStudyDetailPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message ?? "Datos de detalle invalidos.";
    return { ok: false, errors: [firstError] };
  }

  const response = await apiRequest<StudyDetailMutationResponse>(
    context,
    `/studies/details/${detailId}`,
    {
      method: "PUT",
      body: JSON.stringify(parsedPayload.data),
    },
  );

  if (!response.ok) return response;

  const parsed = studyDetailMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al actualizar detalle es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function updateStudyDetailStatus(
  detailId: number,
  isActive: boolean,
): Promise<ApiResult<StudyDetailMutationResponse>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const response = await apiRequest<StudyDetailMutationResponse>(
    context,
    `/studies/details/${detailId}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ isActive }),
    },
  );

  if (!response.ok) return response;

  const parsed = studyDetailMutationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al cambiar estatus del detalle es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}

export async function removeStudyDetail(
  detailId: number,
): Promise<ApiResult<MessageResponse>> {
  const context = await createStudyRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  const response = await apiRequest<MessageResponse>(
    context,
    `/studies/details/${detailId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) return response;

  const parsed = messageResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: ["La respuesta al eliminar detalle es invalida."],
    };
  }

  return { ok: true, data: parsed.data };
}
