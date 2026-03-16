"use server";

import { fetchApi } from "@/actions/_lib/api";

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

export async function getOrCreateResultByServiceItem(serviceOrderItemId: number) {
  return fetchApi<StudyResult>(`/results/service-item/${serviceOrderItemId}`);
}

export async function createStudyResult(payload: CreateStudyResultPayload) {
  return fetchApi<CreateOrUpdateStudyResultResponse>("/results", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStudyResult(
  id: number,
  payload: UpdateStudyResultPayload,
) {
  return fetchApi<CreateOrUpdateStudyResultResponse>(`/results/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
