import { apiRequest, type ApiResult } from "@/lib/api/http-client";
import { authStore } from "@/lib/auth/auth-store";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";

export type StudyResultValue = {
  id: number;
  studyResultId: number;
  studyDetailId?: number | null;
  label: string;
  unit?: string | null;
  referenceValue?: string | null;
  value?: string | null;
  sortOrder: number;
  visible: boolean;
};

export type StudyResult = {
  id: number;
  serviceOrderId: number;
  serviceOrderItemId: number;
  sampleAt?: string | null;
  reportedAt?: string | null;
  method?: string | null;
  observations?: string | null;
  isDraft: boolean;
  isActive: boolean;
  values: StudyResultValue[];
  createdAt?: string;
  updatedAt?: string;
};

type CreateOrUpdateStudyResultResponse = {
  message: string;
  data: StudyResult;
};

export type StudyResultValuePayload = {
  studyDetailId?: number;
  label: string;
  unit?: string;
  referenceValue?: string;
  value?: string;
  sortOrder: number;
  visible: boolean;
};

export type CreateStudyResultPayload = {
  serviceOrderId: number;
  serviceOrderItemId: number;
  sampleAt?: string;
  reportedAt?: string;
  method?: string;
  observations?: string;
  isDraft?: boolean;
  values: StudyResultValuePayload[];
};

export type UpdateStudyResultPayload = Partial<CreateStudyResultPayload>;

async function createResultRequestContext() {
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

export async function getOrCreateResultByServiceItem(
  serviceOrderItemId: number,
): Promise<ApiResult<StudyResult>> {
  const context = await createResultRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<StudyResult>(
    context,
    `/results/service-item/${serviceOrderItemId}`,
  );
}

export async function createStudyResult(
  payload: CreateStudyResultPayload,
): Promise<ApiResult<CreateOrUpdateStudyResultResponse>> {
  const context = await createResultRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<CreateOrUpdateStudyResultResponse>(context, "/results", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStudyResult(
  id: number,
  payload: UpdateStudyResultPayload,
): Promise<ApiResult<CreateOrUpdateStudyResultResponse>> {
  const context = await createResultRequestContext();
  if (!context) {
    return { ok: false, errors: ["No hay una sesion activa."] };
  }

  return apiRequest<CreateOrUpdateStudyResultResponse>(context, `/results/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
