"use server";

import { fetchApi, type ApiResult } from "@/actions/_lib/api";
import { z } from "zod";

export type StudyType = "study" | "package" | "other";
export type StudyStatus = "active" | "suspended";

const numericFieldSchema = z.coerce.number();
const numericIntFieldSchema = z.coerce.number().int();
const nonNegativeNumericFieldSchema = z.coerce.number().min(0);

const studyTypeSchema = z.enum(["study", "package", "other"]);
const studyStatusSchema = z.enum(["active", "suspended"]);

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
  status: studyStatusSchema,
});

const studiesSearchResponseSchema = z.object({
  data: z.array(studySchema),
  meta: z.object({
    page: numericIntFieldSchema,
    limit: numericIntFieldSchema,
    total: numericIntFieldSchema,
  }),
});

const createStudyResponseSchema = z.object({
  message: z.string(),
  data: studySchema,
});

const createStudyPayloadSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
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
  status: studyStatusSchema.optional(),
});

export type Study = z.infer<typeof studySchema>;

type StudiesSearchResponse = z.infer<typeof studiesSearchResponseSchema>;
type CreateStudyResponse = z.infer<typeof createStudyResponseSchema>;
export type CreateStudyPayload = z.infer<typeof createStudyPayloadSchema>;

export async function getStudies(params?: {
  search?: string;
  page?: number;
  limit?: number;
  type?: StudyType;
  status?: StudyStatus;
}): Promise<ApiResult<StudiesSearchResponse>> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetchApi<StudiesSearchResponse>(`/studies${suffix}`);
  if (!response.ok) return response;

  const parsed = studiesSearchResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false, errors: ["La respuesta de estudios es invalida."] };
  }

  return { ok: true, data: parsed.data };
}

export async function createStudy(payload: CreateStudyPayload): Promise<ApiResult<CreateStudyResponse>> {
  const parsedPayload = createStudyPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    const firstError = parsedPayload.error.issues[0]?.message ?? "Datos de estudio invalidos.";
    return { ok: false, errors: [firstError] };
  }

  const response = await fetchApi<CreateStudyResponse>("/studies", {
    method: "POST",
    body: JSON.stringify(parsedPayload.data),
  });

  if (!response.ok) return response;

  const parsed = createStudyResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false, errors: ["La respuesta al crear estudio es invalida."] };
  }

  return { ok: true, data: parsed.data };
}
